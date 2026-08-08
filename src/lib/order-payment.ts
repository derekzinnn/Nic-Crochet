import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/mercado-pago";
import { sendOrderEmailToNic, sendOrderEmailToCustomer, isEmailConfigured } from "@/lib/email";
import type { OrderItemSnapshot, OrderStatus, OrderView } from "@/lib/types";

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
type DbOrder = Awaited<ReturnType<typeof prisma.order.findFirstOrThrow>>;

function toOrderView(o: DbOrder): OrderView {
  return {
    id: o.id,
    items: (o.items as unknown as OrderItemSnapshot[]) ?? [],
    subtotalCents: o.subtotalCents,
    deliveryMethod: o.deliveryMethod === "PICKUP" ? "pickup" : "shipping",
    shippingCents: o.shippingCents,
    shippingLabel: o.shippingLabel,
    shippingDays: o.shippingDays,
    cep: o.cep,
    street: o.street,
    district: o.district,
    city: o.city,
    uf: o.uf,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    totalCents: o.totalCents,
    status: o.status as OrderStatus,
    createdAt: o.createdAt.toISOString(),
  };
}

/**
 * Tell Nic (and the customer) that a paid order came in. Guarded by a
 * conditional `emailSentAt` write so the webhook and the return page can't both
 * send — whichever gets there first claims it. Best-effort: never throws.
 */
async function notifyPaidOrder(orderId: string, order: DbOrder): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    // Atomic claim: only the update that matches emailSentAt=null proceeds.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, emailSentAt: null },
      data: { emailSentAt: new Date() },
    });
    if (claimed.count === 0) return; // someone already sent them

    const view = toOrderView(order);
    await Promise.all([sendOrderEmailToNic(view), sendOrderEmailToCustomer(view)]);
  } catch (err) {
    console.warn("[order-payment] falha ao notificar por e-mail:", (err as Error).message);
  }
}

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
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: next, mpPaymentId: payment.id },
      });
      revalidatePath("/area-da-nic/painel/pedidos");
      if (next === "PAID") await notifyPaidOrder(orderId, updated);
      return { orderId, status: next };
    }
    return { orderId, status: order.status as OrderStatus };
  } catch {
    return { orderId, status: "PENDING" };
  }
}
