"use client";

import { useState } from "react";
import { useCart, useShippingSelection } from "@/components/cart/cart-store";
import { calculateShipping } from "@/app/actions/shipping";
import {
  cartSignature,
  isValidCep,
  maskCep,
  optionDeliveryLabel,
  formatCep,
} from "@/lib/shipping";
import { brl } from "@/lib/format";
import { pickup } from "@/lib/config";

/**
 * CEP entry + freight calculation inside the cart drawer. Resolves the address
 * (ViaCEP) and shipping options (Melhor Envio) via the `calculateShipping`
 * server action, and drives the cart-store shipping state. The checkout button
 * (in CartDrawer) stays blocked until a valid option is selected here.
 */
/** Melhor Envio returns a dozen carriers; show the cheapest few by default. */
const TOP_OPTIONS = 3;

export default function ShippingBox() {
  const items = useCart((s) => s.items);
  const deliveryMethod = useCart((s) => s.deliveryMethod);
  const setDeliveryMethod = useCart((s) => s.setDeliveryMethod);
  const cep = useCart((s) => s.cep);
  const setCep = useCart((s) => s.setCep);
  const setQuote = useCart((s) => s.setQuote);
  const clearQuote = useCart((s) => s.clearQuote);
  const selectOption = useCart((s) => s.selectOption);
  const selectedOptionId = useCart((s) => s.selectedOptionId);

  const { quote, valid, stale } = useShippingSelection();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const onCalc = async () => {
    if (!isValidCep(cep) || loading) return;
    setErrorMsg(null);
    setLoading(true);
    const lines = items.map((i) => ({ productId: i.productId, qty: i.qty }));
    try {
      const res = await calculateShipping(cep, lines);
      if (res.ok) {
        setShowAll(false); // a new quote collapses back to the cheapest few
        setQuote(
          { address: res.address, options: res.options, simulated: res.simulated },
          cartSignature(items),
        );
      } else {
        clearQuote();
        setErrorMsg(res.message);
      }
    } catch {
      clearQuote();
      setErrorMsg("Não foi possível calcular o frete agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const cepOk = isValidCep(cep);
  const showResult = valid && quote;

  // Options come sorted by price. Collapsed, we show the cheapest few — plus the
  // selected one, so a choice made while expanded never disappears from view.
  const allOptions = quote?.options ?? [];
  const collapsed = !showAll && allOptions.length > TOP_OPTIONS;
  let visibleOptions = allOptions;
  if (collapsed) {
    visibleOptions = allOptions.slice(0, TOP_OPTIONS);
    const selected = allOptions.find((o) => o.id === selectedOptionId);
    if (selected && !visibleOptions.includes(selected)) {
      visibleOptions = [...visibleOptions, selected];
    }
  }

  return (
    <div className="mb-4">
      {/* Delivery method: ship it, or pick up at the atelier (free). */}
      <div className="flex gap-1 p-1 rounded-[12px] bg-cream border border-line-input mb-3">
        {([
          ["shipping", "Enviar"],
          ["pickup", "Retirar no ateliê"],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setDeliveryMethod(m)}
            className={`flex-1 rounded-[9px] py-[8px] text-[12px] tracking-[0.04em] transition-colors ${
              deliveryMethod === m ? "bg-ink text-cream" : "text-muted-nav hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {deliveryMethod === "pickup" && (
        <div className="rounded-[12px] border border-sage/40 bg-sage/[0.08] px-[14px] py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink">Retirada no ateliê</span>
            <span className="text-[13px] font-semibold text-sage-deep">Grátis</span>
          </div>
          <p className="text-[12px] text-muted-soft mt-1">
            {pickup.address} — {pickup.city}
          </p>
          <p className="text-[11px] text-muted-faint mt-[6px]">
            A Nic combina o horário de retirada com você após a compra.
          </p>
        </div>
      )}

      {deliveryMethod === "shipping" && (
        <>
      <div className="flex items-baseline justify-between mb-[7px]">
        <span className="text-[12px] tracking-[0.14em] uppercase text-muted-soft">Frete</span>
        {showResult && (
          <span className="text-[12px] text-muted-soft">
            {quote.address.city}/{quote.address.uf} · {formatCep(quote.address.cep)}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={cep}
          onChange={(e) => {
            setCep(maskCep(e.target.value));
            if (errorMsg) setErrorMsg(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && onCalc()}
          inputMode="numeric"
          placeholder="Seu CEP (00000-000)"
          aria-label="CEP de entrega"
          maxLength={9}
          className="flex-1 min-w-0 bg-cream border border-line-input rounded-[12px] px-[14px] py-[11px] font-sans text-[14px] text-ink outline-none focus:border-sage"
        />
        <button
          type="button"
          onClick={onCalc}
          disabled={!cepOk || loading}
          className="flex-none rounded-[12px] bg-ink text-cream px-[16px] py-[11px] text-[12px] tracking-[0.08em] uppercase hover:bg-sage transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
        >
          {loading ? "Calculando…" : stale ? "Recalcular" : "Calcular"}
        </button>
      </div>

      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-[6px] text-[11px] text-muted-faint hover:text-sage transition-colors"
      >
        Não sei meu CEP
      </a>

      {errorMsg && <p className="mt-2 text-[12px] text-[#C06A4A]">{errorMsg}</p>}

      {stale && !errorMsg && (
        <p className="mt-2 text-[12px] text-[#9A6B2E] bg-[#F5EAD4] border border-[#E6D3A8] rounded-[10px] px-3 py-2">
          Sua sacola mudou — recalcule o frete para continuar.
        </p>
      )}

      {showResult && (
        <div
          className={`mt-3 flex flex-col gap-2 ${
            showAll ? "max-h-[240px] overflow-y-auto pr-1" : ""
          }`}
        >
          {visibleOptions.map((o, idx) => {
            const active = o.id === selectedOptionId;
            const cheapest = o.id === allOptions[0]?.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => selectOption(o.id)}
                className={`flex items-center justify-between gap-3 rounded-[12px] border px-[14px] py-[10px] text-left transition-colors ${
                  active
                    ? "border-sage bg-sage/12"
                    : "border-line-input bg-cream hover:border-sage"
                }`}
              >
                <span className="flex items-center gap-[10px] min-w-0">
                  <span
                    className={`grid place-items-center w-[16px] h-[16px] rounded-full border flex-none ${
                      active ? "border-sage" : "border-line-input"
                    }`}
                  >
                    {active && <span className="w-[8px] h-[8px] rounded-full bg-sage" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] text-ink font-semibold truncate">
                      {o.name}
                      {o.company ? <span className="text-muted-soft font-normal"> · {o.company}</span> : null}
                    </span>
                    <span className="flex items-center gap-[6px] text-[12px] text-muted-soft">
                      {optionDeliveryLabel(o.deliveryDays)}
                      {cheapest && (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-sage-deep bg-sage/15 rounded-[20px] px-[6px] py-[1px]">
                          mais barato
                        </span>
                      )}
                    </span>
                  </span>
                </span>
                <span className="text-[14px] font-semibold text-sage-deep whitespace-nowrap">
                  {brl(o.priceCents)}
                </span>
              </button>
            );
          })}
          {quote.simulated && (
            <p className="text-[11px] text-muted-faint">
              Frete estimado — a Nic confirma o valor final no WhatsApp.
            </p>
          )}
        </div>
      )}

      {showResult && allOptions.length > TOP_OPTIONS && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-2 text-[12px] text-sage hover:text-sage-deep underline transition-colors"
        >
          {showAll
            ? "Ver menos opções"
            : `Ver todas as ${allOptions.length} opções de frete`}
        </button>
      )}
        </>
      )}
    </div>
  );
}
