"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProductView, ProductStatus } from "@/lib/types";
import { brl } from "@/lib/format";
import { STATUS_OPTIONS } from "@/lib/product-form";
import { deleteProduct, setProductStatus } from "@/app/area-da-nic/painel/actions";

export default function ProductRow({ product }: { product: ProductView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onStatus = (status: ProductStatus) =>
    startTransition(async () => {
      await setProductStatus(product.id, status);
      router.refresh();
    });

  const onDelete = () => {
    if (!confirm(`Excluir "${product.name}"? Essa ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      await deleteProduct(product.id);
      router.refresh();
    });
  };

  return (
    <div
      className={`flex items-center gap-4 bg-panel-card border border-panel-line rounded-[14px] p-3 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
    >
      <div
        className="flex-none w-[54px] h-[64px] rounded-[10px] overflow-hidden"
        style={{
          background: product.photos[0]
            ? `center / cover no-repeat url(${product.photos[0]})`
            : `repeating-linear-gradient(42deg, ${product.colorPrimary} 0 8px, ${product.colorSecondary} 8px 16px)`,
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="font-serif text-[19px] text-cream truncate">{product.name}</div>
        <div className="text-[12px] tracking-[0.12em] uppercase text-muted-soft mt-[2px]">
          {product.category}
          {product.tag ? ` · ${product.tag}` : ""}
          {product.featured ? " · ★" : ""}
        </div>
      </div>

      <span className="text-[15px] font-semibold text-sage-light whitespace-nowrap max-[620px]:hidden">
        {brl(product.priceCents)}
      </span>

      <select
        value={product.status}
        onChange={(e) => onStatus(e.target.value as ProductStatus)}
        disabled={pending}
        aria-label={`Status de ${product.name}`}
        className="bg-panel border border-panel-line rounded-[20px] text-cloud text-[12px] px-3 py-[7px] outline-none focus:border-sage cursor-pointer"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value} className="bg-panel text-cream">
            {s.label}
          </option>
        ))}
      </select>

      <Link
        href={`/area-da-nic/painel/${product.id}/editar`}
        className="text-[12px] tracking-[0.08em] uppercase text-cloud border border-panel-line rounded-[20px] px-[14px] py-[7px] hover:border-sage-light transition-colors"
      >
        Editar
      </Link>
      <button
        onClick={onDelete}
        disabled={pending}
        aria-label={`Excluir ${product.name}`}
        className="text-[12px] tracking-[0.08em] uppercase text-[#E0A48C] border border-[#C06A4A]/40 rounded-[20px] px-[14px] py-[7px] hover:bg-[#C06A4A]/15 transition-colors disabled:opacity-50"
      >
        Excluir
      </button>
    </div>
  );
}
