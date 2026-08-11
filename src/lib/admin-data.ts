import "server-only";
import { prisma } from "@/lib/prisma";
import { PAID_STATUSES } from "@/lib/finance";
import type {
  CustomOrderStatus,
  CustomOrderView,
  ExpenseView,
  IncomeOrderView,
  ManualSaleView,
  OrderItemSnapshot,
  OrderStatus,
  OrderView,
  TaskView,
} from "@/lib/types";

async function safe<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[admin-data] DB unavailable:", (err as Error).message);
    }
    return fallback;
  }
}

export async function getCustomOrders(): Promise<CustomOrderView[]> {
  return safe(
    async () =>
      (await prisma.customOrderRequest.findMany({ orderBy: { createdAt: "desc" } })).map((o) => ({
        id: o.id,
        pieceType: o.pieceType,
        size: o.size,
        colors: o.colors,
        deadline: o.deadline,
        details: o.details,
        name: o.name,
        contact: o.contact,
        status: o.status as CustomOrderStatus,
        createdAt: o.createdAt.toISOString(),
      })),
    [],
  );
}

export async function getNewOrdersCount(): Promise<number> {
  return safe(async () => prisma.customOrderRequest.count({ where: { status: "NEW" } }), 0);
}

type DbOrder = Awaited<ReturnType<typeof prisma.order.findMany>>[number];

function toOrderView(o: DbOrder): OrderView {
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
    customerCpf: o.customerCpf,
    totalCents: o.totalCents,
    status: o.status as OrderStatus,
    createdAt: o.createdAt.toISOString(),
  };
}

export async function getOrders(): Promise<OrderView[]> {
  return safe(
    async () => (await prisma.order.findMany({ orderBy: { createdAt: "desc" } })).map(toOrderView),
    [],
  );
}

/** Count of orders that still need attention (awaiting payment or to fulfill). */
export async function getOpenOrdersCount(): Promise<number> {
  return safe(
    async () => prisma.order.count({ where: { status: { in: ["PENDING", "PAID"] } } }),
    0,
  );
}

export type ShippingHealthView = {
  /** No Melhor Envio token set — quotes are the labeled simulated estimate. */
  simulated: boolean;
  /** True when the last quote attempt failed and nothing succeeded after it. */
  failing: boolean;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
};

/** Freight status for the admin banner — is it simulated, or currently broken? */
export async function getShippingHealth(): Promise<ShippingHealthView> {
  const simulated = !process.env.MELHOR_ENVIO_TOKEN;
  const row = await safe(
    async () => prisma.shippingHealth.findUnique({ where: { id: "singleton" } }),
    null,
  );
  const failing =
    !!row?.lastFailureAt && (!row.lastSuccessAt || row.lastFailureAt > row.lastSuccessAt);
  return {
    simulated,
    failing,
    lastFailureAt: row?.lastFailureAt ? row.lastFailureAt.toISOString() : null,
    lastFailureReason: row?.lastFailureReason ?? null,
  };
}

/** Expenses in a date range (Finanças dashboard), newest first. */
export async function getExpenses(from: Date, to: Date): Promise<ExpenseView[]> {
  return safe(
    async () =>
      (
        await prisma.expense.findMany({
          where: { date: { gte: from, lt: to } },
          orderBy: { date: "desc" },
        })
      ).map((e) => ({
        id: e.id,
        description: e.description,
        amountCents: e.amountCents,
        category: e.category,
        date: e.date.toISOString(),
      })),
    [],
  );
}

/** Paid orders in a date range — the automatic income side of the dashboard. */
export async function getIncomeOrders(from: Date, to: Date): Promise<IncomeOrderView[]> {
  return safe(
    async () =>
      (
        await prisma.order.findMany({
          where: { status: { in: [...PAID_STATUSES] }, createdAt: { gte: from, lt: to } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            publicToken: true,
            customerName: true,
            totalCents: true,
            subtotalCents: true,
            shippingCents: true,
            status: true,
            createdAt: true,
          },
        })
      ).map((o) => ({
        id: o.id,
        publicToken: o.publicToken,
        customerName: o.customerName,
        totalCents: o.totalCents,
        subtotalCents: o.subtotalCents,
        shippingCents: o.shippingCents,
        status: o.status as OrderStatus,
        createdAt: o.createdAt.toISOString(),
      })),
    [],
  );
}

/** Manual sales (Instagram, in person...) in a date range, newest first. */
export async function getManualSales(from: Date, to: Date): Promise<ManualSaleView[]> {
  return safe(
    async () =>
      (
        await prisma.manualSale.findMany({
          where: { date: { gte: from, lt: to } },
          orderBy: { date: "desc" },
        })
      ).map((s) => ({
        id: s.id,
        description: s.description,
        amountCents: s.amountCents,
        note: s.note,
        date: s.date.toISOString(),
      })),
    [],
  );
}

export async function getTasks(): Promise<TaskView[]> {
  return safe(
    async () =>
      (
        await prisma.task.findMany({
          orderBy: [{ done: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        })
      ).map((t) => ({
        id: t.id,
        title: t.title,
        done: t.done,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
      })),
    [],
  );
}
