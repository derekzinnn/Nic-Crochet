"use client";

import { useState } from "react";
import type { ProductView } from "@/lib/types";
import { leadTimeLabel } from "@/lib/format";
import { resolveYarnColors } from "@/lib/yarn-colors";
import { useCart } from "@/components/cart/cart-store";

/**
 * Customer-facing color choice + add-to-bag. Made-to-order bags with colors
 * REQUIRE a selection (one, or several if the bag allows it); other bags show
 * their colors as read-only info.
 */
export default function AddToBag({
  product,
  onAdded,
}: {
  product: ProductView;
  onAdded?: () => void;
}) {
  const add = useCart((s) => s.add);
  const palette = resolveYarnColors(product.colors);
  const sold = product.status === "SOLD";
  const madeToOrder = product.status === "MADE_TO_ORDER";
  const needsColor = madeToOrder && palette.length > 0;
  const needsSize = madeToOrder && product.sizes.length > 0;
  const multi = product.allowsMultipleColors;

  const [selected, setSelected] = useState<string[]>([]);
  const [size, setSize] = useState<string | null>(null);

  const toggle = (id: string) => {
    if (multi) {
      setSelected((s) => (s.includes(id) ? s.filter((c) => c !== id) : [...s, id]));
    } else {
      setSelected((s) => (s[0] === id ? [] : [id]));
    }
  };

  const canAdd =
    !sold && (!needsColor || selected.length > 0) && (!needsSize || size !== null);
  const prazo = leadTimeLabel(product.leadTimeMinDays, product.leadTimeMaxDays);

  const missing: string[] = [];
  if (needsColor && selected.length === 0) missing.push(multi ? "uma cor" : "a cor");
  if (needsSize && size === null) missing.push("o tamanho");

  const handleAdd = () => {
    if (!canAdd) return;
    add(product, needsColor ? selected : [], needsSize ? size : null);
    onAdded?.();
  };

  return (
    <div>
      {palette.length > 0 && (
        <div className="mt-6">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[10px]">
            {needsColor
              ? multi
                ? "Escolha as cores (uma ou mais)"
                : "Escolha a cor"
              : "Disponível nas cores"}
          </div>
          <div className="flex flex-wrap gap-[10px]">
            {palette.map((c) => {
              const active = selected.includes(c.id);
              const base =
                "flex items-center gap-2 rounded-[30px] pl-[7px] pr-4 min-h-[44px] py-2 border select-none transition-[background-color,border-color,transform]";
              return needsColor ? (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={active}
                  className={`${base} touch-manipulation active:scale-95 ${
                    active
                      ? "border-sage bg-sage/20 text-ink ring-1 ring-sage"
                      : "border-line-input text-muted-nav hover:border-sage"
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[14px]">{c.name}</span>
                  {active && <span className="text-sage-deep text-[13px] leading-none">✓</span>}
                </button>
              ) : (
                <span key={c.id} className={`${base} border-line-input text-muted-nav`}>
                  <span
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[14px]">{c.name}</span>
                </span>
              );
            })}
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
    </div>
  );
}
