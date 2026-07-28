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

/**
 * CEP entry + freight calculation inside the cart drawer. Resolves the address
 * (ViaCEP) and shipping options (Melhor Envio) via the `calculateShipping`
 * server action, and drives the cart-store shipping state. The checkout button
 * (in CartDrawer) stays blocked until a valid option is selected here.
 */
export default function ShippingBox() {
  const items = useCart((s) => s.items);
  const cep = useCart((s) => s.cep);
  const setCep = useCart((s) => s.setCep);
  const setQuote = useCart((s) => s.setQuote);
  const clearQuote = useCart((s) => s.clearQuote);
  const selectOption = useCart((s) => s.selectOption);
  const selectedOptionId = useCart((s) => s.selectedOptionId);

  const { quote, valid, stale } = useShippingSelection();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onCalc = async () => {
    if (!isValidCep(cep) || loading) return;
    setErrorMsg(null);
    setLoading(true);
    const lines = items.map((i) => ({ productId: i.productId, qty: i.qty }));
    try {
      const res = await calculateShipping(cep, lines);
      if (res.ok) {
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

  return (
    <div className="mb-4">
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
        <div className="mt-3 flex flex-col gap-2">
          {quote.options.map((o) => {
            const active = o.id === selectedOptionId;
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
                    <span className="block text-[12px] text-muted-soft">
                      {optionDeliveryLabel(o.deliveryDays)}
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
    </div>
  );
}
