"use client";

import { useEffect } from "react";
import { priceLabel } from "@/lib/format";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import { resolveYarnColors } from "@/lib/yarn-colors";
import { useProductModal } from "@/components/product/product-modal-store";
import ProductMedia from "@/components/product/ProductMedia";
import AddToCartButton from "@/components/product/AddToCartButton";

/** The design's product pop-up: image left, story right, add-to-bag below. */
export default function ProductModal() {
  const product = useProductModal((s) => s.product);
  const close = useProductModal((s) => s.close);

  // Escape closes; page scroll locked while open.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, close]);

  if (!product) return null;

  const fromPrefix = product.category === "Custom" || product.status === "MADE_TO_ORDER";
  const availableColors = resolveYarnColors(product.colors);

  return (
    <div className="fixed inset-0 z-[101] grid place-items-center p-[clamp(16px,4vw,48px)]">
      <div
        onClick={close}
        className="nc-scrim absolute inset-0 bg-[rgba(40,42,28,.5)] backdrop-blur-[4px] animate-fadeUp"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative z-[2] w-[min(900px,100%)] max-h-[90vh] max-[880px]:max-h-[92vh] overflow-auto bg-cream rounded-[24px] shadow-[0_50px_110px_-40px_rgba(0,0,0,.5)] grid grid-cols-1 min-[881px]:grid-cols-2 animate-modalUp"
      >
        <div className="relative min-h-[200px] aspect-[16/10] min-[881px]:aspect-auto min-[881px]:min-h-[340px]">
          <ProductMedia
            name={product.name}
            photo={product.photos[0]}
            colorPrimary={product.colorPrimary}
            colorSecondary={product.colorSecondary}
            variant="modal"
            priority
            sizes="(max-width: 880px) 100vw, 450px"
          />
        </div>

        <div className="relative p-[clamp(26px,3vw,44px)]">
          <button
            onClick={close}
            aria-label="Fechar"
            className="absolute top-[18px] right-[18px] w-[38px] h-[38px] rounded-full border border-line-input bg-transparent text-muted text-[17px] hover:bg-ink hover:text-cream hover:border-ink transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] tracking-[0.2em] uppercase text-sage">
              {product.category}
            </span>
            <span className="text-[11px] tracking-[0.12em] uppercase text-muted-faint">
              · {PRODUCT_STATUS_LABEL[product.status]}
            </span>
          </div>
          <h3 className="font-serif font-medium text-[clamp(30px,3.4vw,46px)] leading-none text-ink">
            {product.name}
          </h3>
          <div className="font-serif text-[30px] text-sage-deep mt-[14px]">
            {priceLabel(product.priceCents, fromPrefix)}
          </div>
          <p className="mt-5 text-[15px] leading-[1.75] text-muted font-light">
            {product.description}
          </p>

          {product.details.length > 0 && (
            <div className="mt-6 flex flex-col gap-[10px]">
              {product.details.map((d, i) => (
                <div key={i} className="flex items-center gap-[11px] text-[14px] text-muted-nav">
                  <span className="w-[6px] h-[6px] rounded-full bg-sage flex-none" />
                  {d}
                </div>
              ))}
            </div>
          )}

          {availableColors.length > 0 && (
            <div className="mt-6">
              <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[10px]">
                Disponível nas cores
              </div>
              <div className="flex flex-wrap gap-[10px]">
                {availableColors.map((c) => (
                  <span
                    key={c.id}
                    className="flex items-center gap-2 border border-line-input rounded-[30px] pl-[6px] pr-3 py-[5px]"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ background: c.hex }}
                    />
                    <span className="text-[13px] text-muted-nav">{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton product={product} onAdded={close} />
          <p className="mt-[14px] text-center text-[12px] text-muted-soft">
            Peça única · feita à mão · pode levar algumas semanas
          </p>
        </div>
      </div>
    </div>
  );
}
