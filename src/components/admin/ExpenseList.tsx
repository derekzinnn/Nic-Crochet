"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import type { ExpenseView } from "@/lib/types";
import { deleteExpense } from "@/app/area-da-nic/painel/financeiro/actions";

export default function ExpenseList({ expenses }: { expenses: ExpenseView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = (id: string) =>
    startTransition(async () => {
      await deleteExpense(id);
      router.refresh();
      toast.success("Gasto removido.");
    });

  if (expenses.length === 0) {
    return (
      <div className="bg-panel-card border border-line-card rounded-[16px] px-5 py-10 text-center">
        <div className="font-serif italic text-[20px] text-muted">Nenhum gasto neste mês</div>
        <p className="text-[13px] text-muted-soft mt-1">Anote acima o que você comprou.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[8px] ${pending ? "opacity-60" : ""}`}>
      {expenses.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between gap-3 bg-panel-card border border-line-card rounded-[14px] px-4 py-[10px] group"
        >
          <div className="min-w-0">
            <div className="text-[14px] text-ink truncate">{e.description}</div>
            <div className="text-[12px] text-muted-soft">
              {new Date(e.date).toLocaleDateString("pt-BR")} · {e.category}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-none">
            <span className="text-[15px] font-semibold text-[#C06A4A] whitespace-nowrap">
              − {brl(e.amountCents)}
            </span>
            <button
              type="button"
              onClick={() => onDelete(e.id)}
              disabled={pending}
              aria-label="Remover gasto"
              className="text-[#B7AE96] text-[16px] leading-none opacity-0 group-hover:opacity-100 hover:text-[#C06A4A] transition-all"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
