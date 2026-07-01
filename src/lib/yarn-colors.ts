/**
 * ─────────────────────────────────────────────────────────────
 * PALETA DE CORES DO FORNECEDOR — EDITE AQUI
 * ─────────────────────────────────────────────────────────────
 * Estas são as ÚNICAS cores que a Nic pode selecionar ao cadastrar uma bolsa
 * (nada de inventar cor). Troque pela lista real do fornecedor: mantenha um
 * `id` estável (sem espaços/acentos), o `name` que aparece pro cliente e o
 * `hex` aproximado do fio (usado nos swatches e no fundo placeholder).
 *
 * Para adicionar/remover: basta editar este array. Produtos guardam só os `id`s.
 */
export type YarnColor = { id: string; name: string; hex: string };

export const YARN_COLORS: YarnColor[] = [
  { id: "cru", name: "Cru", hex: "#E7DCC4" },
  { id: "bege", name: "Bege", hex: "#C9AE7E" },
  { id: "caramelo", name: "Caramelo", hex: "#B98C58" },
  { id: "terracota", name: "Terracota", hex: "#C0714E" },
  { id: "mostarda", name: "Mostarda", hex: "#C9A85B" },
  { id: "ferrugem", name: "Ferrugem", hex: "#9C5B3B" },
  { id: "verde-salvia", name: "Verde sálvia", hex: "#8B9A60" },
  { id: "verde-oliva", name: "Verde oliva", hex: "#6E7C48" },
  { id: "rosa-antigo", name: "Rosa antigo", hex: "#C9989A" },
  { id: "vinho", name: "Vinho", hex: "#7C3B44" },
  { id: "azul-petroleo", name: "Azul petróleo", hex: "#4E6E76" },
  { id: "cinza", name: "Cinza", hex: "#9A9580" },
  { id: "off-white", name: "Off-white", hex: "#F1ECDD" },
  { id: "preto", name: "Preto", hex: "#3B3A2E" },
];

const BY_ID = new Map(YARN_COLORS.map((c) => [c.id, c]));

export function getYarnColor(id: string): YarnColor | undefined {
  return BY_ID.get(id);
}

/** Keep only ids that exist in the current palette. */
export function validYarnIds(ids: string[]): string[] {
  return ids.filter((id) => BY_ID.has(id));
}

/** Resolve selected color ids into full color objects (in palette order-agnostic). */
export function resolveYarnColors(ids: string[]): YarnColor[] {
  return ids.map((id) => BY_ID.get(id)).filter((c): c is YarnColor => Boolean(c));
}

const DEFAULT_SWATCH = { primary: "#9AA86E", secondary: "#8B9A60" };

/**
 * Two hexes for the woven placeholder swatch, derived from a product's selected
 * colors. Falls back to the house green when no colors are set.
 */
export function swatchFromColors(ids: string[]): { primary: string; secondary: string } {
  const colors = resolveYarnColors(ids);
  if (colors.length === 0) return DEFAULT_SWATCH;
  return {
    primary: colors[0].hex,
    secondary: (colors[1] ?? colors[0]).hex,
  };
}
