import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/order-tracking";
import { brl } from "@/lib/format";
import { pickup } from "@/lib/config";
import { colorNames } from "@/lib/custom-order";
import { formatCep } from "@/lib/shipping";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Acompanhe seu pedido",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/** The customer-facing journey, in order. CANCELLED is handled separately. */
const STEPS: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "PENDING", label: "Pagamento", hint: "Aguardando a confirmação do pagamento." },
  { status: "PAID", label: "Em produção", hint: "Pagamento confirmado — a Nic já está cuidando da sua peça." },
  { status: "FULFILLED", label: "A caminho", hint: "Pedido concluído — enviado ou retirado." },
];

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const shortId = order.id.slice(-6).toUpperCase();
  const created = new Date(order.createdAt).toLocaleDateString("pt-BR");
  const cancelled = order.status === "CANCELLED";
  const currentIndex = STEPS.findIndex((s) => s.status === order.status);

  return (
    <section className="min-h-screen bg-cream px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px]">
      <div className="max-w-[620px] mx-auto">
        <div className="text-center mb-8">
          <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-3">Seu pedido</div>
          <h1 className="font-serif font-normal text-[clamp(28px,5vw,42px)] leading-none text-ink">
            Pedido #{shortId}
          </h1>
          <p className="text-[13px] text-muted-soft mt-3">
            Feito em {created} · {order.customerName}
          </p>
        </div>

        {/* status */}
        <div className="bg-white border border-line-card rounded-[18px] p-[clamp(18px,3vw,26px)] mb-5">
          {cancelled ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 mx-auto mb-3 grid place-items-center rounded-full bg-[#C06A4A]/12 text-[#C06A4A] text-[22px]">
                ✕
              </div>
              <div className="font-serif text-[22px] text-ink">Pedido cancelado</div>
              <p className="text-[14px] text-muted-soft mt-1">
                O pagamento não foi concluído. Se foi engano, fale com a Nic.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                {STEPS.map((s, i) => {
                  const done = i <= currentIndex;
                  return (
                    <div key={s.status} className="flex-1 flex flex-col items-center text-center">
                      <div className="flex items-center w-full">
                        <span className={`flex-1 h-[2px] ${i === 0 ? "bg-transparent" : done ? "bg-sage" : "bg-line-input"}`} />
                        <span
                          className={`grid place-items-center w-[28px] h-[28px] rounded-full text-[12px] font-bold flex-none ${
                            done ? "bg-sage text-cream" : "bg-white text-muted-soft border border-line-input"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </span>
                        <span className={`flex-1 h-[2px] ${i === STEPS.length - 1 ? "bg-transparent" : i < currentIndex ? "bg-sage" : "bg-line-input"}`} />
                      </div>
                      <span className={`text-[12px] mt-2 ${i === currentIndex ? "text-ink font-semibold" : "text-muted-soft"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[14px] text-muted-nav text-center mt-4">
                {STEPS[currentIndex]?.hint ?? ORDER_STATUS_LABEL[order.status]}
              </p>
            </>
          )}
        </div>

        {/* delivery */}
        <div className="bg-white border border-line-card rounded-[18px] p-[clamp(18px,3vw,26px)] mb-5">
          <div className="text-[11px] tracking-[0.18em] uppercase text-muted-soft mb-3">Entrega</div>
          {order.deliveryMethod === "pickup" ? (
            <>
              <div className="text-[15px] text-ink font-semibold">Retirada no ateliê</div>
              <p className="text-[14px] text-muted-soft mt-1">
                {pickup.address} — {pickup.city}
              </p>
              <p className="text-[13px] text-muted-faint mt-2">
                A Nic combina o horário de retirada com você.
              </p>
            </>
          ) : (
            <>
              <div className="text-[15px] text-ink font-semibold">
                {order.shippingLabel ?? "Envio"}
                {order.shippingCents ? ` — ${brl(order.shippingCents)}` : ""}
              </div>
              <p className="text-[14px] text-muted-soft mt-1">
                {order.street}
                {order.district ? `, ${order.district}` : ""}
                <br />
                {order.city}/{order.uf} · CEP {formatCep(order.cep ?? "")}
              </p>
              {order.trackingCode ? (
                <div className="mt-3 rounded-[12px] bg-sage/[0.08] border border-sage/40 px-[14px] py-3">
                  <div className="text-[12px] text-muted-soft">Código de rastreio</div>
                  <div className="text-[16px] text-ink font-semibold tracking-wide">
                    {order.trackingCode}
                  </div>
                  <a
                    href="https://rastreamento.correios.com.br/app/index.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-sage-deep underline mt-1 inline-block"
                  >
                    Rastrear nos Correios →
                  </a>
                </div>
              ) : (
                <p className="text-[13px] text-muted-faint mt-2">
                  Assim que a peça for postada, o código de rastreio aparece aqui.
                </p>
              )}
            </>
          )}
        </div>

        {/* items */}
        <div className="bg-white border border-line-card rounded-[18px] p-[clamp(18px,3vw,26px)]">
          <div className="text-[11px] tracking-[0.18em] uppercase text-muted-soft mb-3">Itens</div>
          <div className="flex flex-col divide-y divide-line-divider">
            {order.items.map((it, i) => {
              const extras = [
                colorNames(it.selectedColors),
                it.selectedSize ? `tam. ${it.selectedSize}` : "",
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <div key={i} className="flex justify-between gap-3 py-[10px] first:pt-0 text-[14px]">
                  <span className="text-ink">
                    <span className="font-medium">
                      {it.qty}× {it.name}
                    </span>
                    {extras && <span className="text-muted-soft"> — {extras}</span>}
                  </span>
                  <span className="text-muted-nav whitespace-nowrap">
                    {brl(it.unitPriceCents * it.qty)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-line-divider flex flex-col gap-1 text-[14px]">
            <div className="flex justify-between text-muted-soft">
              <span>Subtotal</span>
              <span className="text-ink">{brl(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between text-muted-soft">
              <span>Frete</span>
              <span className="text-ink">
                {order.shippingCents ? brl(order.shippingCents) : "grátis"}
              </span>
            </div>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-[13px] tracking-[0.1em] uppercase text-muted-soft">Total</span>
              <span className="font-serif text-[26px] text-ink">{brl(order.totalCents)}</span>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-muted-soft text-center mt-6">
          Guarde este link para acompanhar seu pedido a qualquer momento.
        </p>
        <Link
          href="/colecao"
          className="block text-center mt-2 text-[13px] text-sage hover:text-sage-deep transition-colors"
        >
          ← Ver a coleção
        </Link>
      </div>
    </section>
  );
}
