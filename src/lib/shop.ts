import type { ProductView } from "@/lib/types";
import { PRODUCT_CATEGORIES } from "@/lib/types";

export type SortKey = "destaque" | "menor" | "maior" | "az";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "destaque", label: "Destaques" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
  { key: "az", label: "A — Z" },
];

/** "Todas" + the real categories, for the filter chips. */
export const SHOP_CATEGORIES = ["Todas", ...PRODUCT_CATEGORIES] as const;

export type ShopParams = {
  q: string;
  cat: string; // "Todas" when unfiltered
  sort: SortKey;
};

/** Normalize raw URL search params into a typed, defaulted shape. */
export function parseShopParams(sp: Record<string, string | string[] | undefined>): ShopParams {
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const catRaw = pick(sp.cat);
  const sortRaw = pick(sp.sort) as SortKey;
  return {
    q: pick(sp.q).trim(),
    cat: (SHOP_CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : "Todas",
    sort: SORT_OPTIONS.some((o) => o.key === sortRaw) ? sortRaw : "destaque",
  };
}

/** Filter by category + free-text search, then sort. Pure; runs server-side. */
export function filterSortProducts(products: ProductView[], p: ShopParams): ProductView[] {
  const query = p.q.toLowerCase();
  let list = products.filter((prod) => p.cat === "Todas" || prod.category === p.cat);
  if (query) {
    list = list.filter((prod) => `${prod.name} ${prod.category}`.toLowerCase().includes(query));
  }
  return [...list].sort((a, b) => {
    switch (p.sort) {
      case "menor":
        return a.priceCents - b.priceCents;
      case "maior":
        return b.priceCents - a.priceCents;
      case "az":
        return a.name.localeCompare(b.name, "pt");
      default:
        return 0; // "destaque" keeps natural (DB/seed) order
    }
  });
}

/** Build a /colecao href from current params with a patch applied. */
export function buildShopHref(current: ShopParams, patch: Partial<ShopParams>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.cat && merged.cat !== "Todas") params.set("cat", merged.cat);
  if (merged.sort && merged.sort !== "destaque") params.set("sort", merged.sort);
  const qs = params.toString();
  return qs ? `/colecao?${qs}` : "/colecao";
}
