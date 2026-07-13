"use client";

import type { ProductView } from "@/lib/types";
import { useCart } from "@/components/cart/cart-store";

export default function AddToCartButton({
  product,
  onAdded,
}: {
  product: ProductView;
  /** Called after adding (e.g. the product modal closes itself). */
  onAdded?: () => void;
}) {
  const add = useCart((s) => s.add);
  const sold = product.status === "SOLD";

  return (
    <button
      type="button"
      disabled={sold}
      onClick={() => {
        add(product);
        onAdded?.();
      }}
      className="mt-[30px] w-full bg-ink text-cream rounded-pill py-4 text-[13px] tracking-[0.14em] uppercase hover:bg-sage hover:-translate-y-[2px] transition-[background-color,transform] duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:translate-y-0"
    >
      {sold ? "Peça esgotada" : "Adicionar à sacola"}
    </button>
  );
}
