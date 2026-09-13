"use client";

import { useState } from "react";
import type { ProductView } from "@/lib/types";
import { leadTimeLabel } from "@/lib/format";
import { YARN_COLORS, resolveYarnColors } from "@/lib/yarn-colors";
import { useCart } from "@/components/cart/cart-store";
import ColorPickerModal from "@/components/product/ColorPickerModal";

/**
 * Customer-facing color choice + add-to-bag. Made-to-order pieces that can be
 * color-customized (the admin gave them at least one color) let the customer
 * request ANY color from the full catalogue — chosen in a modal opened by a
 * button, never dumped inline. In-stock pieces just list their colors read-only.
 */
export default function AddToBag({
  product,
  onAdded,
}: {
  product: ProductView;
  onAdded?: () => void;
}) {
  const add = useCart((s) => s.add);
  const sold = product.status === "SOLD";
  const madeToOrder = product.status === "MADE_TO_ORDER";
  // Made-to-order pieces are crocheted on demand, so the customer may request
  // ANY color from the full catalogue (chosen in the modal). In-stock pieces
  // just list the colors they were made in, read-only.
  const needsColor = madeToOrder;
  const needsSize = madeToOrder && product.sizes.length > 0;
  const multi = product.allowsMultipleColors;

  const [selected, setSelected] = useState<string[]>([]);
  const [size, setSize] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const chosen = resolveYarnColors(selected);
  const readOnlyPalette = resolveYarnColors(product.colors);

  const canAdd = !sold && (!needsColor || selected.length > 0) && (!needsSize || size !== null);
  const prazo = leadTimeLabel(product.leadTimeMinDays, product.leadTimeMaxDays);

  const missing: string[] = [];
  if (needsColor && selected.length === 0) missing.push(multi ? "as cores" : "a cor");
  if (needsSize && size === null) missing.push("o tamanho");

  const handleAdd = () => {
    if (!canAdd) return;
    add(product, needsColor ? selected : [], needsSize ? size : null);
    onAdded?.();
  };

  return (
    <div>
      {/* made-to-order: pick any color from the full palette, via a modal */}
      {needsColor && (
        <div className="mt-6">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[10px]">
            {multi ? "Escolha as cores (uma ou mais)" : "Escolha a cor"}
          </div>

          {chosen.length > 0 && (
            <div className="flex flex-wrap gap-[8px] mb-[10px]">
              {chosen.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-[30px] pl-[7px] pr-3 py-[6px] border border-sage bg-sage/15"
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[13px] text-ink">{c.name}</span>
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-[10px] rounded-pill border border-line-input px-5 min-h-[46px] py-2 text-[14px] text-ink hover:border-sage transition-colors"
          >
            <span
              aria-hidden
              className="inline-block w-5 h-5 rounded-full border border-black/10"
              style={{
                background:
                  "conic-gradient(#C0714E,#C9A85B,#8B9A60,#4E6E76,#7C3B44,#C9989A,#C0714E)",
              }}
            />
            {chosen.length > 0
              ? multi
                ? "Alterar cores"
                : "Trocar a cor"
              : multi
                ? "Escolher as cores"
                : "Escolher a cor"}
          </button>
        </div>
      )}

      {/* in-stock: show the colors it's made in, read-only */}
      {!needsColor && readOnlyPalette.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[10px]">
            Disponível nas cores
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {readOnlyPalette.map((c) => (
              <span
                key={c.id}
                className="flex items-center gap-2 rounded-[30px] pl-[7px] pr-4 min-h-[44px] py-2 border border-line-input text-muted-nav"
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/10"
                  style={{ background: c.hex }}
                />
                <span className="text-[14px]">{c.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[10px]">
            {needsSize ? "Escolha o tamanho" : "Disponível nos tamanhos"}
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {product.sizes.map((s) =>
              needsSize ? (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize((cur) => (cur === s ? null : s))}
                  aria-pressed={size === s}
                  className={`grid place-items-center w-[46px] h-[46px] rounded-[12px] border text-[15px] font-semibold transition-colors ${
                    size === s
                      ? "border-sage bg-sage/15 text-ink"
                      : "border-line-input text-muted-nav hover:border-sage"
                  }`}
                >
                  {s}
                </button>
              ) : (
                <span
                  key={s}
                  className="grid place-items-center w-[46px] h-[46px] rounded-[12px] border border-line-input text-[15px] font-semibold text-muted-nav"
                >
                  {s}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {prazo && (
        <div className="mt-6 flex items-center gap-[10px] text-[14px] text-muted-nav">
          <span className="text-[11px] tracking-[0.16em] uppercase text-muted-soft">
            Prazo de entrega
          </span>
          <span className="font-medium text-ink">{prazo}</span>
        </div>
      )}

      <button
        type="button"
        disabled={!canAdd}
        onClick={handleAdd}
        className="mt-[26px] w-full bg-ink text-cream rounded-pill py-4 text-[13px] tracking-[0.14em] uppercase hover:bg-sage hover:-translate-y-[2px] transition-[background-color,transform] duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:translate-y-0"
      >
        {sold ? "Peça esgotada" : "Adicionar à sacola"}
      </button>
      {!sold && missing.length > 0 && (
        <p className="mt-[10px] text-center text-[12px] text-muted-soft">
          Escolha {missing.join(" e ")} para continuar.
        </p>
      )}

      {pickerOpen && (
        <ColorPickerModal
          colors={YARN_COLORS}
          multi={multi}
          value={selected}
          onConfirm={(ids) => {
            setSelected(ids);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
