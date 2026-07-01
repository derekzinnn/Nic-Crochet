import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import {
  SORT_OPTIONS,
  SHOP_CATEGORIES,
  parseShopParams,
  filterSortProducts,
  buildShopHref,
} from "@/lib/shop";
import ProductCard from "@/components/product/ProductCard";
import SearchInput from "@/components/shop/SearchInput";

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

  const pillBase =
    "btn-pill !tracking-[0.04em] normal-case px-[18px] py-[11px] !text-[12px] border";
  const active = "bg-ink text-cream border-ink";
  const inactive = "bg-transparent text-muted-nav border-line hover:border-sage";

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

        {/* search + sort */}
        <div className="flex flex-wrap gap-3 items-center justify-center mb-[22px]">
          <Suspense fallback={<div className="flex-1 min-w-[240px] max-w-[440px] h-[50px]" />}>
            <SearchInput />
          </Suspense>
          <div className="flex gap-2 flex-wrap justify-center">
            {SORT_OPTIONS.map((o) => (
              <Link
                key={o.key}
                href={buildShopHref(params, { sort: o.key })}
                scroll={false}
                className={`${pillBase} ${params.sort === o.key ? active : inactive}`}
              >
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        {/* category chips */}
        <div className="flex flex-wrap gap-[9px] justify-center mb-[14px]">
          {SHOP_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={buildShopHref(params, { cat: c })}
              scroll={false}
              className={`btn-pill px-[18px] py-[9px] !text-[12px] !tracking-[0.08em] border ${
                params.cat === c ? active : inactive
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="text-center text-[13px] text-muted-faint mb-[34px]">
          {shown.length} peça(s) encontrada(s)
        </div>

        {noResults ? (
          <div className="text-center px-5 py-[60px]">
            <div className="font-serif italic text-[26px] text-muted">Nada encontrado por aqui</div>
            <p className="text-[14px] text-muted-soft mt-2">Tente outro nome ou limpe a busca.</p>
            <Link
              href={buildShopHref(params, { q: "", cat: "Todas" })}
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
