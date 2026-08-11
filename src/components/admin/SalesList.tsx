"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import type { IncomeOrderView, ManualSaleView } from "@/lib/types";
import { deleteManualSale } from "@/app/area-da-nic/painel/financeiro/actions";

type Row =
  | { kind: "order"; date: string; order: IncomeOrderView }
  | { kind: "manual"; date: string; sale: ManualSaleView };

export default function SalesList({
  orders,
  manual,
}: {
  orders: IncomeOrderView[];
  manual: ManualSaleView[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const rows: Row[] = [
    ...orders.map((o) => ({ kind: "order" as const, date: o.createdAt, order: o })),
    ...manual.map((s) => ({ kind: "manual" as const, date: s.date, sale: s })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const onDelete = (id: string) =>
    startTransition(async () => {
      await deleteManualSale(id);
      router.refresh();
      toast.success("Venda removida.");
    });

  if (rows.length === 0) {
    return (
      <div className="bg-panel-card border border-line-card rounded-[16px] px-5 py-10 text-center">
        <div className="font-serif italic text-[20px] text-muted">Nenhuma venda neste mês</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[10px] ${pending ? "opacity-60" : ""}`}>
      {rows.map((r) =>
        r.kind === "order" ? (
          <a
            key={`o-${r.order.id}`}
            href={`/pedido/${r.order.publicToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 bg-panel-card border border-line-card rounded-[14px] px-4 py-3 hover:border-sage transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[14px] text-ink font-medium truncate">{r.order.customerName}</div>
              <div className="text-[12px] text-muted-soft">
                {new Date(r.order.createdAt).toLocaleDateString("pt-BR")} · site · #
                {r.order.id.slice(-6).toUpperCase()}
              </div>
            </div>
            <span className="text-[15px] font-semibold text-sage-deep whitespace-nowrap">
              {brl(r.order.totalCents)}
            </span>
          </a>
        ) : (
          <div
            key={`m-${r.sale.id}`}
            className="flex items-center justify-between gap-3 bg-panel-card border border-line-card rounded-[14px] px-4 py-3 group"
          >
            <div className="min-w-0">
              <div className="text-[14px] text-ink font-medium truncate">{r.sale.description}</div>
              <div className="text-[12px] text-muted-soft flex items-center gap-[6px]">
                {new Date(r.sale.date).toLocaleDateString("pt-BR")}
                <span className="text-[10px] tracking-[0.1em] uppercase text-[#9C7A2E] bg-[#C9A85B]/20 rounded-[20px] px-[6px] py-[1px]">
                  manual
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-none">
              <span className="text-[15px] font-semibold text-sage-deep whitespace-nowrap">
                {brl(r.sale.amountCents)}
              </span>
              <button
                type="button"
                onClick={() => onDelete(r.sale.id)}
                disabled={pending}
                aria-label="Remover venda"
                className="text-[#B7AE96] text-[16px] leading-none opacity-0 group-hover:opacity-100 hover:text-[#C06A4A] transition-all"
              >
                ✕
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
