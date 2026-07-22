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
  const needsColor = product.status === "MADE_TO_ORDER" && palette.length > 0;
  const multi = product.allowsMultipleColors;

  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    if (multi) {
      setSelected((s) => (s.includes(id) ? s.filter((c) => c !== id) : [...s, id]));
    } else {
      setSelected((s) => (s[0] === id ? [] : [id]));
    }
  };

  const canAdd = !sold && (!needsColor || selected.length > 0);
  const prazo = leadTimeLabel(product.leadTimeMinDays, product.leadTimeMaxDays);

  const handleAdd = () => {
    if (!canAdd) return;
    add(product, needsColor ? selected : []);
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
                "flex items-center gap-2 rounded-[30px] pl-[6px] pr-3 py-[5px] border transition-colors";
              return needsColor ? (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={active}
                  className={`${base} ${
                    active
                      ? "border-sage bg-sage/15 text-ink"
                      : "border-line-input text-muted-nav hover:border-sage"
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[13px]">{c.name}</span>
                </button>
              ) : (
                <span key={c.id} className={`${base} border-line-input text-muted-nav`}>
                  <span
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[13px]">{c.name}</span>
                </span>
              );
            })}
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
      {needsColor && selected.length === 0 && !sold && (
        <p className="mt-[10px] text-center text-[12px] text-muted-soft">
          Escolha {multi ? "ao menos uma cor" : "uma cor"} para continuar.
        </p>
      )}
    </div>
  );
}
