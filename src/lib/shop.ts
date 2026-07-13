import type { ProductView } from "@/lib/types";
import { PRODUCT_CATEGORIES } from "@/lib/types";

export type SortKey = "destaque" | "menor" | "maior" | "az";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "destaque", label: "Destaques" },
  { key: "menor", label: "Menor preço" },
  { key: "maior", label: "Maior preço" },
  { key: "az", label: "A — Z" },
];

export type PriceRangeKey = "todas" | "ate100" | "100a160" | "acima160";

/** Price bands from the design's "Faixa de preço" filter (bounds in centavos). */
export const PRICE_RANGES: { key: PriceRangeKey; label: string; min?: number; max?: number }[] = [
  { key: "todas", label: "Todas" },
  { key: "ate100", label: "Até R$ 100", max: 100_00 },
  { key: "100a160", label: "R$ 100 — 160", min: 100_00, max: 160_00 },
  { key: "acima160", label: "Acima de R$ 160", min: 160_00 },
];

/** "Todas" + the real categories, for the filter chips. */
export const SHOP_CATEGORIES = ["Todas", ...PRODUCT_CATEGORIES] as const;

export type ShopParams = {
  q: string;
  cat: string; // "Todas" when unfiltered
  sort: SortKey;
  preco: PriceRangeKey; // "todas" when unfiltered
};

/** Normalize raw URL search params into a typed, defaulted shape. */
export function parseShopParams(sp: Record<string, string | string[] | undefined>): ShopParams {
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const catRaw = pick(sp.cat);
  const sortRaw = pick(sp.sort) as SortKey;
  const precoRaw = pick(sp.preco) as PriceRangeKey;
  return {
    q: pick(sp.q).trim(),
    cat: (SHOP_CATEGORIES as readonly string[]).includes(catRaw) ? catRaw : "Todas",
    sort: SORT_OPTIONS.some((o) => o.key === sortRaw) ? sortRaw : "destaque",
    preco: PRICE_RANGES.some((r) => r.key === precoRaw) ? precoRaw : "todas",
  };
}

/**
 * Filter by category + price band + free-text search, then sort.
 * Sold-out pieces never show in the shop (per the design). Pure; runs server-side.
 */
export function filterSortProducts(products: ProductView[], p: ShopParams): ProductView[] {
  const query = p.q.toLowerCase();
  const range = PRICE_RANGES.find((r) => r.key === p.preco);
  let list = products
    .filter((prod) => prod.status !== "SOLD")
    .filter((prod) => p.cat === "Todas" || prod.category === p.cat);
  if (range?.min !== undefined) list = list.filter((prod) => prod.priceCents > range.min!);
  if (range?.max !== undefined) list = list.filter((prod) => prod.priceCents <= range.max!);
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

/** Anything besides the defaults (search text is not a "filter" in the UI). */
export function hasActiveFilters(p: ShopParams): boolean {
  return p.cat !== "Todas" || p.sort !== "destaque" || p.preco !== "todas";
}

export function activeFilterCount(p: ShopParams): number {
  return (
    (p.cat !== "Todas" ? 1 : 0) + (p.sort !== "destaque" ? 1 : 0) + (p.preco !== "todas" ? 1 : 0)
  );
}

/** Human summary shown next to the result count, e.g. "Tote · menor preço". */
export function filterSummary(p: ShopParams): string {
  const sortLabel = { menor: "menor preço", maior: "maior preço", az: "A—Z" }[
    p.sort as Exclude<SortKey, "destaque">
  ];
  const precoLabel = {
    ate100: "até R$ 100",
    "100a160": "R$ 100—160",
    acima160: "acima de R$ 160",
  }[p.preco as Exclude<PriceRangeKey, "todas">];
  return (
    [p.cat !== "Todas" ? p.cat : null, sortLabel ?? null, precoLabel ?? null]
      .filter(Boolean)
      .join(" · ") || "sem filtros"
  );
}

/** Build a /colecao href from current params with a patch applied. */
export function buildShopHref(current: ShopParams, patch: Partial<ShopParams>): string {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.cat && merged.cat !== "Todas") params.set("cat", merged.cat);
  if (merged.sort && merged.sort !== "destaque") params.set("sort", merged.sort);
  if (merged.preco && merged.preco !== "todas") params.set("preco", merged.preco);
  const qs = params.toString();
  return qs ? `/colecao?${qs}` : "/colecao";
}
