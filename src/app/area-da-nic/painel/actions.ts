"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { PRODUCTS_TAG } from "@/lib/products";
import { slugify, reaisToCents } from "@/lib/format";
import { validYarnIds } from "@/lib/yarn-colors";
import { categoriesForKind, CLOTHING_SIZES, type ProductDraft } from "@/lib/product-form";
import { DEFAULT_PACKAGE } from "@/lib/shipping";
import type { ProductStatus } from "@/lib/types";

export type SaveResult = { ok: boolean; error?: string };

/** Refresh every surface a product change can affect. */
function revalidateProduct(slug?: string) {
  // Drops the cached product queries (src/lib/products.ts) so the change is
  // visible right away despite the data cache.
  revalidateTag(PRODUCTS_TAG);
  revalidatePath("/");
  revalidatePath("/colecao");
  revalidatePath("/area-da-nic/painel");
  if (slug) revalidatePath(`/produto/${slug}`);
}

/** Build a slug that is unique across products (skips the product being edited). */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "peca";
  let slug = base;
  let n = 1;
  // Small catalogue — a simple loop is fine.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

/** "" -> null; otherwise a non-negative whole number of days. */
function parseDays(raw: string): number | null {
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** A positive whole number (grams/cm), falling back to the bag default. */
function parseDim(raw: string, fallback: number): number {
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function normalize(draft: ProductDraft) {
  const kind = draft.kind === "CLOTHING" ? "CLOTHING" : "BAG";
  const validCats = categoriesForKind(kind);
  const category = validCats.includes(draft.category) ? draft.category : validCats[0];
  // Sizes only apply to clothing, and only the known grade.
  const sizes =
    kind === "CLOTHING"
      ? (CLOTHING_SIZES as readonly string[]).filter((s) => draft.sizes.includes(s))
      : [];
  return {
    name: draft.name.trim(),
    kind: kind as "BAG" | "CLOTHING",
    category,
    sizes,
    priceCents: reaisToCents(draft.priceReais),
    status: draft.status,
    featured: !!draft.featured,
    colors: validYarnIds(draft.colors),
    allowsMultipleColors: !!draft.allowsMultipleColors,
    leadTimeMinDays: parseDays(draft.leadTimeMinDays),
    leadTimeMaxDays: parseDays(draft.leadTimeMaxDays),
    weightGrams: parseDim(draft.weightGrams, DEFAULT_PACKAGE.weightGrams),
    heightCm: parseDim(draft.heightCm, DEFAULT_PACKAGE.heightCm),
    widthCm: parseDim(draft.widthCm, DEFAULT_PACKAGE.widthCm),
    lengthCm: parseDim(draft.lengthCm, DEFAULT_PACKAGE.lengthCm),
    tag: draft.tag.trim() || null,
    description: draft.description.trim(),
    details: draft.detailsText
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean),
    photos: draft.photos.filter(Boolean),
  };
}

function validate(data: ReturnType<typeof normalize>): string | null {
  const noun = data.kind === "CLOTHING" ? "a roupa" : "a bolsa";
  if (!data.name) return `Dê um nome para ${noun}.`;
  if (data.priceCents <= 0) return "Informe um preço válido.";
  const { leadTimeMinDays: min, leadTimeMaxDays: max } = data;
  if (min != null && max != null && max < min) {
    return "O prazo máximo não pode ser menor que o mínimo.";
  }
  return null;
}

export async function createProduct(draft: ProductDraft): Promise<SaveResult> {
  await requireAdmin();
  const data = normalize(draft);
  const error = validate(data);
  if (error) return { ok: false, error };

  const slug = await uniqueSlug(data.name);
  await prisma.product.create({ data: { ...data, slug } });
  revalidateProduct(slug);
  return { ok: true };
}

export async function updateProduct(id: string, draft: ProductDraft): Promise<SaveResult> {
  await requireAdmin();
  const data = normalize(draft);
  const error = validate(data);
  if (error) return { ok: false, error };

  const existing = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return { ok: false, error: "Bolsa não encontrada." };

  const slug = await uniqueSlug(data.name, id);
  await prisma.product.update({ where: { id }, data: { ...data, slug } });
  revalidateProduct(slug);
  revalidateProduct(existing.slug); // in case the slug changed
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  await prisma.product.delete({ where: { id } });
  revalidateProduct(p?.slug);
}

export async function setProductStatus(id: string, status: ProductStatus): Promise<void> {
  await requireAdmin();
  const p = await prisma.product.update({
    where: { id },
    data: { status },
    select: { slug: true },
  });
  revalidateProduct(p.slug);
}

export async function toggleFeatured(id: string, featured: boolean): Promise<void> {
  await requireAdmin();
  const p = await prisma.product.update({
    where: { id },
    data: { featured },
    select: { slug: true },
  });
  revalidateProduct(p.slug);
}
