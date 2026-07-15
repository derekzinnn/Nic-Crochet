import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCustomOrders } from "@/lib/admin-data";
import EncomendaRow from "@/components/admin/EncomendaRow";

export const metadata: Metadata = { title: "Encomendas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EncomendasPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const orders = await getCustomOrders();
  const novas = orders.filter((o) => o.status === "NEW").length;

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-serif font-normal text-[clamp(28px,4vw,40px)] text-ink leading-none">
            Encomendas
          </h1>
          <p className="text-[13px] text-muted-soft mt-2">
            {orders.length} pedido(s) sob medida · {novas} nova(s)
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-panel-card border border-line-card rounded-[16px] px-6 py-14 text-center">
          <div className="font-serif italic text-[22px] text-muted">
            Nenhuma encomenda por enquanto
          </div>
          <p className="text-[14px] text-muted-soft mt-2">
            Os pedidos feitos em “Sob medida” aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <EncomendaRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
