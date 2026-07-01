"use client";

import Link from "next/link";
import type { ProductView } from "@/lib/types";
import { priceLabel } from "@/lib/format";
import { useCart } from "@/components/cart/cart-store";
import ProductMedia from "@/components/product/ProductMedia";

export default function ProductCard({
  product,
  reveal = false,
}: {
  product: ProductView;
  reveal?: boolean;
}) {
  const add = useCart((s) => s.add);
  const fromPrefix = product.category === "Custom" || product.status === "MADE_TO_ORDER";

  return (
    <article className="relative group" {...(reveal ? { "data-reveal": true } : {})}>
      <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:-translate-y-[6px]">
        <ProductMedia
          name={product.name}
          photo={product.photos[0]}
          colorPrimary={product.colorPrimary}
          colorSecondary={product.colorSecondary}
          variant="card"
          showCaption
        />
        {product.tag && (
          <span className="absolute top-[14px] left-[14px] bg-cream text-sage-deep px-3 py-[5px] rounded-[30px] text-[10px] tracking-[0.14em] uppercase font-semibold">
            {product.tag}
          </span>
        )}
        <button
          type="button"
          aria-label={`Adicionar ${product.name} à sacola`}
          onClick={() => add(product)}
          className="absolute right-[14px] bottom-[14px] z-20 w-[46px] h-[46px] rounded-full bg-ink text-cream text-[22px] leading-none hover:bg-sage hover:scale-[1.08] transition-[background-color,transform] duration-300"
        >
          +
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-3 mt-4">
        <h3 className="font-serif font-medium text-[22px] text-ink">{product.name}</h3>
        <span className="text-[15px] font-semibold text-sage-deep whitespace-nowrap">
          {priceLabel(product.priceCents, fromPrefix)}
        </span>
      </div>
      <div className="text-[12px] tracking-[0.14em] uppercase text-muted-faint mt-1">
        {product.category}
      </div>

      <Link
        href={`/produto/${product.slug}`}
        aria-label={product.name}
        className="absolute inset-0 z-10"
      />
    </article>
  );
}
