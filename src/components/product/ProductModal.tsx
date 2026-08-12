"use client";

import { useEffect } from "react";
import { priceLabel } from "@/lib/format";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import { useProductModal } from "@/components/product/product-modal-store";
import ProductGallery from "@/components/product/ProductGallery";
import AddToBag from "@/components/product/AddToBag";

/** The design's product pop-up: image left, story right, add-to-bag below. */
export default function ProductModal() {
  const product = useProductModal((s) => s.product);
  const close = useProductModal((s) => s.close);

  // Escape closes; page scroll locked while open.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);

    // Locking scroll hides the scrollbar, which would widen the page and make
    // everything behind the modal jump sideways. Pad by the scrollbar's width
    // so the layout stays put.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [product, close]);

  if (!product) return null;

  const fromPrefix = product.category === "Custom" || product.status === "MADE_TO_ORDER";

  return (
    <div className="fixed inset-0 z-[101] grid place-items-center p-[clamp(16px,4vw,48px)]">
      <div
        onClick={close}
        className="absolute inset-0 bg-[rgba(40,42,28,.5)] backdrop-blur-[4px] animate-fadeUp"
      />
      {/* Fixed height on desktop: otherwise the grid row is sized by the text
          column, so a bag with a long description got a tall photo and one
          without a description got a squashed one. Now every product opens the
          same size and long text scrolls inside its own column. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="relative z-[2] w-[min(900px,100%)] max-h-[90vh] max-[880px]:max-h-[92vh] overflow-auto min-[881px]:overflow-hidden min-[881px]:h-[min(620px,86vh)] bg-cream rounded-[24px] shadow-[0_50px_110px_-40px_rgba(0,0,0,.5)] flex flex-col min-[881px]:grid min-[881px]:grid-cols-2 animate-modalUp"
      >
        <button
          onClick={close}
          aria-label="Fechar"
          className="absolute top-[18px] right-[18px] z-[3] w-[38px] h-[38px] rounded-full border border-line-input bg-cream/90 backdrop-blur-[2px] text-muted text-[17px] hover:bg-ink hover:text-cream hover:border-ink transition-colors"
        >
          ✕
        </button>

        {/* Mobile: a fixed-height image block in a flex column — bulletproof
            stacking (real iOS Safari mis-sized the aspect-ratio row inside a
            grid and let the caption ghost over the photo). Desktop keeps the
            two-column layout with the image filling its cell. */}
        <div className="relative w-full flex-none h-[56vh] min-[881px]:h-full">
          <ProductGallery
            name={product.name}
            photos={product.photos}
            colorPrimary={product.colorPrimary}
            colorSecondary={product.colorSecondary}
            variant="modal"
            priority
            sizes="(max-width: 880px) 100vw, 450px"
          />
        </div>

        <div className="relative p-[clamp(26px,3vw,44px)] min-[881px]:h-full min-[881px]:overflow-y-auto">
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

          <AddToBag product={product} onAdded={close} />
          <p className="mt-[14px] text-center text-[12px] text-muted-soft">
            Peça única · feita à mão · pode levar algumas semanas
          </p>
        </div>
      </div>
    </div>
  );
}
