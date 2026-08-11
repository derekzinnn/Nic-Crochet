import "server-only";

/**
 * Mercado Pago Checkout Pro integration (REST, no SDK). The Access Token stays
 * server-side; we create a payment "preference" for an order and redirect the
 * customer to Mercado Pago's hosted checkout (Pix / card / boleto). Payment
 * confirmation comes back via the return page and the webhook, which fetch the
 * authoritative payment status from the API.
 */

const MP_API = "https://api.mercadopago.com";

export function isMercadoPagoConfigured(): boolean {
  return !!process.env.MERCADO_PAGO_ACCESS_TOKEN;
}

function accessToken(): string {
  const t = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADO_PAGO_ACCESS_TOKEN ausente.");
  return t;
}

/** Public site origin used for return + notification URLs (no trailing slash). */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100").replace(/\/$/, "");
}

export type PreferenceItem = { title: string; quantity: number; unitPriceCents: number };

export type PreferenceInput = {
  orderId: string;
  items: PreferenceItem[];
  shippingCents: number;
  payer?: { name?: string; email?: string; cpf?: string };
};

export type PreferenceResult =
  | { ok: true; preferenceId: string; redirectUrl: string }
  | { ok: false; error: string };

/** Create a Checkout Pro preference and return its init_point (redirect URL). */
export async function createPreference(input: PreferenceInput): Promise<PreferenceResult> {
  const base = siteUrl();
  const https = base.startsWith("https://");

  const items = input.items.map((it) => ({
    title: it.title,
    quantity: it.quantity,
    unit_price: Math.round(it.unitPriceCents) / 100,
    currency_id: "BRL",
  }));
  if (input.shippingCents > 0) {
    items.push({
      title: "Frete",
      quantity: 1,
      unit_price: Math.round(input.shippingCents) / 100,
      currency_id: "BRL",
    });
  }

  const body: Record<string, unknown> = {
    items,
    external_reference: input.orderId,
    statement_descriptor: "NIC CROCHET",
    back_urls: {
      success: `${base}/checkout/retorno`,
      pending: `${base}/checkout/retorno`,
      failure: `${base}/checkout/retorno`,
    },
    notification_url: `${base}/api/mercado-pago/webhook`,
  };
  // auto_return needs an https success URL — skip it on localhost so MP doesn't reject.
  if (https) body.auto_return = "approved";
  if (input.payer?.email) {
    const payer: Record<string, unknown> = { name: input.payer.name, email: input.payer.email };
    const cpf = (input.payer.cpf ?? "").replace(/\D/g, "");
    if (cpf.length === 11) payer.identification = { type: "CPF", number: cpf };
    body.payer = payer;
  }

  try {
    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { id?: string; init_point?: string; message?: string };
    if (!res.ok || !data.init_point || !data.id) {
      return { ok: false, error: data.message || "Falha ao iniciar o pagamento." };
    }
    return { ok: true, preferenceId: data.id, redirectUrl: data.init_point };
  } catch {
    return { ok: false, error: "Não foi possível contatar o Mercado Pago." };
  }
}

export type MpPayment = {
  id: string;
  status: string; // approved | pending | in_process | rejected | cancelled | refunded ...
  externalReference: string | null;
};

/**
 * Find the payment Mercado Pago recorded for one of our orders. Used to sync a
 * still-PENDING order on demand, so payment status never has to be set by hand
 * (and so a missed webhook doesn't strand an order).
 */
export async function findPaymentByOrderId(orderId: string): Promise<MpPayment | null> {
  try {
    const res = await fetch(
      `${MP_API}/v1/payments/search?external_reference=${encodeURIComponent(orderId)}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${accessToken()}` }, cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ id: number | string; status: string; external_reference?: string | null }>;
    };
    const results = data.results ?? [];
    if (results.length === 0) return null;
    // Prefer an approved payment if the customer retried after a failure.
    const chosen = results.find((p) => p.status === "approved") ?? results[0];
    return {
      id: String(chosen.id),
      status: chosen.status,
      externalReference: chosen.external_reference ?? orderId,
    };
  } catch {
    return null;
  }
}

/** Fetch a payment's authoritative status from Mercado Pago. */
export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  try {
    const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken()}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      id: number | string;
      status: string;
      external_reference?: string | null;
    };
    return {
      id: String(d.id),
      status: d.status,
      externalReference: d.external_reference ?? null,
    };
  } catch {
    return null;
  }
}
