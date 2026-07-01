"use client";

import type { ProductView } from "@/lib/types";
import { useCart } from "@/components/cart/cart-store";

export default function AddToCartButton({ product }: { product: ProductView }) {
  const add = useCart((s) => s.add);
  const sold = product.status === "SOLD";

  return (
    <button
      type="button"
      disabled={sold}
      onClick={() => add(product)}
      className="mt-[30px] w-full bg-ink text-cream rounded-pill py-4 text-[13px] tracking-[0.14em] uppercase hover:bg-sage hover:-translate-y-[2px] transition-[background-color,transform] duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:translate-y-0"
    >
      {sold ? "Peça vendida" : "Adicionar à sacola"}
    </button>
  );
}
