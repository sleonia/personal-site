// build.mjs
import { minify } from "minify";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const srcDir = process.cwd();
const buildDir = path.join(srcDir, "build");

async function copyDir(src, dest, skip = () => false) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    // Never ship OS metadata junk.
    if (entry.name === ".DS_Store" || entry.name === "Thumbs.db") continue;
    if (!entry.isDirectory() && skip(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, skip);
    } else {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

async function removeDir(dir) {
  if (fs.existsSync(dir)) {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

function listFilesSync(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFilesSync(p));
    else out.push(p);
  }
  return out;
}

/**
 * Minify a file with automatic .mjs -> .js workaround.
 * - srcPath: path to original file (can be .js/.mjs/.css/.html)
 * - destPath: path to write minified output
 */
async function minifyWithMjsWorkaround(srcPath, destPath) {
  try {
    // try directly first
    const result = await minify(srcPath);
    await fsp.writeFile(destPath, result);
    return;
  } catch (err) {
    // If error mentions "mjs" or "File type" then try fallback
    const msg = String(err?.message || err);
    if (!/mjs|File type/i.test(msg)) throw err;

    // create a temp .js copy and minify that
    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "minify-"));
    const tmpJs = path.join(
      tmpDir,
      path.basename(srcPath).replace(/\.mjs$/, ".js"),
    );
    try {
      const content = await fsp.readFile(srcPath, "utf8");
      await fsp.writeFile(tmpJs, content, "utf8");

      const minified = await minify(tmpJs);
      await fsp.writeFile(destPath, minified, "utf8");
    } finally {
      // cleanup temp dir
      try {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      } catch (_) {}
    }
  }
}

async function runBuild() {
  // Clean/create build folder
  await removeDir(buildDir);
  await fsp.mkdir(buildDir, { recursive: true });
  console.log("🧹 Cleaned old build");

  // Copy static root files. Each is referenced by index.html or required by the
  // deploy, so a missing one is a build error — not something to skip silently
  // (which would 404 in production with a green build).
  const rootFiles = [
    "robots.txt",
    "site.webmanifest",
    "llms.txt",
    "index.md",
    "favicon.ico",
    // Google Search Console ownership token — must stay served verbatim or
    // verification is revoked. Copied as-is (not minified).
    "google7888559aa0d55380.html",
  ];
  for (const file of rootFiles) {
    const srcPath = path.join(srcDir, file);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing required root file: ${file}`);
    }
    await fsp.copyFile(srcPath, path.join(buildDir, file));
    console.log(`📄 Copied ${file}`);
  }

  // Update sitemap lastmod to build date and write to build
  const sitemapSrc = path.join(srcDir, "sitemap.xml");
  if (!fs.existsSync(sitemapSrc)) {
    throw new Error("Missing sitemap.xml at project root.");
  }
  const buildDate = new Date().toISOString().slice(0, 10);
  const sitemapRaw = await fsp.readFile(sitemapSrc, "utf8");
  let sitemapOut = sitemapRaw;
  if (/<lastmod>.*?<\/lastmod>/s.test(sitemapRaw)) {
    sitemapOut = sitemapRaw.replace(
      /<lastmod>.*?<\/lastmod>/g,
      `<lastmod>${buildDate}</lastmod>`,
    );
  } else {
    sitemapOut = sitemapRaw.replace(
      /<loc>(.*?)<\/loc>/g,
      `<loc>$1</loc>\n    <lastmod>${buildDate}</lastmod>`,
    );
  }

  await fsp.writeFile(path.join(buildDir, "sitemap.xml"), sitemapOut, "utf8");
  console.log("🗺️  Wrote sitemap.xml with build lastmod");

  // Copy static assets (fonts + images) if they exist
  const fontsSrc = path.join(srcDir, "fonts");
  const imagesSrc = path.join(srcDir, "images");
  if (fs.existsSync(fontsSrc)) {
    // Ship the subset .woff2 (plus the font's license files); the large source
    // .otf is the input to `npm run build:font` and is excluded from the deploy.
    await copyDir(fontsSrc, path.join(buildDir, "fonts"), (name) =>
      name.endsWith(".otf"),
    );
    // Guard against shipping an empty fonts dir (e.g. build:font never ran, so
    // only the now-excluded .otf existed) and logging it as success.
    const hasWoff2 = listFilesSync(path.join(buildDir, "fonts")).some((f) =>
      f.endsWith(".woff2"),
    );
    if (!hasWoff2) {
      throw new Error(
        "No .woff2 in build/fonts — run `npm run build:font` to generate the subset font.",
      );
    }
    console.log("📦 Copied fonts (source .otf excluded)");
  }
  if (fs.existsSync(imagesSrc)) {
    await copyDir(imagesSrc, path.join(buildDir, "images"));
    console.log("📦 Copied images");
  }

  // Copy /.well-known (security.txt, etc.) verbatim
  const wellKnownSrc = path.join(srcDir, ".well-known");
  if (fs.existsSync(wellKnownSrc)) {
    await copyDir(wellKnownSrc, path.join(buildDir, ".well-known"));
    console.log("📦 Copied .well-known");
  }

  // Ensure css/js folders exist in build
  await fsp.mkdir(path.join(buildDir, "css"), { recursive: true });
  await fsp.mkdir(path.join(buildDir, "js"), { recursive: true });

  // Minify HTML
  const htmlSrc = path.join(srcDir, "index.html");
  if (fs.existsSync(htmlSrc)) {
    try {
      const htmlMin = await minify(htmlSrc);
      await fsp.writeFile(path.join(buildDir, "index.html"), htmlMin, "utf8");
      console.log("🪶 Minified HTML");
    } catch (err) {
      console.error("HTML minify failed:", err);
      throw err;
    }
  }

  // Minify CSS
  const cssSrc = path.join(srcDir, "css", "styles.css");
  if (fs.existsSync(cssSrc)) {
    try {
      const cssMin = await minify(cssSrc);
      await fsp.writeFile(
        path.join(buildDir, "css", "styles.css"),
        cssMin,
        "utf8",
      );
      console.log("🎨 Minified CSS");
    } catch (err) {
      console.error("CSS minify failed:", err);
      throw err;
    }
  }

  // Minify JS (handle .mjs)
  const jsSrc = path.join(srcDir, "js", "main.mjs");
  const jsDest = path.join(buildDir, "js", "main.mjs");
  if (fs.existsSync(jsSrc)) {
    try {
      await minifyWithMjsWorkaround(jsSrc, jsDest);
      console.log("⚙️ Minified JS (main.mjs)");
    } catch (err) {
      console.error("JS minify failed:", err);
      throw err;
    }
  } else {
    // also try .js fallback name
    const altJsSrc = path.join(srcDir, "js", "main.js");
    if (fs.existsSync(altJsSrc)) {
      try {
        const jsMin = await minify(altJsSrc);
        await fsp.writeFile(
          path.join(buildDir, "js", "main.js"),
          jsMin,
          "utf8",
        );
        console.log("⚙️ Minified JS (main.js)");
      } catch (err) {
        console.error("JS minify failed:", err);
        throw err;
      }
    }
  }

  console.log("\n✅ Build complete! Output in /build");
}

runBuild().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
