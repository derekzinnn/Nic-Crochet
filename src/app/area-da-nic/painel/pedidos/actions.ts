"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { findPaymentByOrderId, isMercadoPagoConfigured } from "@/lib/mercado-pago";
import { confirmOrderPayment } from "@/lib/order-payment";
import { FULFILMENT_STATUSES, type OrderStatus } from "@/lib/types";

/**
 * Advance an order through the fulfilment steps. Payment states are deliberately
 * not settable here — PENDING/PAID/CANCELLED come from Mercado Pago, via the
 * webhook or `syncOrderPayment`, so nobody can mark an unpaid order as paid.
 */
export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await requireAdmin();
  if (!FULFILMENT_STATUSES.includes(status)) {
    throw new Error("Esse status é definido pelo pagamento, não manualmente.");
  }
  const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) return;
  // Only a paid order can move along; an unpaid one has nothing to fulfil.
  if (order.status === "PENDING" || order.status === "CANCELLED") {
    throw new Error("Confirme o pagamento antes de avançar o pedido.");
  }
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/area-da-nic/painel/pedidos");
}

export type SyncPaymentResult = {
  ok: boolean;
  status?: OrderStatus;
  /** Human line for the toast. */
  message: string;
};

/**
 * Ask Mercado Pago whether this order was paid, and sync it. Covers the case
 * where the webhook never arrived (site was down, or running on localhost where
 * Mercado Pago can't reach us).
 */
export async function syncOrderPayment(id: string): Promise<SyncPaymentResult> {
  await requireAdmin();
  if (!isMercadoPagoConfigured()) {
    return { ok: false, message: "Mercado Pago não está configurado." };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, mpPaymentId: true },
  });
  if (!order) return { ok: false, message: "Pedido não encontrado." };

  const payment = await findPaymentByOrderId(id);
  if (!payment) {
    return {
      ok: false,
      message: "Nenhum pagamento encontrado no Mercado Pago para este pedido.",
    };
  }

  // confirmOrderPayment re-reads the payment from the API and is the single
  // place that writes payment status, so webhook and manual sync can't diverge.
  const result = await confirmOrderPayment(payment.id);
  revalidatePath("/area-da-nic/painel/pedidos");

  if (result.status === "PAID") {
    return { ok: true, status: "PAID", message: "Pagamento confirmado! 🎉" };
  }
  if (result.status === "CANCELLED") {
    return { ok: true, status: "CANCELLED", message: "O pagamento foi recusado ou cancelado." };
  }
  return {
    ok: true,
    status: result.status as OrderStatus,
    message: "O pagamento ainda está pendente no Mercado Pago.",
  };
}

/** Postal tracking code — shows up on the customer's tracking page. */
export async function setOrderTracking(id: string, code: string): Promise<void> {
  await requireAdmin();
  const trackingCode = code.trim().toUpperCase() || null;
  await prisma.order.update({ where: { id }, data: { trackingCode } });
  revalidatePath("/area-da-nic/painel/pedidos");
}

export async function deleteOrder(id: string): Promise<void> {
  await requireAdmin();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/area-da-nic/painel/pedidos");
}
