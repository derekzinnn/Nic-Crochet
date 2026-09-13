"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { YarnColor } from "@/lib/yarn-colors";

/**
 * Full-palette color chooser in a modal. The customer opens it from a button
 * (see AddToBag) and picks one color — or several when `multi` — from every
 * color in the catalogue. Confirming hands the selection back; canceling keeps
 * whatever was selected before.
 */
export default function ColorPickerModal({
  colors,
  multi,
  value,
  onConfirm,
  onClose,
}: {
  colors: YarnColor[];
  multi: boolean;
  value: string[];
  onConfirm: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(value);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const toggle = (id: string) =>
    setDraft((s) =>
      multi ? (s.includes(id) ? s.filter((c) => c !== id) : [...s, id]) : s[0] === id ? [] : [id],
    );

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center p-[clamp(12px,4vw,40px)]">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(40,42,28,.5)] backdrop-blur-[4px] animate-fadeUp"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Escolha a cor"
        className="relative z-[2] w-[min(560px,100%)] max-h-[86vh] flex flex-col bg-cream rounded-[24px] shadow-[0_50px_110px_-40px_rgba(0,0,0,.5)] animate-modalUp"
      >
        <div className="flex items-center justify-between px-[clamp(20px,4vw,30px)] pt-[22px] pb-4 border-b border-line-card">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase text-sage">
              {multi ? "Escolha as cores" : "Escolha a cor"}
            </div>
            <div className="text-[12px] text-muted-soft mt-1">
              {multi ? "Uma ou mais — do jeito que você quiser." : "Toque na cor que preferir."}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex-none w-[38px] h-[38px] rounded-full border border-line-input bg-transparent text-muted text-[17px] hover:bg-ink hover:text-cream hover:border-ink transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[clamp(20px,4vw,30px)] py-5">
          <div className="grid grid-cols-2 min-[440px]:grid-cols-3 gap-[10px]">
            {colors.map((c) => {
              const active = draft.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-[30px] pl-[7px] pr-3 min-h-[46px] py-2 border text-left select-none touch-manipulation active:scale-95 transition-[background-color,border-color,transform] ${
                    active
                      ? "border-sage bg-sage/20 text-ink ring-1 ring-sage"
                      : "border-line-input text-muted-nav hover:border-sage"
                  }`}
                >
                  <span
                    className="flex-none w-6 h-6 rounded-full border border-black/10"
                    style={{ background: c.hex }}
                  />
                  <span className="text-[13px] leading-tight">{c.name}</span>
                  {active && (
                    <span className="ml-auto text-sage-deep text-[13px] leading-none">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 px-[clamp(20px,4vw,30px)] py-4 border-t border-line-card">
          <span className="text-[13px] text-muted-soft mr-auto">
            {draft.length === 0
              ? "Nenhuma cor escolhida"
              : `${draft.length} cor${draft.length > 1 ? "es" : ""} escolhida${draft.length > 1 ? "s" : ""}`}
          </span>
          <button
            onClick={onClose}
            className="rounded-pill border border-line-input text-muted-nav px-5 py-[11px] text-[12px] tracking-[0.1em] uppercase hover:border-sage hover:text-sage transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(draft)}
            disabled={draft.length === 0}
            className="rounded-pill bg-ink text-cream px-6 py-[11px] text-[12px] tracking-[0.1em] uppercase hover:bg-sage transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
