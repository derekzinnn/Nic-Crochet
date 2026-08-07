"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/cart-store";

/** Empties the cart once, on mount — used on the successful-payment return page. */
export default function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
