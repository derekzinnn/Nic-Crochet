/**
 * ─────────────────────────────────────────────────────────────
 * PALETA DE CORES OFICIAL DA NIC CROCHET
 * ─────────────────────────────────────────────────────────────
 * As ÚNICAS cores que a Nic seleciona ao cadastrar uma peça. O `id` é o CÓDIGO
 * do fio (o mesmo que vem etiquetado no fornecedor), o `name` aparece pro
 * cliente e o `hex` é a aproximação da cor (swatch + fundo placeholder).
 * Produtos guardam só os `id`s. Para ajustar um tom, edite o `hex` aqui.
 */
export type YarnColor = { id: string; name: string; hex: string };

export const YARN_COLORS: YarnColor[] = [
  { id: "001", name: "Azul Bondi", hex: "#3E8FA3" },
  { id: "002", name: "Verde Hortelã", hex: "#A9D8C0" },
  { id: "004", name: "Rosa Claro", hex: "#C98FB4" },
  { id: "005", name: "Amarelo Bebê", hex: "#EEDC8E" },
  { id: "006", name: "Off White", hex: "#F0EDE4" },
  { id: "007", name: "Rosê Antigo", hex: "#C793AF" },
  { id: "009", name: "Very Peri", hex: "#6566A6" },
  { id: "010", name: "Manteiga", hex: "#D9D6BF" },
  { id: "011", name: "Pérola", hex: "#C7BFC0" },
  { id: "012", name: "Hibisco", hex: "#C15E71" },
  { id: "013", name: "Pôr do Sol", hex: "#C56A4A" },
  { id: "015", name: "Frozen", hex: "#90B9D6" },
  { id: "016", name: "Malbec", hex: "#8A6E85" },
  { id: "018", name: "Caramelo", hex: "#A9703F" },
  { id: "019", name: "Telha", hex: "#A5453B" },
  { id: "020", name: "Terracota", hex: "#C06A3C" },
  { id: "021", name: "Marrom", hex: "#5B3A33" },
  { id: "023", name: "Vermelho", hex: "#B02420" },
  { id: "024", name: "Mostarda", hex: "#D39A2E" },
  { id: "025", name: "Ocre", hex: "#6C3A2B" },
  { id: "028", name: "Bege", hex: "#B8A68E" },
  { id: "029", name: "Oliva", hex: "#8B9A4E" },
  { id: "030", name: "Beringema", hex: "#4A2340" },
  { id: "039", name: "Alumínio Cinza", hex: "#9B9BA1" },
  { id: "040", name: "Preto", hex: "#1F1F1F" },
  { id: "042", name: "Grafite", hex: "#5E6068" },
  { id: "043", name: "Future Dusk FL", hex: "#63648B" },
  { id: "044", name: "Marinho", hex: "#2B3A5C" },
  { id: "045", name: "Azul Mar", hex: "#4F87B0" },
  { id: "048", name: "Areia", hex: "#D9CDB8" },
  { id: "061", name: "Ferrari", hex: "#B12127" },
  { id: "062", name: "Pink", hex: "#C42562" },
  { id: "064", name: "Esmeralda", hex: "#1E8A5F" },
  { id: "065", name: "Verde Mesgo", hex: "#7B8A4E" },
  { id: "066", name: "Royal", hex: "#3B4EA0" },
  { id: "067", name: "Canela", hex: "#8E3B33" },
  { id: "068", name: "Solar", hex: "#D79A2A" },
  { id: "069", name: "Lavanda", hex: "#B7A6D6" },
  { id: "070", name: "Babaloo", hex: "#D26397" },
  { id: "082", name: "Fúcsia", hex: "#A61E5D" },
  { id: "083", name: "Turquesa", hex: "#2AA7B8" },
  { id: "084", name: "Cappuccino", hex: "#6E5A4E" },
  { id: "085", name: "Mocha Mousse", hex: "#8B6A55" },
  { id: "086", name: "Marsala", hex: "#6E2A38" },
  { id: "088", name: "Greige", hex: "#9B8F81" },
  { id: "089", name: "Tea Rosê", hex: "#C3A7B4" },
  { id: "090", name: "Coffee Bean", hex: "#3E2A2C" },
];

const BY_ID = new Map(YARN_COLORS.map((c) => [c.id, c]));

/**
 * Old placeholder ids → official codes, so bags tagged before this palette keep
 * their colors. Used by the one-off migration (scripts/migrate-yarn-colors.mjs)
 * and as a read-time fallback.
 */
export const LEGACY_COLOR_MAP: Record<string, string> = {
  cru: "010",
  bege: "028",
  caramelo: "018",
  terracota: "020",
  mostarda: "024",
  ferrugem: "019",
  "verde-salvia": "029",
  "verde-oliva": "029",
  "rosa-antigo": "007",
  vinho: "086",
  "azul-petroleo": "001",
  cinza: "039",
  "off-white": "006",
  preto: "040",
};

/** Resolve an id to the palette, translating any leftover legacy id. */
function canonical(id: string): string {
  return BY_ID.has(id) ? id : (LEGACY_COLOR_MAP[id] ?? id);
}

export function getYarnColor(id: string): YarnColor | undefined {
  return BY_ID.get(canonical(id));
}

/** Keep only ids that resolve to the current palette (legacy ids translated). */
export function validYarnIds(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const c = canonical(id);
    if (BY_ID.has(c) && !out.includes(c)) out.push(c);
  }
  return out;
}

/** Resolve selected color ids into full color objects. */
export function resolveYarnColors(ids: string[]): YarnColor[] {
  const seen = new Set<string>();
  const out: YarnColor[] = [];
  for (const id of ids) {
    const c = BY_ID.get(canonical(id));
    if (c && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
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
