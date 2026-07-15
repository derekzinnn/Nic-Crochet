"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { CustomOrderStatus } from "@/lib/types";

function revalidate() {
  revalidatePath("/area-da-nic/painel/encomendas");
  revalidatePath("/area-da-nic/painel"); // tab badge count
  revalidatePath("/area-da-nic/painel/agenda"); // open-order deadlines
}

export async function setCustomOrderStatus(id: string, status: CustomOrderStatus): Promise<void> {
  await requireAdmin();
  await prisma.customOrderRequest.update({ where: { id }, data: { status } });
  revalidate();
}

export async function deleteCustomOrder(id: string): Promise<void> {
  await requireAdmin();
  await prisma.customOrderRequest.delete({ where: { id } });
  revalidate();
}
