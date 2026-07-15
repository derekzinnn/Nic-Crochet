import { resolveYarnColors } from "@/lib/yarn-colors";

export const PIECE_TYPES = ["Bolsa", "Clutch", "Bucket", "Mini", "Outra"] as const;
export const SIZES = ["Pequena", "Média", "Grande"] as const;
export const WIZARD_STEP_LABELS = ["Peça & tamanho", "Cores", "Detalhes", "Contato"] as const;

export type CustomOrderInput = {
  pieceType: string;
  size: string;
  colors: string[]; // selected yarn color ids from the supplier palette
  deadline: string;
  details: string;
  name: string;
  contact: string;
};

export const emptyCustomOrder: CustomOrderInput = {
  pieceType: "Bolsa",
  size: "Média",
  colors: [],
  deadline: "",
  details: "",
  name: "",
  contact: "",
};

/** Human-readable list of the selected color names, e.g. "Terracota, Cru". */
export function colorNames(ids: string[]): string {
  return resolveYarnColors(ids)
    .map((c) => c.name)
    .join(", ");
}

/** Server + client shared validation. Name and contact are required. */
export function validateCustomOrder(input: CustomOrderInput): string | null {
  if (!input.name.trim()) return "Conte seu nome para a Nic te encontrar.";
  if (!input.contact.trim()) return "Deixe um contato (WhatsApp ou @instagram).";
  if (!input.pieceType.trim() || !input.size.trim()) return "Escolha o tipo e o tamanho da peça.";
  return null;
}

/** Pre-filled WhatsApp message the customer sends to Nic with their request. */
export function customOrderWhatsappMessage(input: CustomOrderInput): string {
  const cores = colorNames(input.colors) || "a combinar";
  return [
    "Olá, Nic! 🌿 Quero encomendar uma peça sob medida:",
    "",
    `• Tipo: ${input.pieceType}`,
    `• Tamanho: ${input.size}`,
    `• Cores: ${cores}`,
    `• Prazo: ${input.deadline.trim() || "a combinar"}`,
    input.details.trim() ? `• Detalhes: ${input.details.trim()}` : null,
    "",
    `Meu nome: ${input.name.trim()}`,
    `Contato: ${input.contact.trim()}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
