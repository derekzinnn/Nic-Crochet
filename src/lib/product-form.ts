import type { ProductStatus, ProductView } from "@/lib/types";
import { centsToReais } from "@/lib/format";

/** Categories offered in the admin wizard (matches the prototype's chips). */
export const ADMIN_CATEGORIES = [
  "Tote",
  "Transversal",
  "Clutch",
  "Bucket",
  "Ombro",
  "Mini",
] as const;

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "MADE_TO_ORDER", label: "Sob encomenda" },
  { value: "SOLD", label: "Vendida" },
];

export const WIZARD_STEP_LABELS = ["Básico", "Aparência", "Descrição", "Revisão"] as const;

/** Editable draft shape shared by the create/edit wizard and the server action. */
export type ProductDraft = {
  name: string;
  category: string;
  priceReais: string; // raw input, e.g. "189" or "189,90"
  status: ProductStatus;
  featured: boolean;
  colors: string[]; // yarn color ids from the supplier palette
  tag: string;
  description: string;
  detailsText: string; // one detail per line
  photos: string[]; // Supabase Storage URLs
};

export const emptyDraft: ProductDraft = {
  name: "",
  category: "Tote",
  priceReais: "",
  status: "AVAILABLE",
  featured: false,
  colors: [],
  tag: "",
  description: "",
  detailsText: "",
  photos: [],
};

export function draftFromProduct(p: ProductView): ProductDraft {
  return {
    name: p.name,
    category: p.category,
    priceReais: centsToReais(p.priceCents),
    status: p.status,
    featured: p.featured,
    colors: p.colors,
    tag: p.tag ?? "",
    description: p.description,
    detailsText: p.details.join("\n"),
    photos: p.photos,
  };
}
