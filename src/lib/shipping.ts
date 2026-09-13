/**
 * Shipping types + client-safe helpers (CEP validation/masking, cart signature).
 * NO API token or network calls here — safe to import in client components.
 * The actual ViaCEP / Melhor Envio calls live in `src/lib/melhor-envio.ts`
 * (server-only) and are orchestrated by the `calculateShipping` server action.
 */
import type { CartItem, BoxSize } from "@/lib/types";

export type { BoxSize };

/** Default weight for a typical crochet piece (grams) when none is set. */
export const DEFAULT_WEIGHT_GRAMS = 350;

/** Correios accepts no smaller than this per side (cm) — clamp to avoid API errors. */
export const MIN_DIMENSIONS = { heightCm: 2, widthCm: 11, lengthCm: 16 } as const;

/** The three shipping box sizes. Each piece ships in one of these. */
export const BOX_SIZES: BoxSize[] = ["P", "M", "G"];
export const DEFAULT_BOX_SIZE: BoxSize = "M";

/**
 * Box dimensions per size (cm) — the ONLY dimensions freight is based on, plus
 * weight. Edit these to match Nic's real boxes; they must stay ≥ MIN_DIMENSIONS.
 */
export const BOX_PRESETS: Record<
  BoxSize,
  { label: string; heightCm: number; widthCm: number; lengthCm: number }
> = {
  P: { label: "Pequena", heightCm: 10, widthCm: 15, lengthCm: 20 },
  M: { label: "Média", heightCm: 15, widthCm: 22, lengthCm: 30 },
  G: { label: "Grande", heightCm: 20, widthCm: 30, lengthCm: 40 },
};

/** Normalize any string into a valid BoxSize (falls back to the default). */
export function toBoxSize(v: string | null | undefined): BoxSize {
  return v === "P" || v === "M" || v === "G" ? v : DEFAULT_BOX_SIZE;
}

/** How the customer receives the order: shipped, or picked up at the atelier. */
export type DeliveryMethod = "shipping" | "pickup";

export type ShippingAddress = {
  cep: string; // digits only
  city: string;
  uf: string;
};

export type ShippingOption = {
  /** Melhor Envio service id (stringified). */
  id: string;
  name: string; // "PAC", "SEDEX", ".Package"...
  company: string; // "Correios", "Jadlog"...
  priceCents: number;
  deliveryDays: number; // business-day estimate
};

export type ShippingErrorCode =
  | "invalid_cep"
  | "cep_not_found"
  | "quote_failed"
  | "no_options"
  | "empty_cart";

export type ShippingResult =
  | { ok: true; address: ShippingAddress; options: ShippingOption[]; simulated: boolean }
  | { ok: false; code: ShippingErrorCode; message: string };

/** A cart line reduced to what the shipping quote needs. */
export type ShippingLineInput = { productId: string; qty: number };

/** Keep only digits from a CEP string. */
export function onlyDigits(cep: string): string {
  return cep.replace(/\D/g, "");
}

/** A Brazilian CEP is 8 digits. */
export function isValidCep(cep: string): boolean {
  return onlyDigits(cep).length === 8;
}

/** Progressive input mask: "96030740" -> "96030-740", partials pass through. */
export function maskCep(input: string): string {
  const d = onlyDigits(input).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Display a stored/normalized CEP as 00000-000. */
export function formatCep(cep: string): string {
  const d = onlyDigits(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}

/**
 * A stable fingerprint of cart contents (lines + quantities). A shipping quote
 * is only valid while this matches — changing items/qty invalidates the freight.
 */
export function cartSignature(items: CartItem[]): string {
  return items
    .map((i) => `${i.lineId}:${i.qty}`)
    .sort()
    .join("|");
}

/** "PAC — 8 dias úteis" style label for an option. */
export function optionDeliveryLabel(days: number): string {
  return days === 1 ? "1 dia útil" : `${days} dias úteis`;
}
