// Generates the site icons from the brand monogram (the "n" from Logo.tsx).
// The storefront logo is an outlined circle with a hairline italic "n" — that
// turns to mush at 16px, so the icon uses the solid adaptation: a filled sage
// disc with a cream "n". Run: `node scripts/make-favicon.mjs`
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const SAGE = "#8B9A60";
const CREAM = "#FBF8F1";

/** Brand monogram as an SVG at an arbitrary size. */
function monogram(size, { bleed = true } = {}) {
  const r = bleed ? size / 2 : size * 0.47;
  // Sized generously: at 16px a timid monogram just reads as a blob.
  const fontSize = size * 0.78;
  // Optical centering: serif lowercase "n" sits high, so nudge the baseline down.
  const baseline = size * 0.735;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${SAGE}"/>
  <text x="${size / 2}" y="${baseline}"
        font-family="Cormorant Garamond, Georgia, 'Times New Roman', serif"
        font-style="italic" font-weight="600" font-size="${fontSize}"
        fill="${CREAM}" text-anchor="middle">n</text>
</svg>`;
}

const targets = [
  // Next.js App Router picks these up automatically from src/app.
  { file: "src/app/icon.png", size: 512 },
  { file: "src/app/apple-icon.png", size: 180 },
];

for (const t of targets) {
  const png = await sharp(Buffer.from(monogram(t.size))).png().toBuffer();
  await writeFile(t.file, png);
  console.log(`  ✓ ${t.file} (${t.size}×${t.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

// A small preview sheet to eyeball how it reads at real tab sizes.
const previews = await Promise.all(
  [16, 32, 64].map((s) => sharp(Buffer.from(monogram(s))).png().toBuffer()),
);
const sheet = await sharp({
  create: { width: 140, height: 70, channels: 4, background: "#FFFFFF" },
})
  .composite([
    { input: previews[0], top: 27, left: 10 },
    { input: previews[1], top: 19, left: 40 },
    { input: previews[2], top: 3, left: 90 },
  ])
  .png()
  .toBuffer();
await writeFile("scripts/_favicon-preview.png", sheet);
console.log("  ✓ preview em scripts/_favicon-preview.png (16 / 32 / 64 px)");
