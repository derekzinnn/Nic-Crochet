export type ProductStatus = "AVAILABLE" | "SOLD" | "MADE_TO_ORDER";

export type ProductKind = "BAG" | "CLOTHING";

export const KIND_LABEL: Record<ProductKind, string> = {
  BAG: "Bolsa",
  CLOTHING: "Roupa",
};

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
  kind: ProductKind;
  /** Available sizes for clothing (e.g. ["P","M","G"]); empty for bags. */
  sizes: string[];
  /** Yarn color ids (from src/lib/yarn-colors.ts) this piece is available in. */
  colors: string[];
  /** Whether a customer ordering this bag may pick more than one color. */
  allowsMultipleColors: boolean;
  /** Delivery estimate in days. Null when not informed. */
  leadTimeMinDays: number | null;
  leadTimeMaxDays: number | null;
  /** Shipping package dimensions (for the Melhor Envio quote / admin editing). */
  weightGrams?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  /** Derived from `colors` — the woven placeholder swatch (not user-editable). */
  colorPrimary: string;
  colorSecondary: string;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago · em produção",
  READY: "Pronta",
  SHIPPED: "Enviada",
  DELIVERED: "Concluído",
  CANCELLED: "Cancelado",
};

/**
 * The same status reads differently depending on how the order is delivered —
 * "Pronta" means "come pick it up" for pickup and "packed" for shipping.
 */
export function orderStatusLabel(
  status: OrderStatus,
  deliveryMethod: "shipping" | "pickup",
): string {
  const pickup = deliveryMethod === "pickup";
  switch (status) {
    case "READY":
      return pickup ? "Disponível para retirada" : "Pronta para envio";
    case "DELIVERED":
      return pickup ? "Retirada" : "Entregue";
    default:
      return ORDER_STATUS_LABEL[status];
  }
}

/** Statuses Nic can set by hand. Payment states come from Mercado Pago. */
export const FULFILMENT_STATUSES: OrderStatus[] = ["PAID", "READY", "SHIPPED", "DELIVERED"];

/** Immutable snapshot of a purchased line, stored on the Order as JSON. */
export type OrderItemSnapshot = {
  productId: string;
  name: string;
  slug: string;
  selectedColors: string[];
  selectedSize: string | null;
  qty: number;
  unitPriceCents: number;
};

/** Serializable order shape for the admin Pedidos panel. */
export type OrderView = {
  id: string;
  /** Token behind the public "acompanhe seu pedido" link. */
  publicToken: string;
  /** Postal tracking code, once Nic posts the parcel. */
  trackingCode: string | null;
  items: OrderItemSnapshot[];
  subtotalCents: number;
  deliveryMethod: "shipping" | "pickup";
  shippingCents: number;
  shippingLabel: string | null;
  shippingDays: number | null;
  cep: string | null;
  street: string | null;
  district: string | null;
  city: string | null;
  uf: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  totalCents: number;
  status: OrderStatus;
  createdAt: string; // ISO
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
  /** Yarn color ids the customer chose (empty when the piece has no color choice). */
  selectedColors: string[];
  /** Size the customer chose (clothing); null for bags / no size. */
  selectedSize: string | null;
  qty: number;
};
