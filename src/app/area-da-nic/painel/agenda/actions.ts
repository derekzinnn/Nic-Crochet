"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function createTask(title: string, dueDate: string | null): Promise<void> {
  await requireAdmin();
  const t = title.trim();
  if (!t) return;
  await prisma.task.create({
    data: { title: t, dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidatePath("/area-da-nic/painel/agenda");
}

export async function toggleTask(id: string, done: boolean): Promise<void> {
  await requireAdmin();
  await prisma.task.update({ where: { id }, data: { done } });
  revalidatePath("/area-da-nic/painel/agenda");
}

export async function deleteTask(id: string): Promise<void> {
  await requireAdmin();
  await prisma.task.delete({ where: { id } });
  revalidatePath("/area-da-nic/painel/agenda");
}
