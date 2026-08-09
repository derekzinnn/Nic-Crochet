import "server-only";
import { brl } from "@/lib/format";
import { colorNames } from "@/lib/custom-order";
import { pickup, siteConfig } from "@/lib/config";
import { trackingUrl } from "@/lib/order-tracking";
import { formatCep } from "@/lib/shipping";
import type { OrderItemSnapshot, OrderView } from "@/lib/types";

/**
 * Transactional e-mail via Resend (REST, no SDK). Used to tell Nic a paid order
 * came in, and to confirm the purchase to the customer — replacing the WhatsApp
 * handoff at zero cost. Sending is best-effort: a failure is logged and never
 * breaks the payment flow.
 */

const RESEND_API = "https://api.resend.com/emails";

/**
 * Escape anything that came from a customer before it goes into e-mail HTML.
 * Checkout is public and unauthenticated, so name/address/phone are attacker
 * controlled — unescaped they could inject markup (a fake "confirm here" link)
 * into the very e-mail Nic trusts.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape for use inside an href/attribute, dropping non-http(s)/mailto URLs. */
function escUrl(value: string): string {
  const safe = /^(https?:|mailto:)/i.test(value) ? value : "";
  return esc(safe);
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Whether to also e-mail the customer. Off by default: with Resend's sandbox
 * sender (onboarding@resend.dev) only the account's own address is deliverable,
 * so customer mail would just bounce. Set SEND_CUSTOMER_EMAIL="true" once a
 * sender domain is verified and ORDER_FROM_EMAIL points at it.
 */
export function isCustomerEmailEnabled(): boolean {
  return process.env.SEND_CUSTOMER_EMAIL === "true";
}

/** Where Nic receives order notifications. */
function notifyEmail(): string {
  return process.env.ORDER_NOTIFY_EMAIL || "nic.crochet1@gmail.com";
}

/**
 * Sender address. Must be a Resend-verified domain in production; the
 * onboarding@resend.dev fallback only delivers to the account's own address.
 */
function fromEmail(): string {
  return process.env.ORDER_FROM_EMAIL || "Nic Crochet <onboarding@resend.dev>";
}

type SendArgs = { to: string; subject: string; html: string; replyTo?: string };

async function send({ to, subject, html, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        from: fromEmail(),
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.warn("[email] Resend recusou o envio:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[email] falha ao enviar:", (err as Error).message);
    return false;
  }
}

/* ---------------------------------- views --------------------------------- */

const wrap = (inner: string) => `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#F6F2E9;padding:28px">
  <div style="max-width:560px;margin:0 auto;background:#FBF8F1;border:1px solid #E0D8C4;border-radius:16px;padding:28px">
    <div style="font-size:20px;color:#3B3A2E;letter-spacing:.02em;margin-bottom:4px">nic crochet</div>
    <div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#9A9580;margin-bottom:20px">feito à mão</div>
    ${inner}
  </div>
</div>`;

function itemsTable(items: OrderItemSnapshot[]): string {
  const rows = items
    .map((it) => {
      const extras = [colorNames(it.selectedColors), it.selectedSize ? `tam. ${it.selectedSize}` : ""]
        .filter(Boolean)
        .join(" · ");
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #EDE6D4;color:#3B3A2E;font-size:14px">
          <strong>${esc(it.qty)}× ${esc(it.name)}</strong>${extras ? `<br><span style="color:#9A9580;font-size:12px">${esc(extras)}</span>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #EDE6D4;text-align:right;color:#6E7C48;font-size:14px;white-space:nowrap">
          ${brl(it.unitPriceCents * it.qty)}
        </td>
      </tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0">${rows}</table>`;
}

function deliveryBlock(o: OrderView): string {
  if (o.deliveryMethod === "pickup") {
    return `<p style="font-size:14px;color:#3B3A2E;margin:0"><strong>Retirada no ateliê</strong><br>
      <span style="color:#9A9580">${pickup.address} — ${pickup.city}</span></p>`;
  }
  return `<p style="font-size:14px;color:#3B3A2E;margin:0"><strong>${esc(o.shippingLabel ?? "Envio")}</strong>
    ${o.shippingCents ? ` — ${brl(o.shippingCents)}` : ""}<br>
    <span style="color:#9A9580">${esc(o.street ?? "")}${o.district ? `, ${esc(o.district)}` : ""}<br>
    ${esc(o.city ?? "")}/${esc(o.uf ?? "")} · CEP ${esc(formatCep(o.cep ?? ""))}</span></p>`;
}

function totals(o: OrderView): string {
  return `<table style="width:100%;border-collapse:collapse;margin-top:14px">
    <tr><td style="font-size:13px;color:#9A9580">Subtotal</td>
        <td style="text-align:right;font-size:13px;color:#3B3A2E">${brl(o.subtotalCents)}</td></tr>
    <tr><td style="font-size:13px;color:#9A9580">Frete</td>
        <td style="text-align:right;font-size:13px;color:#3B3A2E">${o.shippingCents ? brl(o.shippingCents) : "grátis"}</td></tr>
    <tr><td style="font-size:15px;color:#3B3A2E;padding-top:8px"><strong>Total</strong></td>
        <td style="text-align:right;font-size:18px;color:#3B3A2E;padding-top:8px"><strong>${brl(o.totalCents)}</strong></td></tr>
  </table>`;
}

const shortId = (id: string) => id.slice(-6).toUpperCase();

/* --------------------------------- senders -------------------------------- */

/** Order summary to Nic — the "a sale came in" alert. */
export async function sendOrderEmailToNic(order: OrderView): Promise<boolean> {
  const html = wrap(`
    <h1 style="font-size:22px;color:#3B3A2E;margin:0 0 4px">Novo pedido pago 🎉</h1>
    <p style="font-size:13px;color:#9A9580;margin:0 0 16px">Pedido #${shortId(order.id)} · ${new Date(order.createdAt).toLocaleString("pt-BR")}</p>
    ${itemsTable(order.items)}
    ${deliveryBlock(order)}
    ${totals(order)}
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #EDE6D4">
      <p style="font-size:13px;color:#9A9580;margin:0 0 4px">Cliente</p>
      <p style="font-size:14px;color:#3B3A2E;margin:0">
        ${esc(order.customerName)}<br>
        <a href="${escUrl(`mailto:${order.customerEmail}`)}" style="color:#6E7C48">${esc(order.customerEmail)}</a>
        ${order.customerPhone ? `<br>${esc(order.customerPhone)}` : ""}
      </p>
    </div>
    <p style="font-size:12px;color:#9A9580;margin-top:20px">Veja tudo no painel: ${siteConfig.url}/area-da-nic/painel/pedidos</p>
  `);
  return send({
    to: notifyEmail(),
    subject: `Novo pedido #${shortId(order.id)} — ${brl(order.totalCents)}`,
    html,
    replyTo: order.customerEmail,
  });
}

/** Purchase confirmation to the customer. */
export async function sendOrderEmailToCustomer(order: OrderView): Promise<boolean> {
  const next =
    order.deliveryMethod === "pickup"
      ? "A Nic vai combinar com você o melhor horário para a retirada."
      : "Assim que sua peça for postada, a Nic te avisa com o código de rastreio.";
  const html = wrap(`
    <h1 style="font-size:22px;color:#3B3A2E;margin:0 0 4px">Pagamento confirmado 💛</h1>
    <p style="font-size:14px;color:#3B3A2E;margin:0 0 16px">
      Oi, ${esc(order.customerName)}! Recebemos seu pagamento — obrigada por levar uma peça feita à mão.
      Seu pedido é o <strong>#${shortId(order.id)}</strong>.
    </p>
    ${itemsTable(order.items)}
    ${deliveryBlock(order)}
    ${totals(order)}
    <p style="font-size:14px;color:#3B3A2E;margin-top:18px">${next}</p>
    <div style="margin-top:22px;text-align:center">
      <a href="${escUrl(trackingUrl(order.publicToken))}"
         style="display:inline-block;background:#3B3A2E;color:#FBF8F1;text-decoration:none;padding:13px 26px;border-radius:30px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">
        Acompanhar meu pedido
      </a>
      <p style="font-size:11px;color:#9A9580;margin-top:10px">
        Guarde este link — é por ele que você acompanha o pedido (não precisa de senha).
      </p>
    </div>
    <p style="font-size:12px;color:#9A9580;margin-top:18px">
      Dúvidas? É só responder este e-mail.
    </p>
  `);
  return send({
    to: order.customerEmail,
    subject: `Seu pedido #${shortId(order.id)} foi confirmado — nic crochet`,
    html,
    replyTo: notifyEmail(),
  });
}
