import type { ProductKind, ProductStatus, ProductView } from "@/lib/types";
import { centsToReais } from "@/lib/format";
import { DEFAULT_PACKAGE } from "@/lib/shipping";

/** Bag categories offered in the admin wizard (matches the prototype's chips). */
export const BAG_CATEGORIES = [
  "Tote",
  "Transversal",
  "Clutch",
  "Bucket",
  "Ombro",
  "Mini",
] as const;

/** Clothing categories — editable starter list; adjust to Nic's real catalog. */
export const CLOTHING_CATEGORIES = [
  "Top",
  "Cropped",
  "Blusa",
  "Vestido",
  "Saída de praia",
  "Conjunto",
  "Outra",
] as const;

/** Available clothing sizes (Nic marks which ones a piece has). */
export const CLOTHING_SIZES = ["P", "M", "G"] as const;

/** Categories for a given kind. */
export function categoriesForKind(kind: ProductKind): readonly string[] {
  return kind === "CLOTHING" ? CLOTHING_CATEGORIES : BAG_CATEGORIES;
}

/** Back-compat alias — bag categories. */
export const ADMIN_CATEGORIES = BAG_CATEGORIES;

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "MADE_TO_ORDER", label: "Sob encomenda" },
  { value: "SOLD", label: "Esgotada" },
];

/** The redesigned wizard is 3 steps: essentials → appearance → story + review. */
export const WIZARD_STEP_LABELS = ["O essencial", "Aparência", "Prazo", "História"] as const;

/** Editable draft shape shared by the create/edit wizard and the server action. */
export type ProductDraft = {
  name: string;
  kind: ProductKind;
  category: string;
  sizes: string[]; // clothing sizes (empty for bags)
  priceReais: string; // raw input, e.g. "189" or "189,90"
  status: ProductStatus;
  featured: boolean;
  colors: string[]; // yarn color ids from the supplier palette
  allowsMultipleColors: boolean; // customer may pick more than one color
  leadTimeMinDays: string; // delivery estimate, raw input in days ("" = not informed)
  leadTimeMaxDays: string;
  // Shipping package (raw inputs, in grams / cm) — drive the Melhor Envio quote.
  weightGrams: string;
  heightCm: string;
  widthCm: string;
  lengthCm: string;
  tag: string;
  description: string;
  detailsText: string; // one detail per line
  photos: string[]; // Supabase Storage URLs
};

export const emptyDraft: ProductDraft = {
  name: "",
  kind: "BAG",
  category: "Tote",
  sizes: [],
  priceReais: "",
  status: "AVAILABLE",
  featured: false,
  colors: [],
  allowsMultipleColors: false,
  leadTimeMinDays: "",
  leadTimeMaxDays: "",
  weightGrams: String(DEFAULT_PACKAGE.weightGrams),
  heightCm: String(DEFAULT_PACKAGE.heightCm),
  widthCm: String(DEFAULT_PACKAGE.widthCm),
  lengthCm: String(DEFAULT_PACKAGE.lengthCm),
  tag: "",
  description: "",
  detailsText: "",
  photos: [],
};

export function draftFromProduct(p: ProductView): ProductDraft {
  return {
    name: p.name,
    kind: p.kind,
    category: p.category,
    sizes: p.sizes,
    priceReais: centsToReais(p.priceCents),
    status: p.status,
    featured: p.featured,
    colors: p.colors,
    allowsMultipleColors: p.allowsMultipleColors,
    leadTimeMinDays: p.leadTimeMinDays != null ? String(p.leadTimeMinDays) : "",
    leadTimeMaxDays: p.leadTimeMaxDays != null ? String(p.leadTimeMaxDays) : "",
    weightGrams: String(p.weightGrams ?? DEFAULT_PACKAGE.weightGrams),
    heightCm: String(p.heightCm ?? DEFAULT_PACKAGE.heightCm),
    widthCm: String(p.widthCm ?? DEFAULT_PACKAGE.widthCm),
    lengthCm: String(p.lengthCm ?? DEFAULT_PACKAGE.lengthCm),
    tag: p.tag ?? "",
    description: p.description,
    detailsText: p.details.join("\n"),
    photos: p.photos,
  };
}
