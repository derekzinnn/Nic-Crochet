import "server-only";
import { prisma } from "@/lib/prisma";
import type { CustomOrderStatus, CustomOrderView, TaskView } from "@/lib/types";

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
