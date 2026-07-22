"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CUSTOM_ORDER_STATUS_LABEL,
  type CustomOrderStatus,
  type CustomOrderView,
} from "@/lib/types";
import { resolveYarnColors } from "@/lib/yarn-colors";
import { whatsappLink } from "@/lib/config";
import { setCustomOrderStatus, deleteCustomOrder } from "@/app/area-da-nic/painel/encomendas/actions";
import ConfirmDelete from "@/components/admin/ConfirmDelete";

const STATUS_PILL: Record<CustomOrderStatus, string> = {
  NEW: "bg-sage/15 text-sage-deep border-sage/40",
  RESPONDED: "bg-[#C9A85B]/15 text-[#9C7A2E] border-[#C9A85B]/40",
  CLOSED: "bg-line-divider text-muted-soft border-line",
};

const STATUS_ORDER: CustomOrderStatus[] = ["NEW", "RESPONDED", "CLOSED"];

/** Build a wa.me reply to the customer if their contact looks like a phone. */
function replyLink(order: CustomOrderView): string | null {
  const digits = order.contact.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const number = digits.length <= 11 ? `55${digits}` : digits;
  const msg = `Oi, ${order.name}! 🌿 Aqui é a Nic. Recebi sua encomenda (${order.pieceType} · ${order.size}) e já vou te passar esboço, valor e prazo. 💛`;
  return whatsappLink(msg, number);
}

export default function EncomendaRow({ order }: { order: CustomOrderView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const colors = resolveYarnColors(order.colors);
  const wa = replyLink(order);
  const created = new Date(order.createdAt).toLocaleDateString("pt-BR");

  const onStatus = (status: CustomOrderStatus) =>
    startTransition(async () => {
      await setCustomOrderStatus(order.id, status);
      router.refresh();
      toast.success("Status da encomenda atualizado.");
    });

  const onDelete = () =>
    startTransition(async () => {
      await deleteCustomOrder(order.id);
      router.refresh();
      toast.success("Encomenda excluída.");
    });

  return (
    <div
      className={`bg-panel-card border border-line-card rounded-[16px] p-5 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-serif text-[22px] text-ink leading-tight">{order.name}</div>
          <div className="text-[13px] text-muted-soft mt-[2px]">
            {order.contact} · {created}
          </div>
        </div>
        <span
          className={`text-[10px] tracking-[0.1em] uppercase font-semibold px-[10px] py-[5px] rounded-[20px] border ${STATUS_PILL[order.status]}`}
        >
          {CUSTOM_ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-[14px]">
        <Field label="Peça" value={`${order.pieceType} · ${order.size}`} />
        <Field label="Prazo" value={order.deadline || "a combinar"} />
      </div>

      {colors.length > 0 && (
        <div className="mt-3">
          <span className="text-[11px] tracking-[0.14em] uppercase text-muted-soft">Cores</span>
          <div className="flex flex-wrap gap-2 mt-[6px]">
            {colors.map((c) => (
              <span key={c.id} className="flex items-center gap-[6px] text-[13px] text-muted-nav">
                <span
                  className="w-[16px] h-[16px] rounded-full border border-black/10"
                  style={{ background: c.hex }}
                />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {order.details.trim() && (
        <p className="mt-3 text-[14px] leading-[1.6] text-muted-nav whitespace-pre-line">
          {order.details}
        </p>
      )}

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <select
          value={order.status}
          onChange={(e) => onStatus(e.target.value as CustomOrderStatus)}
          disabled={pending}
          aria-label="Status da encomenda"
          className="bg-white border border-line-input rounded-[20px] text-muted-nav text-[12px] px-3 py-[7px] outline-none focus:border-sage cursor-pointer"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {CUSTOM_ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </select>

        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] tracking-[0.06em] uppercase bg-sage text-cream rounded-[20px] px-[14px] py-[8px] hover:bg-sage-deep transition-colors"
          >
            Responder no WhatsApp
          </a>
        )}

        <ConfirmDelete
          title={`Excluir a encomenda de ${order.name}?`}
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-soft">{label}:</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  );
}
