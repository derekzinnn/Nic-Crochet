// One-off: pad any stored product photo that isn't 3:4 onto a 3:4 cream canvas,
// in place (same storage URL). iPhone portraits are already 3:4 and are skipped;
// only off-ratio shots (landscape/square) are fixed, so they stop getting cropped
// by the object-cover cards. Run: `node scripts/normalize-photo-ratio.mjs`
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

nextEnv.loadEnvConfig(process.cwd());

const MAX_EDGE = 1400;
const WEBP_QUALITY = 80;
const TARGET_RATIO = 3 / 4; // width / height
const RATIO_TOLERANCE = 0.01; // treat near-3:4 as already fine
const PAD_BG = { r: 251, g: 248, b: 241 }; // site cream (#FBF8F1)
const BUCKET = "product-photos";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function pathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

const products = await prisma.product.findMany({
  where: { photos: { isEmpty: false } },
  select: { name: true, photos: true },
});

let fixed = 0;
let skipped = 0;

for (const p of products) {
  for (const url of p.photos) {
    const path = pathFromUrl(url);
    if (!path) continue;

    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      console.log(`  ! ${p.name} — falha ao baixar ${path}: ${error?.message}`);
      continue;
    }
    const input = Buffer.from(await data.arrayBuffer());
    const meta = await sharp(input).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const ratio = h > 0 ? w / h : TARGET_RATIO;

    if (Math.abs(ratio - TARGET_RATIO) <= RATIO_TOLERANCE) {
      skipped++;
      continue;
    }

    const resized = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .toBuffer();
    const rm = await sharp(resized).metadata();
    const rw = rm.width ?? 0;
    const rh = rm.height ?? 0;
    const rr = rh > 0 ? rw / rh : TARGET_RATIO;

    let canvasW = rw;
    let canvasH = rh;
    if (rr > TARGET_RATIO) canvasH = Math.round(rw / TARGET_RATIO);
    else if (rr < TARGET_RATIO) canvasW = Math.round(rh * TARGET_RATIO);

    const top = Math.floor((canvasH - rh) / 2);
    const bottom = canvasH - rh - top;
    const left = Math.floor((canvasW - rw) / 2);
    const right = canvasW - rw - left;

    const output = await sharp(resized)
      .extend({ top, bottom, left, right, background: PAD_BG })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, output, { contentType: "image/webp", upsert: true });
    if (upErr) {
      console.log(`  ! ${p.name} — falha ao regravar ${path}: ${upErr.message}`);
      continue;
    }
    fixed++;
    console.log(
      `  ✓ ${p.name}: ${rw}x${rh} (ratio ${rr.toFixed(2)}) → ${canvasW}x${canvasH} 3:4  (${path.split("/").pop()})`,
    );
  }
}

console.log(`\nPronto. ${fixed} foto(s) padronizada(s) para 3:4, ${skipped} já estavam ok.`);
await prisma.$disconnect();
