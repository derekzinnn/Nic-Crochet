"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ProductView } from "@/lib/types";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (product: ProductView) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === product.id);
          const items = existing
            ? s.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
            : [
                ...s.items,
                {
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.priceCents,
                  photo: product.photos[0] ?? null,
                  colorPrimary: product.colorPrimary,
                  colorSecondary: product.colorSecondary,
                  qty: 1,
                },
              ];
          return { items, isOpen: true };
        }),
      increment: (id) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)) })),
      decrement: (id) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty - 1) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "nic-crochet-cart",
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** Derived selectors. */
export const selectCount = (s: CartState) => s.items.reduce((n, i) => n + i.qty, 0);
export const selectTotalCents = (s: CartState) =>
  s.items.reduce((n, i) => n + i.qty * i.priceCents, 0);
