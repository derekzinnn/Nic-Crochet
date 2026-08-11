"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { reaisToCents } from "@/lib/format";

export type ExpenseResult = { ok: boolean; error?: string };

export async function createExpense(input: {
  description: string;
  amountReais: string;
  category: string;
  date: string; // "YYYY-MM-DD"
}): Promise<ExpenseResult> {
  await requireAdmin();
  const description = input.description.trim();
  const amountCents = reaisToCents(input.amountReais);
  if (!description) return { ok: false, error: "Descreva o gasto." };
  if (amountCents <= 0) return { ok: false, error: "Informe um valor válido." };

  // Parse the date as local noon so the day never shifts across timezones.
  const parsed = input.date ? new Date(`${input.date}T12:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  await prisma.expense.create({
    data: { description, amountCents, category: input.category || "Outros", date },
  });
  revalidatePath("/area-da-nic/painel/financeiro");
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<void> {
  await requireAdmin();
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/area-da-nic/painel/financeiro");
}

export async function createManualSale(input: {
  description: string;
  amountReais: string;
  date: string; // "YYYY-MM-DD"
  note?: string;
}): Promise<ExpenseResult> {
  await requireAdmin();
  const description = input.description.trim();
  const amountCents = reaisToCents(input.amountReais);
  if (!description) return { ok: false, error: "Descreva a venda." };
  if (amountCents <= 0) return { ok: false, error: "Informe um valor válido." };

  const parsed = input.date ? new Date(`${input.date}T12:00:00`) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;

  await prisma.manualSale.create({
    data: { description, amountCents, date, note: input.note?.trim() || null },
  });
  revalidatePath("/area-da-nic/painel/financeiro");
  return { ok: true };
}

export async function deleteManualSale(id: string): Promise<void> {
  await requireAdmin();
  await prisma.manualSale.delete({ where: { id } });
  revalidatePath("/area-da-nic/painel/financeiro");
}
