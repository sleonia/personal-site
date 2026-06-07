#!/usr/bin/env node

/**
 * Subset the pixel display font to the glyphs the site actually renders and
 * emit a compressed WOFF2. The source OTF ships every glyph (~473KB); the page
 * only uses Basic Latin (incl. uppercase produced by text-transform), a few
 * punctuation marks, and the bullet "•". Re-run after changing the source font:
 *   npm run build:font
 */

import subsetFont from "subset-font";
import { readFile, writeFile } from "node:fs/promises";

const SRC = "fonts/Digital_Pixel_V124/DigitalPixelV124-Regular.otf";
const OUT = "fonts/Digital_Pixel_V124/DigitalPixelV124-Regular.woff2";

// Printable ASCII (space..~) covers the headings and labels rendered in the
// pixel font. We also append a small safety margin of typographic punctuation
// the page uses or might use (NBSP, en/em dash, curly quotes, ellipsis,
// bullet); over-including a handful of glyphs is cheap at this font size.
let chars = "";
for (let c = 0x20; c <= 0x7e; c++) chars += String.fromCodePoint(c);
chars += " –—‘’“”•…";

// subset-font silently drops glyphs the source lacks, and a degenerate result
// would otherwise be written and shipped (the page would fall back to a system
// font with no warning). Fail loudly instead of overwriting OUT with junk.
try {
  const src = await readFile(SRC);
  const woff2 = await subsetFont(src, chars, { targetFormat: "woff2" });
  if (!woff2 || woff2.length < 256) {
    throw new Error(
      `subset produced a suspiciously small WOFF2 (${woff2?.length ?? 0} bytes)`,
    );
  }
  await writeFile(OUT, woff2);
  console.log(
    `Wrote ${OUT}: ${(woff2.length / 1024).toFixed(1)}KB (from ${(src.length / 1024).toFixed(1)}KB OTF)`,
  );
} catch (err) {
  const hint =
    err.code === "ENOENT"
      ? ` — is ${SRC} present? Run from the project root.`
      : "";
  console.error(`build:font failed: ${err.message}${hint}`);
  process.exit(1);
}
