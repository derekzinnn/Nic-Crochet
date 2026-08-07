"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isValidEmail, type CreateOrderInput, type CreateOrderResult } from "@/lib/checkout";
import { colorNames } from "@/lib/custom-order";
import { createPreference, isMercadoPagoConfigured } from "@/lib/mercado-pago";
import type { OrderItemSnapshot } from "@/lib/types";

/**
 * Place an order from the checkout. Prices are recomputed server-side from the
 * DB (never trusted from the client), and each line is an immutable JSON
 * snapshot. The order is created as PENDING — payment (Mercado Pago) will move
 * it to PAID via webhook. Runs with no auth: this is the customer flow.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const lines = (input.lines ?? []).filter((l) => l.productId && l.qty > 0);
  if (lines.length === 0) return { ok: false, error: "Sua sacola está vazia." };

  const name = input.customer?.name?.trim() ?? "";
  const email = input.customer?.email?.trim() ?? "";
  const phone = input.customer?.phone?.trim() ?? "";
  if (!name) return { ok: false, error: "Informe seu nome." };
  if (!isValidEmail(email)) return { ok: false, error: "Informe um e-mail válido." };

  const method = input.deliveryMethod === "pickup" ? "PICKUP" : "SHIPPING";

  const addr = input.address;
  if (method === "SHIPPING") {
    if (!addr || !addr.cep || !addr.city || !addr.uf || !addr.street?.trim()) {
      return { ok: false, error: "Preencha o endereço de entrega." };
    }
  }

  try {
    const ids = lines.map((l) => l.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true, priceCents: true, status: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    const items: OrderItemSnapshot[] = [];
    let subtotal = 0;
    for (const l of lines) {
      const p = byId.get(l.productId);
      if (!p) return { ok: false, error: "Uma das peças saiu do catálogo. Revise sua sacola." };
      if (p.status === "SOLD") return { ok: false, error: `"${p.name}" já foi vendida.` };
      const qty = Math.max(1, Math.floor(l.qty));
      subtotal += p.priceCents * qty;
      items.push({
        productId: p.id,
        name: p.name,
        slug: p.slug,
        selectedColors: l.selectedColors ?? [],
        selectedSize: l.selectedSize ?? null,
        qty,
        unitPriceCents: p.priceCents,
      });
    }

    const shippingCents =
      method === "PICKUP" ? 0 : Math.max(0, Math.round(input.shippingCents ?? 0));
    if (method === "SHIPPING" && shippingCents <= 0) {
      return { ok: false, error: "Calcule o frete antes de finalizar." };
    }
    const total = subtotal + shippingCents;

    const order = await prisma.order.create({
      data: {
        items: items as unknown as Prisma.InputJsonValue,
        subtotalCents: subtotal,
        deliveryMethod: method,
        shippingCents,
        shippingLabel: method === "SHIPPING" ? (input.shippingLabel ?? null) : null,
        shippingDays: method === "SHIPPING" ? (input.shippingDays ?? null) : null,
        cep: addr?.cep ?? null,
        street: addr?.street?.trim() ?? null,
        district: addr?.district?.trim() || null,
        city: addr?.city ?? null,
        uf: addr?.uf ?? null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        totalCents: total,
        status: "PENDING",
      },
      select: { id: true },
    });

    revalidatePath("/area-da-nic/painel/pedidos");
    return { ok: true, orderId: order.id };
  } catch {
    return {
      ok: false,
      error: "Não foi possível registrar o pedido agora. Tente novamente em instantes.",
    };
  }
}

export type StartPaymentResult =
  | { ok: true; redirectUrl: string | null } // null = MP not configured (stub flow)
  | { ok: false; error: string };

/**
 * Start payment for a placed (PENDING) order: create a Mercado Pago Checkout Pro
 * preference and return its redirect URL. When no MP token is configured yet,
 * returns redirectUrl:null so the checkout can fall back to the "registered,
 * payment pending" screen.
 */
export async function startPayment(orderId: string): Promise<StartPaymentResult> {
  if (!isMercadoPagoConfigured()) return { ok: true, redirectUrl: null };

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { ok: false, error: "Pedido não encontrado." };
    if (order.status !== "PENDING") return { ok: false, error: "Este pedido já foi processado." };

    const items = (order.items as unknown as OrderItemSnapshot[]) ?? [];
    const pref = await createPreference({
      orderId: order.id,
      items: items.map((it) => {
        const extras = [
          colorNames(it.selectedColors),
          it.selectedSize ? `tam. ${it.selectedSize}` : "",
        ]
          .filter(Boolean)
          .join(" · ");
        return {
          title: extras ? `${it.name} (${extras})` : it.name,
          quantity: it.qty,
          unitPriceCents: it.unitPriceCents,
        };
      }),
      shippingCents: order.shippingCents,
      payer: { name: order.customerName, email: order.customerEmail },
    });
    if (!pref.ok) return { ok: false, error: pref.error };

    await prisma.order.update({
      where: { id: order.id },
      data: { mpPreferenceId: pref.preferenceId },
    });
    return { ok: true, redirectUrl: pref.redirectUrl };
  } catch {
    return { ok: false, error: "Não foi possível iniciar o pagamento agora." };
  }
}
