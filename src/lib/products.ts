import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProductView } from "@/lib/types";
import { seedProducts } from "@/data/seed-products";
import { swatchFromColors } from "@/lib/yarn-colors";

type DbProduct = Prisma.ProductGetPayload<object>;

function toView(p: DbProduct): ProductView {
  const swatch = swatchFromColors(p.colors);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
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
    colorPrimary: swatch.primary,
    colorSecondary: swatch.secondary,
  };
}

/**
 * During the foundation phase the DB may be a placeholder. Any connection
 * failure falls back to the static seed catalogue so pages still render.
 * Once real Supabase credentials are in place this fallback simply never trips.
 */
async function withFallback<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[products] DB unavailable, using seed fallback:", (err as Error).message);
    }
    return fallback;
  }
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
    seedProducts,
  );
}

export async function getFeaturedProducts(limit = 3): Promise<ProductView[]> {
  return withFallback(
    cached(["featured", String(limit)], async () => {
      const featured = await prisma.product.findMany({
        where: { featured: true, status: { not: "SOLD" } },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      if (featured.length >= limit) return featured.map(toView);
      // Top up with most-recent available pieces if not enough are flagged.
      const fill = await prisma.product.findMany({
        where: { featured: false, status: { not: "SOLD" } },
        orderBy: { createdAt: "desc" },
        take: limit - featured.length,
      });
      return [...featured, ...fill].map(toView);
    }),
    seedProducts.slice(0, limit),
  );
}

export async function getProductBySlug(slug: string): Promise<ProductView | null> {
  return withFallback(
    cached(["slug", slug], async () => {
      const p = await prisma.product.findUnique({ where: { slug } });
      return p ? toView(p) : null;
    }),
    seedProducts.find((p) => p.slug === slug) ?? null,
  );
}

export async function getProductById(id: string): Promise<ProductView | null> {
  return withFallback(
    async () => {
      const p = await prisma.product.findUnique({ where: { id } });
      return p ? toView(p) : null;
    },
    seedProducts.find((p) => p.id === id) ?? null,
  );
}
