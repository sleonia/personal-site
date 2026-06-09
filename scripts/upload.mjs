#!/usr/bin/env node

/**
 * Upload static site files to Yandex Cloud Storage
 * Compatible with S3 API
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Main entry point
(async () => {
  // Load .env file if it exists
  try {
    const dotenv = await import("dotenv");
    if (existsSync(".env")) {
      dotenv.config();
      console.log("Loaded .env file\n");
    }
  } catch (e) {
    // dotenv not installed, that's okay - use environment variables directly
  }

  // Configuration from environment variables
  const config = {
    endpoint: process.env.YC_ENDPOINT || "https://storage.yandexcloud.net",
    region: process.env.YC_REGION || "ru-central1",
    bucket: process.env.YC_BUCKET || process.env.S3_BUCKET,
    accessKeyId: process.env.YC_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.YC_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    // Deploy the built output by default — uploading the repo root would ship
    // unminified source plus the large pre-subset .otf. Override with UPLOAD_ROOT.
    rootPath: process.env.UPLOAD_ROOT || "build",
  };

  // Validate configuration
  if (!config.bucket) {
    console.error(
      "Error: YC_BUCKET or S3_BUCKET environment variable is required",
    );
    process.exit(1);
  }

  if (!config.accessKeyId || !config.secretAccessKey) {
    console.error(
      "Error: YC_ACCESS_KEY_ID and YC_SECRET_ACCESS_KEY (or AWS equivalents) are required",
    );
    process.exit(1);
  }

  // Initialize S3 client
  const s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Yandex Cloud requires path-style addressing
    forcePathStyle: true,
  });

  /**
   * Get MIME type based on file extension
   */
  function getContentType(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    const mimeTypes = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      mjs: "application/javascript",
      json: "application/json",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      avif: "image/avif",
      webp: "image/webp",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      txt: "text/plain; charset=utf-8",
      xml: "application/xml",
      md: "text/markdown; charset=utf-8",
      webmanifest: "application/manifest+json",
      woff2: "font/woff2",
      woff: "font/woff",
      otf: "font/otf",
      ttf: "font/ttf",
    };
    const type = mimeTypes[ext];
    if (!type) {
      // An unmapped type is served as a download (octet-stream) and only gets a
      // 1h cache — surface it so a new file type isn't silently mis-served.
      console.warn(
        `Warning: no content-type for "${filename}" (ext "${ext}") — using application/octet-stream`,
      );
      return "application/octet-stream";
    }
    return type;
  }

  /**
   * Recursively get all files in a directory
   */
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = readdirSync(dirPath);

    files.forEach((file) => {
      // Never publish OS metadata junk to the bucket.
      if (file === ".DS_Store" || file === "Thumbs.db") return;
      const filePath = join(dirPath, file);
      if (statSync(filePath).isDirectory()) {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }

  /**
   * Upload a single file to S3
   */
  async function uploadFile(localPath, remotePath, contentType) {
    try {
      const fileContent = readFileSync(localPath);

      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: remotePath,
        Body: fileContent,
        ContentType: contentType,
        // Cache control for better performance
        CacheControl: getCacheControl(localPath),
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`Failed to upload ${localPath}:`, error.message);
      return false;
    }
  }

  /**
   * Get cache control headers based on file type
   */
  function getCacheControl(filePath) {
    const ext = filePath.split(".").pop().toLowerCase();

    // HTML must always revalidate, but must NOT be no-store: no-store
    // disqualifies the document from the back/forward cache (bfcache).
    // (no-cache means "revalidate before reuse", not "don't store".)
    if (ext === "html") {
      return "no-cache, must-revalidate";
    }

    // Code and fonts can be cached for a long time.
    // NOTE: these filenames (and the images below) are not fingerprinted, so a
    // redeploy of an unchanged name won't bust the cache for up to a year.
    // Fingerprint (e.g. styles.[hash].css) if/when these change often.
    if (["css", "js", "mjs", "woff2", "woff", "otf", "ttf"].includes(ext)) {
      return "public, max-age=31536000, immutable";
    }

    // Images can be cached for a long time (same fingerprinting caveat as above).
    if (
      ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif", "ico"].includes(ext)
    ) {
      return "public, max-age=31536000, immutable";
    }

    return "public, max-age=3600";
  }

  /**
   * Main upload function
   */
  async function uploadFiles() {
    const rootDir = join(__dirname, "..", config.rootPath);
    if (!existsSync(rootDir)) {
      console.error(
        `Error: upload root "${config.rootPath}" not found at ${rootDir}.\n` +
          `Run "npm run build" first, or set UPLOAD_ROOT to the directory to deploy.`,
      );
      process.exit(1);
    }
    const filesToUpload = [
      "index.html",
      "index.md",
      "css/",
      "js/",
      "images/",
      "fonts/",
      "robots.txt",
      "sitemap.xml",
      "site.webmanifest",
      "llms.txt",
      "favicon.ico",
      // Google Search Console ownership token — keep deploying it; deleting it
      // revokes verification.
      "google7888559aa0d55380.html",
      ".well-known/",
    ];

    console.log("Starting upload to Yandex Cloud Storage...\n");
    console.log(`Bucket: ${config.bucket}`);
    console.log(`Endpoint: ${config.endpoint}`);
    console.log(`Root directory: ${rootDir}\n`);

    const allFiles = [];

    // Collect all files to upload. Everything listed is deploy-critical, so a
    // missing entry must fail the deploy — not warn-and-continue, which would
    // ship a site with 404ing assets and still print "Upload complete!".
    filesToUpload.forEach((item) => {
      const itemPath = join(rootDir, item);

      let stat;
      try {
        stat = statSync(itemPath);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.error(
            `Error: required path not found: ${item} (${itemPath})`,
          );
          process.exit(1);
        }
        throw error; // EACCES / ENOTDIR / etc. should surface, not look "missing"
      }

      if (stat.isFile()) {
        allFiles.push(itemPath);
      } else if (stat.isDirectory()) {
        allFiles.push(...getAllFiles(itemPath));
      }
    });

    if (allFiles.length === 0) {
      console.error("No files found to upload");
      process.exit(1);
    }

    console.log(`Found ${allFiles.length} file(s) to upload\n`);

    let successCount = 0;
    let failCount = 0;

    for (const filePath of allFiles) {
      const relativePath = relative(rootDir, filePath);
      const contentType = getContentType(relativePath);
      const s3Key = relativePath.replace(/\\/g, "/");

      process.stdout.write(`Uploading: ${s3Key}... `);

      const success = await uploadFile(filePath, s3Key, contentType);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`Successfully uploaded: ${successCount} file(s)`);
    if (failCount > 0) {
      console.log(`Failed: ${failCount} file(s)`);
    }
    console.log("=".repeat(50));

    if (failCount === 0) {
      console.log(`\nUpload complete! Your site is available at:`);
      console.log(
        `   https://${config.bucket}.storage.yandexcloud.net/index.html`,
      );
      console.log(`   or`);
      console.log(
        `   https://storage.yandexcloud.net/${config.bucket}/index.html`,
      );
    } else {
      process.exit(1);
    }
  }

  // Run the upload
  await uploadFiles();
})().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
