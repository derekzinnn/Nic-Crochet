"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await requireAdmin();
  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/area-da-nic/painel/pedidos");
}

export async function deleteOrder(id: string): Promise<void> {
  await requireAdmin();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/area-da-nic/painel/pedidos");
}
