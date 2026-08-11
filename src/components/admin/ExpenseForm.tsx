"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EXPENSE_CATEGORIES, currentMonth } from "@/lib/finance";
import { createExpense } from "@/app/area-da-nic/painel/financeiro/actions";

const input =
  "w-full bg-white border border-line-input rounded-[10px] px-3 py-[9px] text-[14px] text-ink outline-none focus:border-sage";

/** Sensible default date: today if viewing the current month, else that month's 1st. */
function defaultDate(month: string): string {
  if (month === currentMonth()) return new Date().toISOString().slice(0, 10);
  return `${month}-01`;
}

export default function ExpenseForm({ month }: { month: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(defaultDate(month));

  const submit = () =>
    startTransition(async () => {
      const res = await createExpense({
        description,
        amountReais: amount,
        category,
        date,
      });
      if (res.ok) {
        toast.success("Gasto anotado.");
        setDescription("");
        setAmount("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });

  return (
    <div className="bg-panel-card border border-line-card rounded-[16px] p-4">
      <div className="flex flex-col gap-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && description && amount && submit()}
          placeholder="No que gastou? (ex: 3 novelos caramelo)"
          className={input}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Valor (R$)"
            className={input}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${input} cursor-pointer`}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !description.trim() || !amount.trim()}
          className="btn-pill bg-ink text-cream py-[12px] hover:bg-sage disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {pending ? "Salvando…" : "+ Anotar gasto"}
        </button>
      </div>
    </div>
  );
}
