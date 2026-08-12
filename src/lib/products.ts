import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductView } from "@/lib/types";
import { swatchFromColors } from "@/lib/yarn-colors";

type DbProduct = Prisma.ProductGetPayload<object>;

function toView(p: DbProduct): ProductView {
  const swatch = swatchFromColors(p.colors);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    kind: p.kind,
    sizes: p.sizes,
    category: p.category,
    priceCents: p.priceCents,
    description: p.description,
    details: p.details,
    photos: p.photos,
    status: p.status,
    tag: p.tag,
    featured: p.featured,
    colors: p.colors,
    allowsMultipleColors: p.allowsMultipleColors,
    leadTimeMinDays: p.leadTimeMinDays,
    leadTimeMaxDays: p.leadTimeMaxDays,
    weightGrams: p.weightGrams,
    heightCm: p.heightCm,
    widthCm: p.widthCm,
    lengthCm: p.lengthCm,
    colorPrimary: swatch.primary,
    colorSecondary: swatch.secondary,
  };
}

/**
 * DB reads with a transient-error guard: retry once (short backoff) to ride out
 * a Supabase/pooler blip, and if it still fails return an empty result
 * (`[]` / `null`) so the store just renders nothing rather than crashing — real
 * data is the only thing customers ever see. The error is always logged so a
 * genuine outage is visible in the container logs.
 */
async function withFallback<T>(query: () => Promise<T>, empty: T): Promise<T> {
  const attempts = 2;
  for (let i = 0; i < attempts; i++) {
    try {
      return await query();
    } catch (err) {
      console.error(`[products] DB read failed (try ${i + 1}/${attempts}):`, (err as Error).message);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 150));
    }
  }
  return empty;
}

/**
 * Product reads are cached under a shared tag so repeated renders don't hit
 * Supabase every time. Any admin mutation calls `revalidateTag(PRODUCTS_TAG)`,
 * so Nic's changes still show up immediately.
 */
export const PRODUCTS_TAG = "products";

function cached<T>(keyParts: string[], fn: () => Promise<T>): () => Promise<T> {
  return unstable_cache(fn, ["products", ...keyParts], {
    tags: [PRODUCTS_TAG],
    revalidate: 300,
  });
}

export async function getAllProducts(): Promise<ProductView[]> {
  return withFallback(
    cached(["all"], async () =>
      (await prisma.product.findMany({ orderBy: { createdAt: "desc" } })).map(toView),
    ),
    [],
  );
}

/**
 * Home's "As mais queridas do ateliê" strip: the most recently registered
 * pieces, newest first (per Nic's request — the last piece she cadastra shows
 * up first). The `featured` ★ flag is not used here; it drives the hero photo
 * (`getHeroProduct`). Sold pieces are hidden, as everywhere in the storefront.
 */
export async function getLatestProducts(limit = 5): Promise<ProductView[]> {
  return withFallback(
    cached(["latest", String(limit)], async () => {
      const latest = await prisma.product.findMany({
        where: { status: { not: "SOLD" } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return latest.map(toView);
    }),
    [],
  );
}

/** The bag shown in the home hero: newest featured, non-sold, that has photos. */
export async function getHeroProduct(): Promise<ProductView | null> {
  return withFallback(
    cached(["hero"], async () => {
      const p = await prisma.product.findFirst({
        where: { featured: true, status: { not: "SOLD" }, photos: { isEmpty: false } },
        orderBy: { createdAt: "desc" },
      });
      return p ? toView(p) : null;
    }),
    null,
  );
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  return withFallback(
    cached(["slug", slug], async () => {
      const p = await prisma.product.findUnique({ where: { slug } });
      return p ? toView(p) : null;
    }),
    null,
  );
}

export async function getProductById(id: string): Promise<ProductView | null> {
  return withFallback(
    async () => {
      const p = await prisma.product.findUnique({ where: { id } });
      return p ? toView(p) : null;
    },
    null,
  );
}
