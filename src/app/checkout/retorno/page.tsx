import type { Metadata } from "next";
import Link from "next/link";
import { confirmOrderPayment } from "@/lib/order-payment";
import type { OrderStatus } from "@/lib/types";
import ClearCartOnMount from "@/components/checkout/ClearCartOnMount";

export const metadata: Metadata = {
  title: "Pagamento",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Search = { [k: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | null {
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const paymentId = first(sp.payment_id) ?? first(sp.collection_id);
  const rawStatus = first(sp.status) ?? first(sp.collection_status);
  let orderId = first(sp.external_reference);

  // Verify with the Mercado Pago API (authoritative) and sync the order.
  let status: OrderStatus | "PENDING" = "PENDING";
  if (paymentId) {
    const r = await confirmOrderPayment(paymentId);
    status = r.status;
    orderId = r.orderId ?? orderId;
  } else if (rawStatus === "approved") {
    status = "PAID";
  } else if (rawStatus === "rejected" || rawStatus === "failure") {
    status = "CANCELLED";
  }

  const approved = status === "PAID";
  const failed = status === "CANCELLED";
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : null;

  const view = approved
    ? {
        icon: "✓",
        tone: "bg-sage/15 text-sage-deep",
        title: "Pagamento confirmado!",
        text: "Recebemos seu pagamento. A Nic já foi avisada e vai preparar seu pedido — você recebe as novidades por e-mail.",
      }
    : failed
      ? {
          icon: "✕",
          tone: "bg-[#C06A4A]/12 text-[#C06A4A]",
          title: "Pagamento não concluído",
          text: "O pagamento não foi aprovado. Você pode tentar novamente pela sua sacola.",
        }
      : {
          icon: "…",
          tone: "bg-[#C9A85B]/15 text-[#9C7A2E]",
          title: "Pagamento em processamento",
          text: "Seu pagamento está sendo processado (comum no Pix/boleto). Assim que for confirmado, a Nic prepara seu pedido. Você recebe a confirmação por e-mail.",
        };

  return (
    <section className="min-h-screen bg-cream px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px]">
      {approved && <ClearCartOnMount />}
      <div className="max-w-[560px] mx-auto text-center py-[50px]">
        <div className={`w-16 h-16 mx-auto mb-5 grid place-items-center rounded-full text-[30px] ${view.tone}`}>
          {view.icon}
        </div>
        <h1 className="font-serif text-[clamp(28px,5vw,40px)] text-ink">{view.title}</h1>
        {shortId && (
          <p className="text-[13px] tracking-[0.1em] uppercase text-muted-soft mt-2">
            Pedido #{shortId}
          </p>
        )}
        <p className="text-[15px] text-muted-nav mt-3 leading-[1.7]">{view.text}</p>

        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link
            href="/colecao"
            className="btn-pill inline-block bg-ink text-cream px-[28px] py-[14px] !text-[12px] hover:bg-sage"
          >
            Continuar navegando
          </Link>
          {failed && (
            <Link
              href="/checkout"
              className="btn-pill inline-block bg-transparent text-muted-nav border border-line-input px-[26px] py-[13px] !text-[12px] hover:border-sage hover:text-sage"
            >
              Tentar de novo
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
