import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isEmailConfigured, sendOrderEmailToNic } from "@/lib/email";
import type { OrderView } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Admin-only: send a sample "novo pedido" e-mail to the configured notify
 * address. Used to verify the Resend setup (API key, sender, deliverability)
 * without waiting for a real sale — handy again whenever the sender domain
 * changes.
 */
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: "RESEND_API_KEY não configurada." }, { status: 400 });
  }

  const sample: OrderView = {
    id: "pedidoexemplo0001",
    items: [
      {
        productId: "sample-1",
        name: "Bolsa Estela",
        slug: "bolsa-estela",
        selectedColors: [],
        selectedSize: null,
        qty: 1,
        unitPriceCents: 13990,
      },
    ],
    subtotalCents: 13990,
    deliveryMethod: "pickup",
    shippingCents: 0,
    shippingLabel: null,
    shippingDays: null,
    cep: null,
    street: null,
    district: null,
    city: null,
    uf: null,
    customerName: "Cliente de Teste",
    customerEmail: "cliente@exemplo.com",
    customerPhone: "(53) 9 9999-9999",
    totalCents: 13990,
    status: "PAID",
    createdAt: new Date().toISOString(),
  };

  const sent = await sendOrderEmailToNic(sample);
  return sent
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Resend recusou o envio — veja os logs do servidor." }, { status: 502 });
}
