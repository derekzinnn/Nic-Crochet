/** Format centavos as Brazilian Real, e.g. 18900 -> "R$ 189,00". */
export function brl(cents: number): string {
  return "R$ " + (cents / 100).toFixed(2).replace(".", ",");
}

/** Price label, prefixing "a partir de" for made-to-order/custom pieces. */
export function priceLabel(cents: number, fromPrefix = false): string {
  return (fromPrefix ? "a partir de " : "") + brl(cents);
}

/** Convert a reais input (e.g. "189" or "189,90") into integer centavos. */
export function reaisToCents(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const normalized = input.replace(/[^\d,.-]/g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

/** Centavos -> plain reais string for editing in a form, e.g. 18990 -> "189.90". */
export function centsToReais(cents: number): string {
  return (cents / 100).toString();
}

/**
 * Human delivery estimate from the min/max lead time in days.
 * Returns null when neither is informed.
 */
export function leadTimeLabel(min: number | null, max: number | null): string | null {
  const unit = (n: number) => (n === 1 ? "dia" : "dias");
  if (min != null && max != null) {
    return min === max ? `${min} ${unit(min)}` : `${min} a ${max} ${unit(max)}`;
  }
  if (min != null) return `a partir de ${min} ${unit(min)}`;
  if (max != null) return `até ${max} ${unit(max)}`;
  return null;
}

/** Slugify a product name into a URL-safe, accent-free slug. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
