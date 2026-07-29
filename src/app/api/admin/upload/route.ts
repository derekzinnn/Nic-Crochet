import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { getSupabaseAdmin, STORAGE_BUCKET, storagePublicUrl } from "@/lib/supabase";

// sharp is a native module — force the Node.js runtime (not edge).
export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB — raw iPhone shots are heavy; we compress below.
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

// Product photos render at most ~450px wide (3:4 portrait). Cap the long edge at
// 1400px so retina screens stay crisp while the stored file drops from multi-MB
// iPhone originals to a couple hundred KB — the whole point of this route.
const MAX_EDGE = 1400;
const WEBP_QUALITY = 80;
// Cards/modal use a fixed 3:4 box with object-cover, so any non-3:4 photo gets
// cropped. iPhone portraits are already 3:4 (untouched); off-ratio shots are
// padded onto a 3:4 cream canvas so the whole piece stays visible, never cropped.
const TARGET_RATIO = 3 / 4; // width / height
const PAD_BG = { r: 251, g: 248, b: 241 }; // site cream (#FBF8F1)

/** Resize within MAX_EDGE, pad to a 3:4 canvas, and encode to WebP. */
async function toStorageWebp(input: Buffer): Promise<Buffer> {
  const resized = await sharp(input)
    .rotate() // bake in EXIF orientation before it's dropped
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const ratio = h > 0 ? w / h : TARGET_RATIO;

  let canvasW = w;
  let canvasH = h;
  if (ratio > TARGET_RATIO)
    canvasH = Math.round(w / TARGET_RATIO); // too wide → pad top/bottom
  else if (ratio < TARGET_RATIO) canvasW = Math.round(h * TARGET_RATIO); // too tall → pad sides

  const top = Math.floor((canvasH - h) / 2);
  const bottom = canvasH - h - top;
  const left = Math.floor((canvasW - w) / 2);
  const right = canvasW - w - left;

  let pipe = sharp(resized);
  if (top || bottom || left || right) {
    pipe = pipe.extend({ top, bottom, left, right, background: PAD_BG });
  }
  return pipe.webp({ quality: WEBP_QUALITY }).toBuffer();
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máx. 12 MB)." }, { status: 400 });
  }

  let optimized: Buffer;
  try {
    optimized = await toStorageWebp(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "Não foi possível processar a imagem." }, { status: 400 });
  }

  const path = `products/${crypto.randomUUID()}.webp`;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, optimized, { contentType: "image/webp", upsert: false });
    if (error) {
      return NextResponse.json({ error: `Falha no upload: ${error.message}` }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Storage indisponível: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: storagePublicUrl(path) });
}
