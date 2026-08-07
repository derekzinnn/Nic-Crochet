"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart, selectTotalCents, useShippingSelection } from "@/components/cart/cart-store";
import ShippingBox from "@/components/cart/ShippingBox";
import { brl } from "@/lib/format";
import { pickup } from "@/lib/config";
import { colorNames } from "@/lib/custom-order";
import { isValidEmail, type CreateOrderInput } from "@/lib/checkout";
import { createOrder, startPayment } from "@/app/actions/orders";

type Step = "entrega" | "dados" | "pagamento";
const STEPS: { key: Step; label: string }[] = [
  { key: "entrega", label: "Entrega" },
  { key: "dados", label: "Seus dados" },
  { key: "pagamento", label: "Pagamento" },
];

const input =
  "w-full bg-white border border-line-input rounded-[12px] px-[15px] py-[12px] font-sans text-[15px] text-ink outline-none focus:border-sage";
const label = "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[6px]";

export default function CheckoutFlow() {
  const hydrated = useCart((s) => s.hydrated);
  const items = useCart((s) => s.items);
  const deliveryMethod = useCart((s) => s.deliveryMethod);
  const subtotalCents = useCart(selectTotalCents);
  const clear = useCart((s) => s.clear);
  const { valid: deliveryValid, selectedOption, quote } = useShippingSelection();

  const [step, setStep] = useState<Step>("entrega");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [district, setDistrict] = useState("");
  const [agree, setAgree] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedId, setPlacedId] = useState<string | null>(null);

  const shippingCents = selectedOption?.priceCents ?? 0;
  const totalCents = subtotalCents + shippingCents;
  const isShipping = deliveryMethod === "shipping";

  const dadosValid = useMemo(() => {
    if (!name.trim() || !isValidEmail(email)) return false;
    if (isShipping && !street.trim()) return false;
    return true;
  }, [name, email, street, isShipping]);

  // Not hydrated yet, or empty cart → nothing to check out.
  if (!hydrated) {
    return <div className="h-[40vh] grid place-items-center text-muted-soft">Carregando…</div>;
  }
  if (items.length === 0 && !placedId) {
    return (
      <div className="text-center py-[70px]">
        <div className="font-serif italic text-[26px] text-muted">Sua sacola está vazia</div>
        <p className="text-[14px] text-muted-soft mt-2">Escolha uma peça para finalizar a compra.</p>
        <Link
          href="/colecao"
          className="btn-pill inline-block mt-6 bg-sage text-cream px-[26px] py-3 !text-[12px]"
        >
          Ver coleção
        </Link>
      </div>
    );
  }

  // Order placed (payment pending) — confirmation screen.
  if (placedId) {
    return (
      <div className="text-center py-[60px]">
        <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-full bg-sage/15 text-sage-deep text-[30px]">
          ✓
        </div>
        <h1 className="font-serif text-[32px] text-ink">Pedido registrado!</h1>
        <p className="text-[15px] text-muted-nav mt-3 max-w-[440px] mx-auto leading-[1.7]">
          Seu pedido <strong className="text-ink">#{placedId.slice(-6).toUpperCase()}</strong> foi
          registrado. O pagamento online (Mercado Pago) está sendo ativado — a Nic vai confirmar os
          próximos passos com você por e-mail.
        </p>
        <Link
          href="/colecao"
          className="btn-pill inline-block mt-7 bg-ink text-cream px-[28px] py-[14px] !text-[12px] hover:bg-sage"
        >
          Continuar navegando
        </Link>
      </div>
    );
  }

  const goPay = async () => {
    setError(null);
    setPlacing(true);
    const payload: CreateOrderInput = {
      lines: items.map((i) => ({
        productId: i.productId,
        selectedColors: i.selectedColors,
        selectedSize: i.selectedSize,
        qty: i.qty,
      })),
      deliveryMethod,
      shippingCents: selectedOption?.priceCents,
      shippingLabel: selectedOption
        ? `${selectedOption.name}${selectedOption.company ? ` (${selectedOption.company})` : ""}`
        : undefined,
      shippingDays: selectedOption?.deliveryDays,
      address:
        isShipping && quote
          ? {
              cep: quote.address.cep,
              city: quote.address.city,
              uf: quote.address.uf,
              street: street.trim(),
              district: district.trim(),
            }
          : undefined,
      customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
    };
    try {
      const res = await createOrder(payload);
      if (!res.ok) {
        setError(res.error);
        setPlacing(false);
        return;
      }
      // Order is placed (PENDING). Start payment: redirect to Mercado Pago when
      // it's configured, otherwise fall back to the "registered" confirmation.
      const pay = await startPayment(res.orderId);
      if (!pay.ok) {
        setError(pay.error);
        setPlacing(false);
        return;
      }
      if (pay.redirectUrl) {
        window.location.href = pay.redirectUrl; // to Mercado Pago (page navigates away)
        return;
      }
      clear();
      setPlacedId(res.orderId);
      setPlacing(false);
    } catch {
      setError("Não foi possível registrar o pedido agora. Tente novamente.");
      setPlacing(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div>
      <h1 className="font-serif text-[clamp(30px,5vw,44px)] text-ink text-center mb-2">
        Finalizar compra
      </h1>

      {/* stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={`grid place-items-center w-[26px] h-[26px] rounded-full text-[12px] font-bold ${
                i <= stepIndex ? "bg-ink text-cream" : "bg-white text-muted-soft border border-line-input"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-[12px] ${i === stepIndex ? "text-ink font-semibold" : "text-muted-soft"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-line-input mx-1" />}
          </div>
        ))}
      </div>

      <div className="bg-white border border-line-card rounded-[18px] p-[clamp(18px,3vw,28px)]">
        {step === "entrega" && (
          <div>
            <h2 className="font-serif text-[22px] text-ink mb-1">Como você quer receber?</h2>
            <p className="text-[13px] text-muted-soft mb-5">
              Escolha entre envio pelos Correios ou retirada no ateliê.
            </p>
            <ShippingBox />
            <button
              type="button"
              disabled={!deliveryValid}
              onClick={() => setStep("dados")}
              className="btn-pill w-full mt-2 bg-ink text-cream py-[14px] hover:bg-sage disabled:opacity-45 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
            {!deliveryValid && (
              <p className="text-[12px] text-muted-soft mt-2 text-center">
                Calcule o frete ou escolha retirada para continuar.
              </p>
            )}
          </div>
        )}

        {step === "dados" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-[22px] text-ink mb-1">Seus dados</h2>
              <p className="text-[13px] text-muted-soft">Para a Nic entrar em contato e enviar seu pedido.</p>
            </div>
            <label className="block">
              <span className={label}>Nome completo</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Seu nome" />
            </label>
            <div className="grid grid-cols-1 min-[520px]:grid-cols-2 gap-4">
              <label className="block">
                <span className={label}>E-mail</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className={input}
                  placeholder="voce@email.com"
                />
              </label>
              <label className="block">
                <span className={label}>WhatsApp / telefone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={input}
                  placeholder="(53) 9 9999-9999"
                />
              </label>
            </div>

            {isShipping ? (
              <>
                <label className="block">
                  <span className={label}>Endereço (rua, número, complemento)</span>
                  <input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={input}
                    placeholder="Rua das Flores, 123, ap. 4"
                  />
                </label>
                <label className="block">
                  <span className={label}>Bairro</span>
                  <input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className={input}
                    placeholder="Centro"
                  />
                </label>
                {quote && (
                  <p className="text-[12px] text-muted-soft">
                    Entrega em <strong className="text-ink">{quote.address.city}/{quote.address.uf}</strong>{" "}
                    · CEP {quote.address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-[12px] border border-sage/40 bg-sage/[0.08] px-[14px] py-3 text-[13px]">
                <span className="text-ink font-semibold">Retirada no ateliê</span>
                <p className="text-muted-soft mt-1">{pickup.address} — {pickup.city}</p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep("entrega")}
                className="btn-pill flex-none bg-transparent text-muted-nav border border-line-input px-6 py-[14px] hover:border-sage hover:text-sage"
              >
                ← Voltar
              </button>
              <button
                type="button"
                disabled={!dadosValid}
                onClick={() => setStep("pagamento")}
                className="btn-pill flex-1 bg-ink text-cream py-[14px] hover:bg-sage disabled:opacity-45 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === "pagamento" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-[22px] text-ink mb-1">Revisão e pagamento</h2>
              <p className="text-[13px] text-muted-soft">Confira tudo antes de pagar.</p>
            </div>

            {/* summary */}
            <div className="rounded-[12px] border border-line-card divide-y divide-line-divider">
              {items.map((i) => {
                const extras = [
                  colorNames(i.selectedColors),
                  i.selectedSize ? `tam. ${i.selectedSize}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div key={i.lineId} className="flex justify-between gap-3 px-4 py-3 text-[14px]">
                    <span className="text-ink">
                      <span className="font-medium">{i.qty}× {i.name}</span>
                      {extras && <span className="text-muted-soft"> — {extras}</span>}
                    </span>
                    <span className="text-muted-nav whitespace-nowrap">{brl(i.priceCents * i.qty)}</span>
                  </div>
                );
              })}
              <div className="px-4 py-3 text-[13px] text-muted-nav">
                {isShipping ? (
                  <>
                    <div className="flex justify-between">
                      <span>{selectedOption?.name} {selectedOption?.company ? `· ${selectedOption.company}` : ""}</span>
                      <span>{brl(shippingCents)}</span>
                    </div>
                    <div className="mt-1 text-muted-soft">
                      {street || "—"}
                      {district ? `, ${district}` : ""} · {quote?.address.city}/{quote?.address.uf}
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Retirada no ateliê — {pickup.address}</span>
                    <span>grátis</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[14px]">
              <div className="flex justify-between text-muted-soft">
                <span>Subtotal</span>
                <span className="text-ink">{brl(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-muted-soft">
                <span>Frete</span>
                <span className="text-ink">{shippingCents ? brl(shippingCents) : "grátis"}</span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-[13px] tracking-[0.1em] uppercase text-muted-soft">Total</span>
                <span className="font-serif text-[28px] text-ink">{brl(totalCents)}</span>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-[12px] bg-sand/60 border border-line-card px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-[3px] accent-sage w-[16px] h-[16px]"
              />
              <span className="text-[13px] text-muted-nav leading-[1.5]">
                Li e concordo que, após o pagamento confirmado, o pedido{" "}
                <strong className="text-ink">não é reembolsável</strong>.
              </span>
            </label>

            {error && <p className="text-[13px] text-[#C06A4A]">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("dados")}
                className="btn-pill flex-none bg-transparent text-muted-nav border border-line-input px-6 py-[14px] hover:border-sage hover:text-sage"
              >
                ← Voltar
              </button>
              <button
                type="button"
                disabled={!agree || placing}
                onClick={goPay}
                className="btn-pill flex-1 bg-sage text-cream py-[14px] hover:bg-sage-deep disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {placing ? "Registrando…" : `Pagar ${brl(totalCents)}`}
              </button>
            </div>
            <p className="text-[11px] text-muted-faint text-center">
              Pagamento seguro via Mercado Pago — Pix, cartão ou boleto.
            </p>
          </div>
        )}
      </div>

      <Link
        href="/colecao"
        className="block text-center mt-5 text-[13px] text-muted-soft hover:text-sage transition-colors"
      >
        ← Continuar comprando
      </Link>
    </div>
  );
}
