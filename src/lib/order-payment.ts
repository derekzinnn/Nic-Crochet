import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercado-pago";
import type { OrderStatus } from "@/lib/types";

/** Map a Mercado Pago payment status to our OrderStatus (null = leave as-is). */
function mapStatus(mpStatus: string): OrderStatus | null {
  switch (mpStatus) {
    case "approved":
      return "PAID";
    case "rejected":
    case "cancelled":
      return "CANCELLED";
    default:
      return null; // pending / in_process / etc.
  }
}

export type ConfirmResult = {
  orderId: string | null;
  status: OrderStatus | "PENDING";
};

/**
 * Confirm a payment against the Mercado Pago API (authoritative) and sync the
 * order. Safe to call from both the return page and the webhook — it fetches the
 * real payment status rather than trusting the caller. Never downgrades a PAID
 * order.
 */
export async function confirmOrderPayment(paymentId: string): Promise<ConfirmResult> {
  const payment = await getPayment(paymentId);
  if (!payment || !payment.externalReference) return { orderId: null, status: "PENDING" };

  const orderId = payment.externalReference;
  const next = mapStatus(payment.status);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });
    if (!order) return { orderId: null, status: "PENDING" };

    // Only advance a still-pending order; never undo a confirmed payment.
    if (order.status === "PENDING" && next) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: next, mpPaymentId: payment.id },
      });
      revalidatePath("/area-da-nic/painel/pedidos");
      return { orderId, status: next };
    }
    return { orderId, status: order.status as OrderStatus };
  } catch {
    return { orderId, status: "PENDING" };
  }
}
