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

  // Resize + re-encode to WebP. `rotate()` with no args bakes in the EXIF
  // orientation so iPhone portraits don't come out sideways once EXIF is dropped.
  let optimized: Buffer;
  try {
    optimized = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
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
