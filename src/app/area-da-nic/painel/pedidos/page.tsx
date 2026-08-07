import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrders } from "@/lib/admin-data";
import PedidoRow from "@/components/admin/PedidoRow";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const orders = await getOrders();
  const pagos = orders.filter((o) => o.status === "PAID").length;
  const aguardando = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="font-serif font-normal text-[clamp(28px,4vw,40px)] text-ink leading-none">
            Pedidos
          </h1>
          <p className="text-[13px] text-muted-soft mt-2">
            {orders.length} pedido(s) · {pagos} pago(s) · {aguardando} aguardando pagamento
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-panel-card border border-line-card rounded-[16px] px-6 py-14 text-center">
          <div className="font-serif italic text-[22px] text-muted">Nenhum pedido ainda</div>
          <p className="text-[14px] text-muted-soft mt-2">
            As compras finalizadas no site aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <PedidoRow key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
