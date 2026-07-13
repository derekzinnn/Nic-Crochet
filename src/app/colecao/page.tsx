import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import {
  parseShopParams,
  filterSortProducts,
  buildShopHref,
  filterSummary,
  hasActiveFilters,
} from "@/lib/shop";
import ProductCard from "@/components/product/ProductCard";
import SearchInput from "@/components/shop/SearchInput";
import FiltersOverlay from "@/components/shop/FiltersOverlay";

export const metadata: Metadata = {
  title: "Coleção",
  description:
    "A coleção completa de bolsas de crochê da Nic. Busque pelo nome, filtre por estilo ou ordene por preço.",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ColecaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = parseShopParams(await searchParams);
  const all = await getAllProducts();
  const shown = filterSortProducts(all, params);
  const noResults = shown.length === 0;

  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-cream">
      <div className="max-w-shell mx-auto">
        <div className="text-center mb-9">
          <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-[14px]">
            A coleção completa
          </div>
          <h1 className="font-serif font-normal text-[clamp(40px,5.5vw,74px)] leading-none text-ink">
            Encontre a sua bolsa
          </h1>
          <p className="mt-[18px] mx-auto max-w-[440px] text-[15px] leading-[1.7] text-muted font-light">
            Busque pelo nome, filtre por estilo ou ordene por preço. Cada peça é única.
          </p>
        </div>

        {/* search + filters button */}
        <div className="flex flex-wrap gap-3 items-center justify-center mb-4">
          <Suspense fallback={<div className="flex-1 min-w-[240px] max-w-[440px] h-[50px]" />}>
            <SearchInput />
          </Suspense>
          <FiltersOverlay params={params} shownCount={shown.length} />
        </div>

        {/* active filter summary */}
        <div className="flex items-center justify-center gap-[10px] flex-wrap mb-[34px]">
          <span className="text-[13px] text-muted-faint">
            {shown.length} peça(s) · {filterSummary(params)}
          </span>
          {hasActiveFilters(params) && (
            <Link
              href={buildShopHref(params, { cat: "Todas", sort: "destaque", preco: "todas" })}
              scroll={false}
              className="text-[13px] text-sage underline"
            >
              limpar
            </Link>
          )}
        </div>

        {noResults ? (
          <div className="text-center px-5 py-[60px]">
            <div className="font-serif italic text-[26px] text-muted">Nada encontrado por aqui</div>
            <p className="text-[14px] text-muted-soft mt-2">Tente outro nome ou limpe a busca.</p>
            <Link
              href="/colecao"
              scroll={false}
              className="btn-pill inline-block mt-5 bg-sage text-cream px-[26px] py-3 !text-[12px]"
            >
              Limpar busca
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[clamp(16px,2.2vw,30px)]">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
