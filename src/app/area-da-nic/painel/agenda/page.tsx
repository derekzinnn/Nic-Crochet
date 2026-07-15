import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getTasks, getCustomOrders } from "@/lib/admin-data";
import { CUSTOM_ORDER_STATUS_LABEL } from "@/lib/types";
import TaskList from "@/components/admin/TaskList";

export const metadata: Metadata = { title: "Agenda", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const [tasks, orders] = await Promise.all([getTasks(), getCustomOrders()]);
  // "O que está rolando": open encomendas (not closed) that have a deadline noted.
  const openOrders = orders.filter((o) => o.status !== "CLOSED");

  return (
    <div className="grid grid-cols-1 min-[820px]:grid-cols-[1.4fr_1fr] gap-8">
      <section>
        <h1 className="font-serif font-normal text-[clamp(28px,4vw,40px)] text-ink leading-none mb-1">
          Agenda
        </h1>
        <p className="text-[13px] text-muted-soft mb-6">Suas tarefas e o que está rolando.</p>
        <TaskList tasks={tasks} />
      </section>

      <aside>
        <h2 className="font-serif text-[22px] text-ink mb-1">Encomendas em aberto</h2>
        <p className="text-[13px] text-muted-soft mb-4">Prazos combinados com as clientes.</p>
        {openOrders.length === 0 ? (
          <p className="text-[14px] text-muted-soft">Nenhuma encomenda em aberto.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {openOrders.map((o) => (
              <Link
                key={o.id}
                href="/area-da-nic/painel/encomendas"
                className="block bg-panel-card border border-line-card rounded-[12px] px-4 py-3 hover:border-sage transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink text-[15px]">{o.name}</span>
                  <span className="text-[11px] tracking-[0.08em] uppercase text-sage">
                    {CUSTOM_ORDER_STATUS_LABEL[o.status]}
                  </span>
                </div>
                <div className="text-[13px] text-muted-soft mt-[2px]">
                  {o.pieceType} · {o.size} · prazo: {o.deadline || "a combinar"}
                </div>
              </Link>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
