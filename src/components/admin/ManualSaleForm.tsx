"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { currentMonth } from "@/lib/finance";
import { createManualSale } from "@/app/area-da-nic/painel/financeiro/actions";

const input =
  "w-full bg-white border border-line-input rounded-[10px] px-3 py-[9px] text-[14px] text-ink outline-none focus:border-sage";

function defaultDate(month: string): string {
  if (month === currentMonth()) return new Date().toISOString().slice(0, 10);
  return `${month}-01`;
}

/** Add a sale made off-site (Instagram, in person). Hidden behind a button. */
export default function ManualSaleForm({ month }: { month: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate(month));

  const submit = () =>
    startTransition(async () => {
      const res = await createManualSale({ description, amountReais: amount, date });
      if (res.ok) {
        toast.success("Venda registrada.");
        setDescription("");
        setAmount("");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível salvar.");
      }
    });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-pill w-full bg-transparent text-sage-deep border border-sage/50 py-[11px] hover:bg-sage/10 !text-[13px]"
      >
        + Adicionar venda (Instagram, pessoal…)
      </button>
    );
  }

  return (
    <div className="bg-panel-card border border-line-card rounded-[16px] p-4">
      <div className="flex flex-col gap-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que vendeu? (ex: Bolsa Amalfi — Instagram)"
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-pill flex-none bg-transparent text-muted-nav border border-line-input px-5 py-[11px] hover:border-sage hover:text-sage"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !description.trim() || !amount.trim()}
            className="btn-pill flex-1 bg-sage text-cream py-[11px] hover:bg-sage-deep disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {pending ? "Salvando…" : "Registrar venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
