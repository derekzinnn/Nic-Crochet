"use client";

import { create } from "zustand";
import type { ProductView } from "@/lib/types";

/**
 * Which product is open in the detail pop-up (prototype behavior: cards open
 * a modal instead of navigating). `/produto/[slug]` still exists for direct
 * and shared links.
 */
type ProductModalState = {
  product: ProductView | null;
  open: (product: ProductView) => void;
  close: () => void;
};

export const useProductModal = create<ProductModalState>((set) => ({
  product: null,
  open: (product) => set({ product }),
  close: () => set({ product: null }),
}));
