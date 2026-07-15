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
  add: (product: ProductView, selectedColors?: string[]) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
};

/** Same bag in different colors = separate cart lines. */
function makeLineId(productId: string, selectedColors: string[]): string {
  return `${productId}::${[...selectedColors].sort().join(",")}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, selectedColors = []) =>
        set((s) => {
          const lineId = makeLineId(product.id, selectedColors);
          const existing = s.items.find((i) => i.lineId === lineId);
          const items = existing
            ? s.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i))
            : [
                ...s.items,
                {
                  lineId,
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  priceCents: product.priceCents,
                  photo: product.photos[0] ?? null,
                  colorPrimary: product.colorPrimary,
                  colorSecondary: product.colorSecondary,
                  selectedColors,
                  qty: 1,
                },
              ];
          return { items, isOpen: true };
        }),
      increment: (lineId) =>
        set((s) => ({
          items: s.items.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i)),
        })),
      decrement: (lineId) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.lineId === lineId ? { ...i, qty: Math.max(0, i.qty - 1) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "nic-crochet-cart",
      version: 1,
      // v0 carts keyed items by `id` with no color — map them into the new shape.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { items?: Array<Record<string, unknown>> } | undefined;
        if (version === 0 && state?.items) {
          state.items = state.items.map((i) => ({
            lineId: `${(i.id as string) ?? ""}::`,
            productId: i.id,
            slug: i.slug,
            name: i.name,
            priceCents: i.priceCents,
            photo: i.photo ?? null,
            colorPrimary: i.colorPrimary,
            colorSecondary: i.colorSecondary,
            selectedColors: [],
            qty: i.qty,
          }));
        }
        return state;
      },
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
