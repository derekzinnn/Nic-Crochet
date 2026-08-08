import "server-only";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/config";
import type { OrderItemSnapshot, OrderStatus, OrderView } from "@/lib/types";

/**
 * Public order lookup for the "acompanhe seu pedido" link. Keyed by the
 * unguessable publicToken — never by the order id — so a customer can check
 * their order without an account, and nobody can enumerate other people's.
 */
export async function getOrderByToken(token: string): Promise<OrderView | null> {
  if (!token || token.length < 8) return null;
  try {
    const o = await prisma.order.findUnique({ where: { publicToken: token } });
    if (!o) return null;
    return {
      id: o.id,
      publicToken: o.publicToken,
      trackingCode: o.trackingCode,
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
  } catch {
    return null;
  }
}

/** Absolute URL of the public tracking page for an order token. */
export function trackingUrl(token: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "");
  return `${base}/pedido/${token}`;
}
