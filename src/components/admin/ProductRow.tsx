"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ProductView, ProductStatus } from "@/lib/types";
import { brl } from "@/lib/format";
import { STATUS_OPTIONS } from "@/lib/product-form";
import { deleteProduct, setProductStatus } from "@/app/area-da-nic/painel/actions";
import ConfirmDelete from "@/components/admin/ConfirmDelete";

/** Status pill colors from the design (bg / text / dot). */
const STATUS_META: Record<ProductStatus, { bg: string; fg: string; dot: string }> = {
  AVAILABLE: { bg: "#EAF0DC", fg: "#5F7141", dot: "#8B9A60" },
  MADE_TO_ORDER: { bg: "#F3EAD7", fg: "#8A6B3B", dot: "#C49A6C" },
  SOLD: { bg: "#F0E4E0", fg: "#9A5B4A", dot: "#C06A4A" },
};

export default function ProductRow({ product }: { product: ProductView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onStatus = (status: ProductStatus) =>
    startTransition(async () => {
      await setProductStatus(product.id, status);
      router.refresh();
      toast.success("Status atualizado.");
    });

  const onDelete = () =>
    startTransition(async () => {
      await deleteProduct(product.id);
      router.refresh();
      toast.success(`"${product.name}" foi excluída.`);
    });

  const meta = STATUS_META[product.status];

  return (
    <div
      className={`flex items-center gap-4 max-[880px]:flex-wrap bg-white border border-line-card rounded-[16px] px-[18px] py-[14px] transition-[box-shadow,opacity] hover:shadow-[0_14px_34px_-24px_rgba(80,82,50,.4)] ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div
        className="flex-none w-[52px] h-[52px] rounded-[12px] overflow-hidden"
        style={{
          background: product.photos[0]
            ? `center / cover no-repeat url(${product.photos[0]})`
            : `repeating-linear-gradient(42deg, ${product.colorPrimary} 0 8px, ${product.colorSecondary} 8px 16px)`,
        }}
      />
      <div className="flex-1 min-w-[170px]">
        <div className="font-serif text-[20px] text-ink truncate">{product.name}</div>
        <div className="text-[11px] tracking-[0.14em] uppercase text-muted-faint mt-[3px]">
          {product.category}
          {product.tag ? ` · ${product.tag}` : ""}
          {product.featured ? " · ★" : ""}
        </div>
      </div>

      <span className="text-[15px] font-bold text-sage-deep whitespace-nowrap max-[620px]:hidden">
        {brl(product.priceCents)}
      </span>

      <label
        className="flex-none inline-flex items-center gap-2 rounded-[30px] px-[14px] py-2 text-[12px] font-semibold cursor-pointer"
        style={{ background: meta.bg, color: meta.fg }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ background: meta.dot }} />
        <select
          value={product.status}
          onChange={(e) => onStatus(e.target.value as ProductStatus)}
          disabled={pending}
          aria-label={`Status de ${product.name}`}
          className="appearance-none bg-transparent border-none font-sans text-[12px] font-semibold text-inherit cursor-pointer outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-[9px]">▾</span>
      </label>

      <Link
        href={`/area-da-nic/painel/${product.id}/editar`}
        className="flex-none text-[11px] tracking-[0.1em] uppercase text-ink border border-line-input rounded-pill px-[18px] py-[9px] hover:border-sage hover:text-sage transition-colors"
      >
        Editar
      </Link>
      <ConfirmDelete
        title={`Excluir “${product.name}”?`}
        description="Essa ação não pode ser desfeita — a peça sai da loja para sempre."
        onConfirm={onDelete}
      >
        <button
          disabled={pending}
          aria-label={`Excluir ${product.name}`}
          className="flex-none text-[11px] tracking-[0.1em] uppercase text-[#B0AB94] px-[6px] py-[9px] hover:text-[#C06A4A] transition-colors disabled:opacity-50"
        >
          Excluir
        </button>
      </ConfirmDelete>
    </div>
  );
}
