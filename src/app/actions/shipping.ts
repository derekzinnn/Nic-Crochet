"use server";

import { isValidCep, onlyDigits, type ShippingLineInput, type ShippingResult } from "@/lib/shipping";
import { buildPackage, lookupCep, quoteShipping } from "@/lib/melhor-envio";

/**
 * Calculate shipping for a cart: validate the CEP, resolve it via ViaCEP (cheap
 * failure path), then quote with Melhor Envio. Runs on the server so the API
 * token never reaches the browser. Returns a discriminated result the cart UI
 * maps to inline states.
 */
export async function calculateShipping(
  rawCep: string,
  lines: ShippingLineInput[],
): Promise<ShippingResult> {
  const cep = onlyDigits(rawCep);

  if (!isValidCep(cep)) {
    return { ok: false, code: "invalid_cep", message: "CEP inválido. Use o formato 00000-000." };
  }
  const clean = lines.filter((l) => l.productId && l.qty > 0);
  if (clean.length === 0) {
    return { ok: false, code: "empty_cart", message: "Sua sacola está vazia." };
  }

  // 1) ViaCEP — validate the address before spending a shipping-quote call.
  const address = await lookupCep(cep);
  if (!address.ok) {
    return address.reason === "not_found"
      ? { ok: false, code: "cep_not_found", message: "CEP não encontrado. Confira os números." }
      : {
          ok: false,
          code: "quote_failed",
          message: "Não deu para consultar o CEP agora. Tente novamente.",
        };
  }

  // 2) Melhor Envio — quote the (single, summed) package.
  const box = await buildPackage(clean);
  const quote = await quoteShipping(cep, box);
  if (!quote.ok) {
    return quote.reason === "no_options"
      ? {
          ok: false,
          code: "no_options",
          message: "Nenhuma opção de frete para este CEP. Fale com a Nic pelo WhatsApp.",
        }
      : {
          ok: false,
          code: "quote_failed",
          message: "Não foi possível calcular o frete agora. Tente novamente em instantes.",
        };
  }

  return {
    ok: true,
    address: { cep, city: address.city, uf: address.uf },
    options: quote.options,
    simulated: quote.simulated,
  };
}
