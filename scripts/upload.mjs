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
    rootPath: process.env.UPLOAD_ROOT || ".",
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
      ico: "image/x-icon",
      txt: "text/plain",
      xml: "application/xml",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  /**
   * Recursively get all files in a directory
   */
  function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = readdirSync(dirPath);

    files.forEach((file) => {
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

    // HTML should not be cached aggressively
    if (ext === "html") {
      return "no-cache, no-store, must-revalidate";
    }

    // CSS and JS can be cached
    if (ext === "css" || ext === "js") {
      return "public, max-age=31536000, immutable";
    }

    // Images can be cached for a long time
    if (["jpg", "jpeg", "png", "gif", "svg", "webp", "ico"].includes(ext)) {
      return "public, max-age=31536000, immutable";
    }

    return "public, max-age=3600";
  }

  /**
   * Main upload function
   */
  async function uploadFiles() {
    const rootDir = join(__dirname, "..", config.rootPath);
    const filesToUpload = [
      "index.html",
      "css/",
      "js/",
      "images/",
      "fonts/",
      "robots.txt",
      "sitemap.xml",
      "site.webmanifest",
    ];

    console.log("Starting upload to Yandex Cloud Storage...\n");
    console.log(`Bucket: ${config.bucket}`);
    console.log(`Endpoint: ${config.endpoint}`);
    console.log(`Root directory: ${rootDir}\n`);

    const allFiles = [];

    // Collect all files to upload
    filesToUpload.forEach((item) => {
      const itemPath = join(rootDir, item);

      try {
        if (statSync(itemPath).isFile()) {
          allFiles.push(itemPath);
        } else if (statSync(itemPath).isDirectory()) {
          const dirFiles = getAllFiles(itemPath);
          allFiles.push(...dirFiles);
        }
      } catch (error) {
        console.warn(`Warning: ${item} not found, skipping...`);
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
