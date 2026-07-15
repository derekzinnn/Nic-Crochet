"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { slugify, reaisToCents } from "@/lib/format";
import { validYarnIds } from "@/lib/yarn-colors";
import type { ProductDraft } from "@/lib/product-form";
import type { ProductStatus } from "@/lib/types";

export type SaveResult = { ok: boolean; error?: string };

/** Refresh every surface a product change can affect. */
function revalidateProduct(slug?: string) {
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

function normalize(draft: ProductDraft) {
  return {
    name: draft.name.trim(),
    category: draft.category.trim() || "Tote",
    priceCents: reaisToCents(draft.priceReais),
    status: draft.status,
    featured: !!draft.featured,
    colors: validYarnIds(draft.colors),
    allowsMultipleColors: !!draft.allowsMultipleColors,
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
  if (!data.name) return "Dê um nome para a bolsa.";
  if (data.priceCents <= 0) return "Informe um preço válido.";
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
