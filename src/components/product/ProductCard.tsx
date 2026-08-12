"use client";

import type { ProductView } from "@/lib/types";
import { priceLabel } from "@/lib/format";
import { useCart } from "@/components/cart/cart-store";
import { useProductModal } from "@/components/product/product-modal-store";
import ProductMedia from "@/components/product/ProductMedia";

export default function ProductCard({
  product,
  reveal = false,
}: {
  product: ProductView;
  reveal?: boolean;
}) {
  const add = useCart((s) => s.add);
  const openModal = useProductModal((s) => s.open);
  const fromPrefix = product.category === "Custom" || product.status === "MADE_TO_ORDER";
  // Pieces that need a color/size choice can't be quick-added — open the modal.
  const needsChoice =
    product.status === "MADE_TO_ORDER" &&
    (product.colors.length > 0 || product.sizes.length > 0);

  return (
    <article className="relative group" {...(reveal ? { "data-reveal": true } : {})}>
      <div className="relative aspect-[3/4] rounded-[18px] overflow-hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-[6px]">
        <ProductMedia
          name={product.name}
          photo={product.photos[0]}
          colorPrimary={product.colorPrimary}
          colorSecondary={product.colorSecondary}
          variant="card"
          showCaption
        />
        {product.tag && (
          <span className="absolute top-[10px] left-[10px] min-[560px]:top-[14px] min-[560px]:left-[14px] bg-cream text-sage-deep px-[9px] py-1 min-[560px]:px-3 min-[560px]:py-[5px] rounded-[30px] text-[9px] min-[560px]:text-[10px] tracking-[0.12em] uppercase font-semibold">
            {product.tag}
          </span>
        )}
        <button
          type="button"
          aria-label={
            needsChoice ? `Ver opções de ${product.name}` : `Adicionar ${product.name} à sacola`
          }
          onClick={() => (needsChoice ? openModal(product) : add(product))}
          className="absolute right-[10px] bottom-[10px] min-[560px]:right-[14px] min-[560px]:bottom-[14px] z-20 grid place-items-center w-[40px] h-[40px] min-[560px]:w-[46px] min-[560px]:h-[46px] rounded-full bg-ink text-cream text-[20px] min-[560px]:text-[22px] leading-none hover:bg-sage hover:scale-[1.08] transition-[background-color,transform] duration-300"
        >
          +
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-2 min-[560px]:gap-3 mt-[10px] min-[560px]:mt-4">
        <h3 className="font-serif font-medium text-[17px] min-[560px]:text-[22px] leading-tight text-ink">
          {product.name}
        </h3>
        <span className="text-[13px] min-[560px]:text-[15px] font-semibold text-sage-deep whitespace-nowrap">
          {priceLabel(product.priceCents, fromPrefix)}
        </span>
      </div>
      <div className="text-[10px] min-[560px]:text-[12px] tracking-[0.12em] uppercase text-muted-faint mt-1">
        {product.category}
      </div>

      {/* Cards open the detail pop-up (prototype behavior); /produto/[slug]
          stays available for direct and shared links. */}
      <button
        type="button"
        onClick={() => openModal(product)}
        aria-label={product.name}
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </article>
  );
}
