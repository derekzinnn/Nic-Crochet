import "server-only";
import { prisma } from "@/lib/prisma";
import type {
  CustomOrderStatus,
  CustomOrderView,
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
