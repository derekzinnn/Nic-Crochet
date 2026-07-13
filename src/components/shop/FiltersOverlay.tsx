"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  SORT_OPTIONS,
  SHOP_CATEGORIES,
  PRICE_RANGES,
  buildShopHref,
  activeFilterCount,
  type ShopParams,
} from "@/lib/shop";

/**
 * The "Filtros" button + full-screen filters page from the design.
 * Every choice just patches the /colecao URL params (router.replace), so the
 * server keeps doing the filtering and the URL stays shareable.
 */
export default function FiltersOverlay({
  params,
  shownCount,
}: {
  params: ShopParams;
  shownCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(params);

  const apply = (patch: Partial<ShopParams>) =>
    router.replace(buildShopHref(params, patch), { scroll: false });

  // Lock the page scroll while the overlay is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const radioCard = (active: boolean) =>
    `flex items-center gap-[10px] rounded-[14px] border px-4 py-[15px] text-[14px] text-ink text-left transition-colors hover:border-sage ${
      active ? "bg-white border-sage" : "bg-transparent border-line-input"
    }`;

  const radioDot = (active: boolean) => (
    <span
      className={`inline-block w-4 h-4 rounded-full border-[1.5px] flex-none ${
        active ? "border-sage bg-sage" : "border-line bg-transparent"
      }`}
    />
  );

  const sectionLabel = "text-[11px] tracking-[0.2em] uppercase text-muted-soft mb-[14px]";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center gap-[9px] bg-ink text-cream rounded-pill px-6 py-[14px] text-[12px] tracking-[0.12em] uppercase hover:bg-sage transition-colors"
      >
        <span className="text-[14px]">☰</span> Filtros
        {count > 0 && (
          <span className="inline-grid place-items-center min-w-[19px] h-[19px] px-[5px] bg-sage text-cream rounded-[20px] text-[11px] font-bold">
            {count}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[99] bg-sand overflow-y-auto animate-fadeUp">
            <div className="max-w-[680px] mx-auto px-[clamp(20px,5vw,40px)] pt-8 pb-[140px]">
              <div className="flex items-center justify-between mb-9">
                <div>
                  <div className="text-[11px] tracking-[0.3em] uppercase text-sage">A coleção</div>
                  <h2 className="font-serif font-medium text-[clamp(30px,4.5vw,44px)] text-ink mt-1">
                    Filtros
                  </h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fechar filtros"
                  className="w-11 h-11 rounded-full border border-line-soft bg-transparent text-muted-nav text-[18px] hover:bg-ink hover:text-cream hover:border-ink transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* ordenar */}
              <div className="mb-[38px]">
                <div className={sectionLabel}>Ordenar por</div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px]">
                  {SORT_OPTIONS.map((o) => {
                    const active = params.sort === o.key;
                    return (
                      <button key={o.key} onClick={() => apply({ sort: o.key })} className={radioCard(active)}>
                        {radioDot(active)}
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* categoria */}
              <div className="mb-[38px]">
                <div className={sectionLabel}>Tipo de bolsa</div>
                <div className="flex flex-wrap gap-[9px]">
                  {SHOP_CATEGORIES.map((c) => {
                    const active = params.cat === c;
                    return (
                      <button
                        key={c}
                        onClick={() => apply({ cat: c })}
                        className={`rounded-pill px-[22px] py-3 text-[13px] tracking-[0.06em] uppercase border transition-colors hover:border-sage ${
                          active
                            ? "bg-ink text-cream border-ink"
                            : "bg-transparent text-muted-nav border-line"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* faixa de preço */}
              <div className="mb-[38px]">
                <div className={sectionLabel}>Faixa de preço</div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-[10px]">
                  {PRICE_RANGES.map((r) => {
                    const active = params.preco === r.key;
                    return (
                      <button key={r.key} onClick={() => apply({ preco: r.key })} className={radioCard(active)}>
                        {radioDot(active)}
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* sticky footer actions */}
            <div className="nc-blur fixed left-0 right-0 bottom-0 bg-[rgba(246,242,233,.94)] backdrop-blur-[10px] border-t border-line-soft px-[clamp(20px,5vw,40px)] py-4">
              <div className="max-w-[680px] mx-auto flex gap-3 items-center">
                <button
                  onClick={() => apply({ cat: "Todas", sort: "destaque", preco: "todas" })}
                  className="flex-none bg-transparent text-muted-nav border border-line-soft rounded-pill px-6 py-[15px] text-[12px] tracking-[0.1em] uppercase hover:border-sage hover:text-sage transition-colors"
                >
                  Limpar tudo
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-ink text-cream rounded-pill py-[15px] text-[12px] tracking-[0.12em] uppercase hover:bg-sage transition-colors"
                >
                  Ver {shownCount} peça(s)
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
