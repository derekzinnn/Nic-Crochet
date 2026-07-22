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

export type CustomOrderStatus = "NEW" | "RESPONDED" | "CLOSED";

export const CUSTOM_ORDER_STATUS_LABEL: Record<CustomOrderStatus, string> = {
  NEW: "Nova",
  RESPONDED: "Respondida",
  CLOSED: "Fechada",
};

/** Serializable custom-order shape for the admin Encomendas panel. */
export type CustomOrderView = {
  id: string;
  pieceType: string;
  size: string;
  colors: string[]; // yarn color ids
  deadline: string;
  details: string;
  name: string;
  contact: string;
  status: CustomOrderStatus;
  createdAt: string; // ISO
};

/** Serializable task shape for the admin Agenda. */
export type TaskView = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null; // ISO date or null
  createdAt: string; // ISO
};

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
  /** Whether a customer ordering this bag may pick more than one color. */
  allowsMultipleColors: boolean;
  /** Delivery estimate in days. Null when not informed. */
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  /** Derived from `colors` — the woven placeholder swatch (not user-editable). */
  colorPrimary: string;
  colorSecondary: string;
};

export type CartItem = {
  /** Unique per line: productId + chosen colors (same bag, different colors = 2 lines). */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  photo: string | null;
  colorPrimary: string;
  colorSecondary: string;
  /** Yarn color ids the customer chose (empty when the bag has no color choice). */
  selectedColors: string[];
  qty: number;
};
