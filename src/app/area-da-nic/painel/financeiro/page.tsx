import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getExpenses, getIncomeOrders, getManualSales } from "@/lib/admin-data";
import { brl } from "@/lib/format";
import { currentMonth, monthLabel, monthRange, shiftMonth } from "@/lib/finance";
import ExpenseForm from "@/components/admin/ExpenseForm";
import ExpenseList from "@/components/admin/ExpenseList";
import ManualSaleForm from "@/components/admin/ManualSaleForm";
import SalesList from "@/components/admin/SalesList";

export const metadata: Metadata = { title: "Finanças", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "sage" | "clay" | "ink";
  hint?: string;
}) {
  const color =
    tone === "sage" ? "text-sage-deep" : tone === "clay" ? "text-[#C06A4A]" : "text-ink";
  return (
    <div className="bg-panel-card border border-line-card rounded-[16px] px-5 py-4">
      <div className="text-[11px] tracking-[0.14em] uppercase text-muted-soft">{label}</div>
      <div className={`font-serif text-[28px] mt-1 ${color}`}>{value}</div>
      {hint && <div className="text-[12px] text-muted-faint mt-[2px]">{hint}</div>}
    </div>
  );
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const sp = await searchParams;
  const ym = /^\d{4}-\d{2}$/.test(sp.mes ?? "") ? sp.mes! : currentMonth();
  const { from, to } = monthRange(ym);

  const [expenses, income, manual] = await Promise.all([
    getExpenses(from, to),
    getIncomeOrders(from, to),
    getManualSales(from, to),
  ]);

  const siteCents = income.reduce((n, o) => n + o.totalCents, 0);
  const manualCents = manual.reduce((n, s) => n + s.amountCents, 0);
  const recebidoCents = siteCents + manualCents;
  const gastosCents = expenses.reduce((n, e) => n + e.amountCents, 0);
  const saldoCents = recebidoCents - gastosCents;
  const vendasCount = income.length + manual.length;

  const prev = shiftMonth(ym, -1);
  const next = shiftMonth(ym, 1);
  const isCurrent = ym === currentMonth();

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-serif font-normal text-[clamp(28px,4vw,40px)] text-ink leading-none">
            Finanças
          </h1>
          <p className="text-[13px] text-muted-soft mt-2">
            Gastos que você anota + vendas puxadas automaticamente do site.
          </p>
        </div>
        {/* month navigator */}
        <div className="flex items-center gap-2">
          <Link
            href={`?mes=${prev}`}
            className="grid place-items-center w-9 h-9 rounded-full border border-line-input text-muted-nav hover:border-sage hover:text-sage transition-colors"
            aria-label="Mês anterior"
          >
            ‹
          </Link>
          <span className="min-w-[150px] text-center text-[14px] text-ink font-semibold capitalize">
            {monthLabel(ym)}
          </span>
          <Link
            href={`?mes=${next}`}
            aria-disabled={isCurrent}
            className={`grid place-items-center w-9 h-9 rounded-full border border-line-input transition-colors ${
              isCurrent
                ? "text-muted-faint pointer-events-none opacity-40"
                : "text-muted-nav hover:border-sage hover:text-sage"
            }`}
            aria-label="Próximo mês"
          >
            ›
          </Link>
        </div>
      </div>

      {/* summary */}
      <div className="grid grid-cols-1 min-[560px]:grid-cols-3 gap-[14px] mb-8">
        <StatCard
          label="Recebido"
          value={brl(recebidoCents)}
          tone="sage"
          hint={`${vendasCount} venda(s) · ${brl(siteCents)} site + ${brl(manualCents)} manual`}
        />
        <StatCard
          label="Gastos"
          value={brl(gastosCents)}
          tone="clay"
          hint={`${expenses.length} lançamento(s)`}
        />
        <StatCard
          label="Saldo"
          value={brl(saldoCents)}
          tone={saldoCents >= 0 ? "sage" : "clay"}
          hint={saldoCents >= 0 ? "no azul 💚" : "no vermelho"}
        />
      </div>

      <div className="grid grid-cols-1 min-[881px]:grid-cols-2 gap-6 items-start">
        {/* expenses */}
        <section>
          <h2 className="font-serif text-[22px] text-ink mb-3">Gastos do mês</h2>
          <ExpenseForm month={ym} />
          <div className="mt-4">
            <ExpenseList expenses={expenses} />
          </div>
        </section>

        {/* income */}
        <section>
          <h2 className="font-serif text-[22px] text-ink mb-3">Vendas do mês</h2>
          <p className="text-[12px] text-muted-soft mb-3">
            As do site entram sozinhas; use o botão para as de fora (Instagram, pessoal).
          </p>
          <div className="mb-4">
            <ManualSaleForm month={ym} />
          </div>
          <SalesList orders={income} manual={manual} />
        </section>
      </div>
    </div>
  );
}
