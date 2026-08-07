import { NextResponse } from "next/server";
import { confirmOrderPayment } from "@/lib/order-payment";

export const runtime = "nodejs";

/**
 * Mercado Pago payment notifications (Webhooks v2 + legacy IPN). We only use the
 * notification to learn a payment id, then fetch the authoritative status from
 * the API (in confirmOrderPayment) — so a spoofed body can't mark an order paid.
 * Always returns 200 quickly so Mercado Pago doesn't retry needlessly.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const qpType = url.searchParams.get("type") || url.searchParams.get("topic");
  const qpId = url.searchParams.get("data.id") || url.searchParams.get("id");

  let bodyType: string | undefined;
  let bodyId: string | undefined;
  try {
    const body = (await req.json()) as { type?: string; data?: { id?: string | number } };
    bodyType = body?.type;
    bodyId = body?.data?.id != null ? String(body.data.id) : undefined;
  } catch {
    // no/invalid JSON body — rely on query params
  }

  const type = bodyType || qpType;
  const paymentId = bodyId || qpId;

  if (type === "payment" && paymentId) {
    try {
      await confirmOrderPayment(paymentId);
    } catch {
      // swallow — MP will retry; we still 200 so it doesn't hammer us
    }
  }

  return NextResponse.json({ received: true });
}
