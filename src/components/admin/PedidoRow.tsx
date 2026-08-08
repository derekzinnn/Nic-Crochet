"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ORDER_STATUS_LABEL, type OrderStatus, type OrderView } from "@/lib/types";
import { brl } from "@/lib/format";
import { formatCep } from "@/lib/shipping";
import { resolveYarnColors } from "@/lib/yarn-colors";
import {
  setOrderStatus,
  setOrderTracking,
  deleteOrder,
} from "@/app/area-da-nic/painel/pedidos/actions";
import ConfirmDelete from "@/components/admin/ConfirmDelete";

const STATUS_PILL: Record<OrderStatus, string> = {
  PENDING: "bg-[#C9A85B]/15 text-[#9C7A2E] border-[#C9A85B]/40",
  PAID: "bg-sage/15 text-sage-deep border-sage/40",
  FULFILLED: "bg-line-divider text-muted-soft border-line",
  CANCELLED: "bg-[#C06A4A]/12 text-[#C06A4A] border-[#C06A4A]/40",
};

const STATUS_ORDER: OrderStatus[] = ["PENDING", "PAID", "FULFILLED", "CANCELLED"];

export default function PedidoRow({ order }: { order: OrderView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tracking, setTracking] = useState(order.trackingCode ?? "");
  const created = new Date(order.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const onStatus = (status: OrderStatus) =>
    startTransition(async () => {
      await setOrderStatus(order.id, status);
      router.refresh();
      toast.success("Status do pedido atualizado.");
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
      toast.success("Código de rastreio salvo — a cliente já vê no link dela.");
    });

  return (
    <div
      className={`bg-panel-card border border-line-card rounded-[16px] p-5 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-serif text-[22px] text-ink leading-tight">{order.customerName}</div>
          <div className="text-[13px] text-muted-soft mt-[2px]">
            {order.customerEmail}
            {order.customerPhone ? ` · ${order.customerPhone}` : ""} · {created}
          </div>
        </div>
        <span
          className={`text-[10px] tracking-[0.1em] uppercase font-semibold px-[10px] py-[5px] rounded-[20px] border ${STATUS_PILL[order.status]}`}
        >
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className="mt-4 flex flex-col gap-[6px]">
        {order.items.map((it, i) => {
          const colors = resolveYarnColors(it.selectedColors);
          const extras = [
            colors.map((c) => c.name).join(", "),
            it.selectedSize ? `tam. ${it.selectedSize}` : "",
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <div key={i} className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-ink">
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

      {/* Delivery */}
      <div className="mt-4 rounded-[12px] bg-sand/60 border border-line-card px-[14px] py-3 text-[13px]">
        {order.deliveryMethod === "pickup" ? (
          <span className="text-ink font-medium">Retirada no ateliê</span>
        ) : (
          <div className="text-muted-nav">
            <span className="text-ink font-medium">
              {order.shippingLabel ?? "Envio"}
              {order.shippingCents ? ` — ${brl(order.shippingCents)}` : ""}
            </span>
            <div className="mt-[2px]">
              {order.street}
              {order.district ? `, ${order.district}` : ""}
            </div>
            <div>
              {order.city}/{order.uf} · CEP {formatCep(order.cep ?? "")}
            </div>
            <div className="flex items-center gap-2 mt-3">
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
                className="flex-none text-[11px] tracking-[0.08em] uppercase text-ink border border-line-input rounded-[20px] px-[14px] py-[7px] hover:border-sage hover:text-sage transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        )}
      </div>

      <a
        href={`/pedido/${order.publicToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 text-[12px] text-sage hover:text-sage-deep underline"
      >
        Ver a página de acompanhamento da cliente →
      </a>

      {/* Totals */}
      <div className="mt-3 flex items-baseline justify-end gap-4 text-[13px] text-muted-soft">
        <span>Subtotal {brl(order.subtotalCents)}</span>
        <span>Frete {order.shippingCents ? brl(order.shippingCents) : "grátis"}</span>
        <span className="text-ink font-semibold text-[16px]">Total {brl(order.totalCents)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <select
          value={order.status}
          onChange={(e) => onStatus(e.target.value as OrderStatus)}
          disabled={pending}
          aria-label="Status do pedido"
          className="bg-white border border-line-input rounded-[20px] text-muted-nav text-[12px] px-3 py-[7px] outline-none focus:border-sage cursor-pointer"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        <ConfirmDelete
          title={`Excluir o pedido de ${order.customerName}?`}
          description="O pedido sai do painel para sempre. Essa ação não pode ser desfeita."
          onConfirm={onDelete}
        >
          <button
            disabled={pending}
            className="ml-auto text-[12px] tracking-[0.06em] uppercase text-[#C06A4A] border border-[#C06A4A]/40 rounded-[20px] px-[14px] py-[7px] hover:bg-[#C06A4A]/10 transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        </ConfirmDelete>
      </div>
    </div>
  );
}
