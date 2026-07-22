import type { ProductView } from "@/lib/types";
import { swatchFromColors } from "@/lib/yarn-colors";

/**
 * Seed catalogue lifted from the approved design prototype.
 * Used by `prisma/seed.ts` to populate the DB, and as a static fallback so the
 * site renders before a live database exists. `colors` are ids from the supplier
 * palette (src/lib/yarn-colors.ts); the placeholder swatch is derived from them.
 */
type SeedProduct = Omit<
  ProductView,
  "colorPrimary" | "colorSecondary" | "allowsMultipleColors" | "leadTimeMinDays" | "leadTimeMaxDays"
>;

const raw: SeedProduct[] = [
  {
    id: "margarida",
    name: "Bolsa Margarida",
    slug: "bolsa-margarida",
    category: "Tote",
    priceCents: 18900,
    tag: "Mais amada",
    featured: true,
    status: "AVAILABLE",
    colors: ["verde-salvia", "cru"],
    description:
      "Tote estruturada em fio de algodão cru, com alça reforçada e forro interno de linho. Cabe o dia inteiro.",
    details: ["Algodão 100% natural", "Forro em linho", "Alça reforçada 60cm", "≈ 3 semanas de trabalho"],
    photos: [],
  },
  {
    id: "sol",
    name: "Crossbody Sol",
    slug: "crossbody-sol",
    category: "Transversal",
    priceCents: 14900,
    tag: null,
    featured: true,
    status: "AVAILABLE",
    colors: ["caramelo", "bege"],
    description: "Bolsa transversal pequena, ponto fechado e alça ajustável. Para sair leve.",
    details: ["Algodão encerado", "Alça ajustável", "Fecho de imã", "Cores sob consulta"],
    photos: [],
  },
  {
    id: "lua",
    name: "Clutch Lua",
    slug: "clutch-lua",
    category: "Clutch",
    priceCents: 9800,
    tag: null,
    featured: true,
    status: "AVAILABLE",
    colors: ["verde-salvia", "verde-oliva"],
    description: "Carteira de mão em ponto pipoca, com pegador de madeira torneada.",
    details: ["Ponto pipoca", "Pegador de madeira", "Forro acetinado", "Peça de festa"],
    photos: [],
  },
  {
    id: "praia",
    name: "Bolsa Praia",
    slug: "bolsa-praia",
    category: "Tote",
    priceCents: 16900,
    tag: "Verão",
    featured: false,
    status: "AVAILABLE",
    colors: ["bege", "cru"],
    description: "Sacola ampla de fio de juta e algodão, vazada, perfeita para o verão.",
    details: ["Juta + algodão", "Ponto vazado", "Base reforçada", "Alças longas"],
    photos: [],
  },
  {
    id: "bibi",
    name: "Mini Bibi",
    slug: "mini-bibi",
    category: "Mini",
    priceCents: 8900,
    tag: null,
    featured: false,
    status: "AVAILABLE",
    colors: ["verde-salvia", "mostarda"],
    description: "Mini bolsa redonda com corrente dourada. Cabe o essencial e muito charme.",
    details: ["Formato redondo", "Corrente dourada", "Forro em algodão", "Tamanho compacto"],
    photos: [],
  },
  {
    id: "campo",
    name: "Bucket Campo",
    slug: "bucket-campo",
    category: "Bucket",
    priceCents: 17500,
    tag: null,
    featured: false,
    status: "AVAILABLE",
    colors: ["verde-oliva", "verde-salvia"],
    description: "Bolsa saco com fechamento de cordão e franjas. Boêmia na medida certa.",
    details: ["Fechamento cordão", "Franjas tecidas", "Base circular", "Estrutura firme"],
    photos: [],
  },
  {
    id: "folha",
    name: "Shoulder Folha",
    slug: "shoulder-folha",
    category: "Ombro",
    priceCents: 15900,
    tag: null,
    featured: false,
    status: "AVAILABLE",
    colors: ["bege", "caramelo"],
    description: "Bolsa de ombro em ponto trançado, silhueta meia-lua bem atual.",
    details: ["Ponto trançado", "Silhueta meia-lua", "Alça curta", "Fecho oculto"],
    photos: [],
  },
  {
    id: "sob-medida",
    name: "Sua peça sob medida",
    slug: "sua-peca-sob-medida",
    category: "Custom",
    priceCents: 22000,
    tag: "Você escolhe",
    featured: false,
    status: "MADE_TO_ORDER",
    colors: ["verde-salvia", "verde-oliva"],
    description: "Do zero, do seu jeito: formato, cores e tamanho pensados com você.",
    details: ["Projeto a 4 mãos", "Cores à sua escolha", "Tamanho livre", "A partir de"],
    photos: [],
  },
];

export const seedProducts: ProductView[] = raw.map((p) => {
  const swatch = swatchFromColors(p.colors);
  return {
    ...p,
    allowsMultipleColors: p.colors.length > 1,
    leadTimeMinDays: null,
    leadTimeMaxDays: null,
    colorPrimary: swatch.primary,
    colorSecondary: swatch.secondary,
  };
});
