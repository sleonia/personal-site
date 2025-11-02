// build.mjs
import { minify } from "minify";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const srcDir = process.cwd();
const buildDir = path.join(srcDir, "build");

async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
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

  // Copy static assets (fonts + images) if they exist
  const fontsSrc = path.join(srcDir, "fonts");
  const imagesSrc = path.join(srcDir, "images");
  if (fs.existsSync(fontsSrc)) {
    await copyDir(fontsSrc, path.join(buildDir, "fonts"));
    console.log("📦 Copied fonts");
  }
  if (fs.existsSync(imagesSrc)) {
    await copyDir(imagesSrc, path.join(buildDir, "images"));
    console.log("📦 Copied images");
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
