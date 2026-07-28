import "server-only";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PACKAGE,
  MIN_DIMENSIONS,
  onlyDigits,
  type ShippingLineInput,
  type ShippingOption,
} from "@/lib/shipping";

/** ViaCEP address (only the fields we use). `erro` marks an unknown CEP. */
export type ViaCepResult =
  | { ok: true; city: string; uf: string }
  | { ok: false; reason: "not_found" | "unreachable" };

const VIACEP_TIMEOUT_MS = 6000;
const MELHOR_ENVIO_TIMEOUT_MS = 12000;

/** Origin CEP (Nic's atelier in Pelotas). Env-overridable; digits only. */
export function originCep(): string {
  return onlyDigits(process.env.SHIPPING_ORIGIN_CEP || "96030740");
}

function melhorEnvioBase(): string {
  // Sandbox by default; set to https://melhorenvio.com.br for production.
  return (process.env.MELHOR_ENVIO_BASE_URL || "https://sandbox.melhorenvio.com.br").replace(
    /\/$/,
    "",
  );
}

/** Fetch with a hard timeout so a hung external API can't freeze checkout. */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Validate + resolve a CEP to a city/UF via ViaCEP (free, no key). */
export async function lookupCep(cepDigits: string): Promise<ViaCepResult> {
  try {
    const res = await fetchWithTimeout(
      `https://viacep.com.br/ws/${cepDigits}/json/`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
      VIACEP_TIMEOUT_MS,
    );
    if (!res.ok) return { ok: false, reason: "unreachable" };
    const data = (await res.json()) as { erro?: boolean; localidade?: string; uf?: string };
    if (data?.erro) return { ok: false, reason: "not_found" };
    return { ok: true, city: data.localidade ?? "", uf: data.uf ?? "" };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

type PackageBox = {
  weightKg: number;
  widthCm: number;
  heightCm: number;
  lengthCm: number;
  insuranceReais: number;
};

/**
 * Collapse the cart into ONE package (v1 decision): sum weights, stack heights,
 * and take the widest/longest footprint, clamped to Correios' minimum sizes.
 * Dimensions are read server-side from the DB per product (falling back to the
 * bag defaults for anything not found — e.g. seed/fallback catalogue).
 */
export async function buildPackage(lines: ShippingLineInput[]): Promise<PackageBox> {
  const ids = lines.map((l) => l.productId);
  let dims: Array<{
    id: string;
    weightGrams: number;
    heightCm: number;
    widthCm: number;
    lengthCm: number;
    priceCents: number;
  }> = [];
  try {
    dims = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        weightGrams: true,
        heightCm: true,
        widthCm: true,
        lengthCm: true,
        priceCents: true,
      },
    });
  } catch {
    dims = []; // DB unreachable — fall back to defaults below.
  }
  const byId = new Map(dims.map((d) => [d.id, d]));

  let weightGrams = 0;
  let stackedHeight = 0;
  let maxWidth: number = MIN_DIMENSIONS.widthCm;
  let maxLength: number = MIN_DIMENSIONS.lengthCm;
  let insuranceCents = 0;

  for (const line of lines) {
    const d = byId.get(line.productId);
    const w = d?.weightGrams ?? DEFAULT_PACKAGE.weightGrams;
    const h = d?.heightCm ?? DEFAULT_PACKAGE.heightCm;
    const wd = d?.widthCm ?? DEFAULT_PACKAGE.widthCm;
    const ln = d?.lengthCm ?? DEFAULT_PACKAGE.lengthCm;
    const price = d?.priceCents ?? 0;
    const qty = Math.max(1, line.qty);

    weightGrams += w * qty;
    stackedHeight += h * qty;
    maxWidth = Math.max(maxWidth, wd);
    maxLength = Math.max(maxLength, ln);
    insuranceCents += price * qty;
  }

  return {
    weightKg: Math.max(0.05, weightGrams / 1000),
    widthCm: Math.max(MIN_DIMENSIONS.widthCm, maxWidth),
    heightCm: Math.max(MIN_DIMENSIONS.heightCm, stackedHeight),
    lengthCm: Math.max(MIN_DIMENSIONS.lengthCm, maxLength),
    insuranceReais: insuranceCents / 100,
  };
}

export type QuoteResult =
  | { ok: true; options: ShippingOption[]; simulated: boolean }
  | { ok: false; reason: "unreachable" | "no_options" };

type MelhorEnvioService = {
  id: number | string;
  name?: string;
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number;
  company?: { name?: string };
  error?: string;
};

/**
 * Quote shipping via Melhor Envio's shipment calculation endpoint. When no token
 * is configured we fall back to a clearly-labeled *simulated* estimate (dev, and
 * so the store keeps working before Nic finishes the Melhor Envio setup) rather
 * than blocking checkout entirely. Set MELHOR_ENVIO_TOKEN for real quotes.
 */
export async function quoteShipping(destCep: string, box: PackageBox): Promise<QuoteResult> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return { ok: true, options: simulateOptions(destCep, box), simulated: true };

  try {
    const res = await fetchWithTimeout(
      `${melhorEnvioBase()}/api/v2/me/shipment/calculate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          // Melhor Envio requires a User-Agent with a contact address.
          "User-Agent":
            process.env.MELHOR_ENVIO_USER_AGENT || "Nic Crochet (contato@niccrochet.com)",
        },
        cache: "no-store",
        body: JSON.stringify({
          from: { postal_code: originCep() },
          to: { postal_code: destCep },
          package: {
            weight: box.weightKg,
            width: box.widthCm,
            height: box.heightCm,
            length: box.lengthCm,
          },
          options: { insurance_value: box.insuranceReais, receipt: false, own_hand: false },
        }),
      },
      MELHOR_ENVIO_TIMEOUT_MS,
    );
    if (!res.ok) return { ok: false, reason: "unreachable" };

    const services = (await res.json()) as MelhorEnvioService[];
    if (!Array.isArray(services)) return { ok: false, reason: "unreachable" };

    const options: ShippingOption[] = services
      .filter((s) => !s.error && s.price != null && s.delivery_time != null)
      .map((s) => ({
        id: String(s.id),
        name: s.name ?? "Frete",
        company: s.company?.name ?? "",
        priceCents: Math.round(Number(s.custom_price ?? s.price) * 100),
        deliveryDays: Number(s.delivery_time),
      }))
      .filter((o) => Number.isFinite(o.priceCents) && o.priceCents > 0)
      .sort((a, b) => a.priceCents - b.priceCents);

    if (options.length === 0) return { ok: false, reason: "no_options" };
    return { ok: true, options, simulated: false };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

/**
 * Deterministic placeholder quote used only when no Melhor Envio token is set.
 * Roughly weight- and distance-based (by CEP region digit) so the numbers feel
 * plausible while the flow is exercised. Clearly flagged `simulated` in the UI.
 */
function simulateOptions(destCep: string, box: PackageBox): ShippingOption[] {
  const region = Number(destCep[0] || "5"); // 0 (SP) … 9 (far); Pelotas ~ 9
  const distance = Math.abs(region - 9); // 0 near origin (RS) … up to 9
  const base = 1800 + Math.round(box.weightKg * 900) + distance * 650; // centavos
  const pac = base;
  const sedex = Math.round(base * 1.7);
  const days = 3 + distance; // rough business days
  return [
    { id: "sim-pac", name: "PAC", company: "Correios", priceCents: pac, deliveryDays: days + 4 },
    { id: "sim-sedex", name: "SEDEX", company: "Correios", priceCents: sedex, deliveryDays: days },
  ];
}
