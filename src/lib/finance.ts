/** Client-safe finance helpers shared by the dashboard UI and the server. */

/** Expense buckets Nic picks from (free "Outros" catches the rest). */
export const EXPENSE_CATEGORIES = [
  "Fios",
  "Aviamentos",
  "Frete/Envio",
  "Embalagem",
  "Ferramentas",
  "Divulgação",
  "Outros",
] as const;

/** Order statuses that count as money received. */
export const PAID_STATUSES = ["PAID", "READY", "SHIPPED", "DELIVERED"] as const;

/** "2026-08" → the [start, end) of that month in local time. */
export function monthRange(ym: string): { from: Date; to: Date } {
  const [y, m] = ym.split("-").map(Number);
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 1, 0, 0, 0, 0);
  return { from, to };
}

/** Current month as "YYYY-MM". */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Shift a "YYYY-MM" by n months. */
export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Human month label, e.g. "Agosto de 2026". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
