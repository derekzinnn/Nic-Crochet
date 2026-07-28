// One-off: re-compress product photos already in Supabase Storage in place.
// Downloads each stored object, resizes + re-encodes to WebP, and overwrites the
// SAME storage path (upsert) so the public URL — and every DB reference — is
// unchanged. Skips objects that are already small. Run: `node scripts/recompress-photos.mjs`
import nextEnv from "@next/env";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

nextEnv.loadEnvConfig(process.cwd());

const MAX_EDGE = 1400;
const WEBP_QUALITY = 80;
const SKIP_UNDER = 450 * 1024; // already lean enough — leave it
const BUCKET = "product-photos";

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// public URL → storage path within the bucket
function pathFromUrl(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

const products = await prisma.product.findMany({
  where: { photos: { isEmpty: false } },
  select: { id: true, name: true, photos: true },
});

let processed = 0;
let skipped = 0;
let saved = 0;

for (const p of products) {
  for (const url of p.photos) {
    const path = pathFromUrl(url);
    if (!path) {
      console.log(`  ? URL fora do bucket, ignorada: ${url}`);
      continue;
    }
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) {
      console.log(`  ! ${p.name} — falha ao baixar ${path}: ${error?.message}`);
      continue;
    }
    const input = Buffer.from(await data.arrayBuffer());
    if (input.byteLength < SKIP_UNDER) {
      skipped++;
      continue;
    }
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, output, { contentType: "image/webp", upsert: true });
    if (upErr) {
      console.log(`  ! ${p.name} — falha ao regravar ${path}: ${upErr.message}`);
      continue;
    }
    const before = (input.byteLength / 1024).toFixed(0);
    const after = (output.byteLength / 1024).toFixed(0);
    saved += input.byteLength - output.byteLength;
    processed++;
    console.log(`  ✓ ${p.name}: ${before} KB → ${after} KB  (${path.split("/").pop()})`);
  }
}

console.log(
  `\nPronto. ${processed} foto(s) recomprimida(s), ${skipped} já estavam ok. ` +
    `Economia total: ${(saved / 1024 / 1024).toFixed(1)} MB.`,
);
await prisma.$disconnect();
