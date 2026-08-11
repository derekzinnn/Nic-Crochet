"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { orderStatusLabel, type OrderStatus, type OrderView } from "@/lib/types";
import { brl, maskCpf } from "@/lib/format";
import { formatCep } from "@/lib/shipping";
import { resolveYarnColors } from "@/lib/yarn-colors";
import {
  setOrderStatus,
  setOrderTracking,
  syncOrderPayment,
  deleteOrder,
} from "@/app/area-da-nic/painel/pedidos/actions";
import ConfirmDelete from "@/components/admin/ConfirmDelete";

const STATUS_PILL: Record<OrderStatus, string> = {
  PENDING: "bg-[#C9A85B]/15 text-[#9C7A2E]",
  PAID: "bg-sage/15 text-sage-deep",
  READY: "bg-[#6FA8B8]/15 text-[#3E7A8A]",
  SHIPPED: "bg-[#8B7BB8]/15 text-[#5F4F94]",
  DELIVERED: "bg-line-divider text-muted-soft",
  CANCELLED: "bg-[#C06A4A]/12 text-[#C06A4A]",
};

export default function PedidoRow({ order }: { order: OrderView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState(order.trackingCode ?? "");
  const created = new Date(order.createdAt).toLocaleDateString("pt-BR");

  const isPickup = order.deliveryMethod === "pickup";
  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";

  /** The next fulfilment step Nic can take, if any. Shipping gets an extra hop. */
  const nextStep: { status: OrderStatus; label: string } | null = (() => {
    if (!paid) return null;
    if (order.status === "PAID")
      return { status: "READY", label: isPickup ? "Disponível p/ retirada" : "Pronta p/ envio" };
    if (order.status === "READY")
      return isPickup
        ? { status: "DELIVERED", label: "Marcar retirada" }
        : { status: "SHIPPED", label: "Marcar enviada" };
    if (order.status === "SHIPPED") return { status: "DELIVERED", label: "Marcar entregue" };
    return null; // DELIVERED
  })();

  const onStatus = (status: OrderStatus) =>
    startTransition(async () => {
      try {
        await setOrderStatus(order.id, status);
        router.refresh();
        toast.success("Pedido atualizado.");
      } catch (e) {
        toast.error((e as Error).message || "Não foi possível atualizar.");
      }
    });

  const onSyncPayment = () =>
    startTransition(async () => {
      const res = await syncOrderPayment(order.id);
      router.refresh();
      if (res.status === "PAID") toast.success(res.message);
      else if (res.ok) toast.info(res.message);
      else toast.error(res.message);
    });

  const onDelete = () =>
    startTransition(async () => {
      await deleteOrder(order.id);
      router.refresh();
      toast.success("Pedido excluído.");
    });

  const onSaveTracking = () =>
    startTransition(async () => {
      await setOrderTracking(order.id, tracking);
      router.refresh();
      toast.success("Rastreio salvo — a cliente já vê no link dela.");
    });

  const cell = "text-[13px]";

  return (
    <div
      className={`bg-panel-card border border-line-card rounded-[18px] overflow-hidden transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-[18px] pb-3">
        <div className="min-w-0">
          <div className="text-[11px] tracking-[0.14em] text-muted-faint">
            #{order.id.slice(-6).toUpperCase()} · {created}
          </div>
          <div className="font-serif text-[21px] text-ink leading-tight mt-[2px] truncate">
            {order.customerName}
          </div>
          <div className="text-[12px] text-muted-soft truncate">
            {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
          </div>
          {order.customerCpf ? (
            <div className="text-[11px] text-muted-faint">CPF {maskCpf(order.customerCpf)}</div>
          ) : null}
        </div>
        <span
          className={`flex-none text-[10px] tracking-[0.1em] uppercase font-semibold px-[11px] py-[6px] rounded-[20px] ${STATUS_PILL[order.status]}`}
        >
          {orderStatusLabel(order.status, order.deliveryMethod)}
        </span>
      </div>

      {/* items */}
      <div className="px-5 py-3 border-t border-line-divider flex flex-col gap-[5px]">
        {order.items.map((it, i) => {
          const extras = [
            resolveYarnColors(it.selectedColors).map((c) => c.name).join(", "),
            it.selectedSize ? `tam. ${it.selectedSize}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div key={i} className={`flex items-baseline justify-between gap-3 ${cell}`}>
              <span className="text-ink truncate">
                <span className="font-medium">
                  {it.qty}× {it.name}
                </span>
                {extras && <span className="text-muted-soft"> — {extras}</span>}
              </span>
              <span className="text-muted-nav whitespace-nowrap">
                {brl(it.unitPriceCents * it.qty)}
              </span>
            </div>
          );
        })}
      </div>

      {/* delivery */}
      <div className={`px-5 py-3 border-t border-line-divider ${cell}`}>
        {isPickup ? (
          <div className="flex items-center gap-2 text-ink">
            <span>🏠</span>
            <span className="font-medium">Retirada no ateliê</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-ink">
              <span>📦</span>
              <span className="font-medium">{order.shippingLabel ?? "Envio"}</span>
              {order.shippingCents ? (
                <span className="text-muted-soft">· {brl(order.shippingCents)}</span>
              ) : null}
            </div>
            <div className="text-muted-nav mt-1 ml-[26px]">
              {order.street}
              {order.district ? `, ${order.district}` : ""} · {order.city}/{order.uf} · CEP{" "}
              {formatCep(order.cep ?? "")}
            </div>
            {paid && (
              <div className="flex items-center gap-2 mt-2 ml-[26px]">
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Código de rastreio"
                  aria-label="Código de rastreio"
                  className="flex-1 min-w-0 bg-white border border-line-input rounded-[10px] px-3 py-[7px] text-[13px] text-ink outline-none focus:border-sage"
                />
                <button
                  type="button"
                  onClick={onSaveTracking}
                  disabled={pending || tracking.trim() === (order.trackingCode ?? "")}
                  className="flex-none text-[11px] tracking-[0.06em] uppercase text-ink border border-line-input rounded-[20px] px-[14px] py-[7px] hover:border-sage hover:text-sage transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer: total + actions */}
      <div className="flex items-center gap-3 px-5 py-[14px] border-t border-line-divider bg-sand/40 flex-wrap">
        <div className="mr-auto">
          <span className="text-[11px] tracking-[0.1em] uppercase text-muted-soft">Total </span>
          <span className="font-serif text-[22px] text-ink">{brl(order.totalCents)}</span>
        </div>

        {order.status === "PENDING" && (
          <button
            type="button"
            onClick={onSyncPayment}
            disabled={pending}
            className="text-[12px] tracking-[0.06em] uppercase bg-ink text-cream rounded-pill px-[16px] py-[9px] hover:bg-sage transition-colors disabled:opacity-50"
          >
            {pending ? "Verificando…" : "Verificar pagamento"}
          </button>
        )}
        {nextStep && (
          <button
            type="button"
            onClick={() => onStatus(nextStep.status)}
            disabled={pending}
            className="text-[12px] tracking-[0.06em] uppercase bg-sage text-cream rounded-pill px-[16px] py-[9px] hover:bg-sage-deep transition-colors disabled:opacity-50"
          >
            {nextStep.label} →
          </button>
        )}
        {order.status === "DELIVERED" && (
          <span className="text-[12px] text-sage-deep font-medium">Concluído ✓</span>
        )}

        <a
          href={`/pedido/${order.publicToken}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Ver a página de acompanhamento da cliente"
          className="grid place-items-center w-9 h-9 rounded-full border border-line-input text-muted-nav hover:border-sage hover:text-sage transition-colors"
        >
          ↗
        </a>
        <ConfirmDelete
          title={`Excluir o pedido de ${order.customerName}?`}
          description="O pedido sai do painel para sempre. Essa ação não pode ser desfeita."
          onConfirm={onDelete}
        >
          <button
            disabled={pending}
            aria-label="Excluir pedido"
            className="grid place-items-center w-9 h-9 rounded-full border border-line-input text-[#B7AE96] hover:border-[#C06A4A] hover:text-[#C06A4A] transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </ConfirmDelete>
      </div>
    </div>
  );
}
