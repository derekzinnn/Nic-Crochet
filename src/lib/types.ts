export type ProductStatus = "AVAILABLE" | "SOLD" | "MADE_TO_ORDER";

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  AVAILABLE: "Disponível",
  SOLD: "Esgotada",
  MADE_TO_ORDER: "Sob encomenda",
};

export const PRODUCT_CATEGORIES = [
  "Tote",
  "Transversal",
  "Clutch",
  "Bucket",
  "Ombro",
  "Mini",
  "Custom",
] as const;

/** Plain, serializable product shape passed from server to client components. */
export type ProductView = {
  id: string;
  name: string;
  slug: string;
  category: string;
  priceCents: number;
  description: string;
  details: string[];
  photos: string[];
  status: ProductStatus;
  tag: string | null;
  featured: boolean;
  /** Yarn color ids (from src/lib/yarn-colors.ts) this bag is available in. */
  colors: string[];
  /** Derived from `colors` — the woven placeholder swatch (not user-editable). */
  colorPrimary: string;
  colorSecondary: string;
};

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  photo: string | null;
  colorPrimary: string;
  colorSecondary: string;
  qty: number;
};
