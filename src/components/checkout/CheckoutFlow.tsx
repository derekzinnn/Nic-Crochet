"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart, selectTotalCents, useShippingSelection } from "@/components/cart/cart-store";
import ShippingBox from "@/components/cart/ShippingBox";
import ProductMedia from "@/components/product/ProductMedia";
import { brl } from "@/lib/format";
import { pickup } from "@/lib/config";
import { colorNames } from "@/lib/custom-order";
import { resolveYarnColors } from "@/lib/yarn-colors";
import { isValidEmail, type CreateOrderInput } from "@/lib/checkout";
import { createOrder, startPayment } from "@/app/actions/orders";

const input =
  "w-full bg-white border border-line-input rounded-[12px] px-[15px] py-[12px] font-sans text-[15px] text-ink outline-none focus:border-sage";
const label = "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[6px]";

/** Numbered section card — the checkout is one page, read top to bottom. */
function Section({
  n,
  title,
  subtitle,
  children,
}: {
  n: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-line-card rounded-[18px] p-[clamp(18px,3vw,26px)]">
      <div className="flex items-center gap-3 mb-1">
        <span className="grid place-items-center w-[26px] h-[26px] rounded-full bg-ink text-cream text-[12px] font-bold flex-none">
          {n}
        </span>
        <h2 className="font-serif text-[22px] text-ink">{title}</h2>
      </div>
      {subtitle && <p className="text-[13px] text-muted-soft mb-4 ml-[38px]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function CheckoutFlow() {
  const hydrated = useCart((s) => s.hydrated);
  const items = useCart((s) => s.items);
  const deliveryMethod = useCart((s) => s.deliveryMethod);
  const subtotalCents = useCart(selectTotalCents);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const { valid: deliveryValid, selectedOption, quote } = useShippingSelection();

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

  const canPay = deliveryValid && dadosValid && agree && !placing;

  /** What's still missing, so the customer knows why the button is locked. */
  const missing = useMemo(() => {
    const m: string[] = [];
    if (!deliveryValid) m.push("escolha a entrega");
    if (!name.trim()) m.push("seu nome");
    if (!isValidEmail(email)) m.push("um e-mail válido");
    if (isShipping && !street.trim()) m.push("o endereço");
    if (!agree) m.push("aceitar os termos");
    return m;
  }, [deliveryValid, name, email, street, isShipping, agree]);

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

  if (placedId) {
    return (
      <div className="text-center py-[60px]">
        <div className="w-16 h-16 mx-auto mb-5 grid place-items-center rounded-full bg-sage/15 text-sage-deep text-[30px]">
          ✓
        </div>
        <h1 className="font-serif text-[32px] text-ink">Pedido registrado!</h1>
        <p className="text-[15px] text-muted-nav mt-3 max-w-[440px] mx-auto leading-[1.7]">
          Seu pedido <strong className="text-ink">#{placedId.slice(-6).toUpperCase()}</strong> foi
          registrado. A Nic vai confirmar os próximos passos com você por e-mail.
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
      const pay = await startPayment(res.orderId);
      if (!pay.ok) {
        setError(pay.error);
        setPlacing(false);
        return;
      }
      if (pay.redirectUrl) {
        window.location.href = pay.redirectUrl; // → Mercado Pago
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

  return (
    <div>
      <div className="text-center mb-8">
        <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-3">Checkout</div>
        <h1 className="font-serif font-normal text-[clamp(30px,5vw,48px)] leading-none text-ink">
          Finalizar compra
        </h1>
      </div>

      <div className="grid grid-cols-1 min-[900px]:grid-cols-[1fr_320px] gap-6 items-start">
        {/* ---------------------------- sections ---------------------------- */}
        <div className="flex flex-col gap-5">
          <Section n={1} title="Sua sacola" subtitle={`${items.length} peça(s) selecionada(s)`}>
            <div className="flex flex-col divide-y divide-line-divider">
              {items.map((i) => (
                <div key={i.lineId} className="flex gap-[14px] py-3 first:pt-0">
                  <div className="relative flex-none w-[62px] h-[74px] rounded-[10px] overflow-hidden">
                    <ProductMedia
                      name={i.name}
                      photo={i.photo}
                      colorPrimary={i.colorPrimary}
                      colorSecondary={i.colorSecondary}
                      variant="thumb"
                      sizes="62px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <span className="font-serif text-[18px] text-ink">{i.name}</span>
                      <button
                        onClick={() => remove(i.lineId)}
                        className="text-[#B7AE96] text-[12px] hover:text-[#C06A4A] transition-colors"
                      >
                        remover
                      </button>
                    </div>
                    {(i.selectedColors.length > 0 || i.selectedSize) && (
                      <div className="flex items-center gap-[6px] mt-1 flex-wrap">
                        {resolveYarnColors(i.selectedColors).map((c) => (
                          <span
                            key={c.id}
                            title={c.name}
                            className="w-[13px] h-[13px] rounded-full border border-black/10"
                            style={{ background: c.hex }}
                          />
                        ))}
                        <span className="text-[12px] text-muted-soft">
                          {[
                            colorNames(i.selectedColors),
                            i.selectedSize ? `tam. ${i.selectedSize}` : "",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-line-input rounded-[30px] overflow-hidden">
                        <button
                          onClick={() => decrement(i.lineId)}
                          aria-label="Diminuir"
                          className="w-[28px] h-[28px] bg-transparent text-muted text-[15px] hover:bg-[#F0EAD9]"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center text-[13px] font-semibold text-ink">
                          {i.qty}
                        </span>
                        <button
                          onClick={() => increment(i.lineId)}
                          aria-label="Aumentar"
                          className="w-[28px] h-[28px] bg-transparent text-muted text-[15px] hover:bg-[#F0EAD9]"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-semibold text-sage-deep text-[15px]">
                        {brl(i.priceCents * i.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section
            n={2}
            title="Entrega e frete"
            subtitle="Receba em casa ou retire no ateliê da Nic."
          >
            <ShippingBox />

            {isShipping && deliveryValid && (
              <div className="mt-4 pt-4 border-t border-line-divider flex flex-col gap-4">
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
                    Entrega em{" "}
                    <strong className="text-ink">
                      {quote.address.city}/{quote.address.uf}
                    </strong>{" "}
                    · CEP {quote.address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}
                  </p>
                )}
              </div>
            )}
          </Section>

          <Section n={3} title="Forma de pagamento" subtitle="Pix, cartão ou boleto no Mercado Pago.">
            <div className="flex flex-col gap-4">
              <label className="block">
                <span className={label}>Nome completo</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={input}
                  placeholder="Seu nome"
                />
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

              <div className="rounded-[12px] border border-line-card bg-sand/60 px-[14px] py-3 flex items-center gap-3">
                <span className="grid place-items-center w-[38px] h-[38px] rounded-[10px] bg-[#00A9E0] text-white text-[16px] font-bold flex-none">
                  MP
                </span>
                <div>
                  <div className="text-[14px] text-ink font-semibold">Mercado Pago</div>
                  <div className="text-[12px] text-muted-soft">
                    Você escolhe Pix, cartão ou boleto na próxima tela.
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-[3px] accent-sage w-[16px] h-[16px] flex-none"
                />
                <span className="text-[13px] text-muted-nav leading-[1.5]">
                  Li e concordo que, após o pagamento confirmado, o pedido{" "}
                  <strong className="text-ink">não é reembolsável</strong>.
                </span>
              </label>
            </div>
          </Section>
        </div>

        {/* ---------------------------- summary ----------------------------- */}
        <aside className="min-[900px]:sticky min-[900px]:top-[92px]">
          <div className="bg-white border border-line-card rounded-[18px] p-[22px]">
            <div className="text-[11px] tracking-[0.18em] uppercase text-muted-soft mb-4">
              Resumo do pedido
            </div>

            <div className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between text-muted-soft">
                <span>Subtotal</span>
                <span className="text-ink">{brl(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-muted-soft">
                <span>Frete</span>
                <span className="text-ink">
                  {deliveryValid ? (shippingCents ? brl(shippingCents) : "grátis") : "—"}
                </span>
              </div>
              {deliveryValid && (
                <p className="text-[12px] text-muted-faint">
                  {isShipping
                    ? `${selectedOption?.name}${selectedOption?.company ? ` · ${selectedOption.company}` : ""}`
                    : `Retirada — ${pickup.address}`}
                </p>
              )}
            </div>

            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-line-divider">
              <span className="text-[13px] tracking-[0.1em] uppercase text-muted-soft">Total</span>
              <span className="font-serif text-[30px] text-ink">{brl(totalCents)}</span>
            </div>

            {error && <p className="mt-3 text-[13px] text-[#C06A4A]">{error}</p>}

            <button
              type="button"
              disabled={!canPay}
              onClick={goPay}
              className="btn-pill w-full mt-5 bg-sage text-cream py-[15px] hover:bg-sage-deep disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {placing ? "Processando…" : `Pagar ${brl(totalCents)}`}
            </button>

            {!canPay && !placing && missing.length > 0 && (
              <p className="text-[12px] text-muted-soft mt-[10px] text-center">
                Falta: {missing.join(", ")}.
              </p>
            )}

            <p className="text-[11px] text-muted-faint text-center mt-3">
              Pagamento seguro via Mercado Pago 🔒
            </p>
          </div>

          <Link
            href="/colecao"
            className="block text-center mt-4 text-[13px] text-muted-soft hover:text-sage transition-colors"
          >
            ← Continuar comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
