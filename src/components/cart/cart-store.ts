"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ProductView } from "@/lib/types";
import { cartSignature, type ShippingAddress, type ShippingOption } from "@/lib/shipping";

/** A successful shipping quote, kept in the cart with the signature it was for. */
type ShippingQuote = {
  address: ShippingAddress;
  options: ShippingOption[];
  simulated: boolean;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  hydrated: boolean;
  // Shipping (freight) state — see ShippingBox / CartDrawer.
  cep: string;
  quote: ShippingQuote | null;
  quoteSig: string | null; // cart signature when the quote was calculated
  selectedOptionId: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (product: ProductView, selectedColors?: string[], selectedSize?: string | null) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  setCep: (cep: string) => void;
  setQuote: (quote: ShippingQuote, sig: string) => void;
  selectOption: (id: string) => void;
  clearQuote: () => void;
};

/** Same piece in different colors/size = separate cart lines. */
function makeLineId(productId: string, selectedColors: string[], selectedSize: string | null): string {
  return `${productId}::${[...selectedColors].sort().join(",")}::${selectedSize ?? ""}`;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      hydrated: false,
      cep: "",
      quote: null,
      quoteSig: null,
      selectedOptionId: null,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      add: (product, selectedColors = [], selectedSize = null) =>
        set((s) => {
          const lineId = makeLineId(product.id, selectedColors, selectedSize);
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
                  selectedSize,
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
      clear: () =>
        set({ items: [], quote: null, quoteSig: null, selectedOptionId: null }),
      setCep: (cep) => set({ cep }),
      // Store the quote + the cart signature it was calculated for, and default
      // the selection to the cheapest option (options arrive price-sorted).
      setQuote: (quote, sig) =>
        set({ quote, quoteSig: sig, selectedOptionId: quote.options[0]?.id ?? null }),
      selectOption: (id) => set({ selectedOptionId: id }),
      clearQuote: () => set({ quote: null, quoteSig: null, selectedOptionId: null }),
    }),
    {
      name: "nic-crochet-cart",
      version: 2,
      // Migrate older cart shapes: v0 keyed by `id` (no color), v1 added colors
      // but no size. Normalize every item into the current shape.
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as { items?: Array<Record<string, unknown>> } | undefined;
        if (version < 2 && state?.items) {
          state.items = state.items.map((i) => {
            const productId = (i.productId as string) ?? (i.id as string) ?? "";
            const selectedColors = (i.selectedColors as string[]) ?? [];
            return {
              lineId: makeLineId(productId, selectedColors, null),
              productId,
              slug: i.slug,
              name: i.name,
              priceCents: i.priceCents,
              photo: i.photo ?? null,
              colorPrimary: i.colorPrimary,
              colorSecondary: i.colorSecondary,
              selectedColors,
              selectedSize: null,
              qty: i.qty,
            };
          });
        }
        return state;
      },
      partialize: (s) => ({
        items: s.items,
        cep: s.cep,
        quote: s.quote,
        quoteSig: s.quoteSig,
        selectedOptionId: s.selectedOptionId,
      }),
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

/**
 * Derived shipping state shared by ShippingBox (input) and CartDrawer (totals +
 * checkout gate). `valid` is true only while the quote matches the current cart;
 * `stale` flags a quote that a cart change has invalidated (needs recalculation).
 */
export function useShippingSelection() {
  const items = useCart((s) => s.items);
  const quote = useCart((s) => s.quote);
  const quoteSig = useCart((s) => s.quoteSig);
  const selectedOptionId = useCart((s) => s.selectedOptionId);

  const sig = cartSignature(items);
  const stale = !!quote && quoteSig !== sig;
  const valid = !!quote && !stale;
  const selectedOption =
    valid && quote ? (quote.options.find((o) => o.id === selectedOptionId) ?? null) : null;

  return { quote, sig, stale, valid, selectedOption };
}
