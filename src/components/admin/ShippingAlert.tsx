import type { ShippingHealthView } from "@/lib/admin-data";

/**
 * Warns Nic when freight is not trustworthy — either no Melhor Envio token
 * (simulated prices) or the last real quote failed (usually an expired token,
 * which happens: Melhor Envio access tokens last ~30 days). Without this she'd
 * only find out when a customer complains.
 */
export default function ShippingAlert({ health }: { health: ShippingHealthView }) {
  if (!health.simulated && !health.failing) return null;

  const failing = health.failing;
  const when = health.lastFailureAt
    ? new Date(health.lastFailureAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const tone = failing
    ? "bg-[#C06A4A]/10 border-[#C06A4A]/40 text-[#8F4A33]"
    : "bg-[#C9A85B]/12 border-[#C9A85B]/45 text-[#8A6B2E]";

  return (
    <div className={`rounded-[14px] border px-[18px] py-[14px] mb-6 ${tone}`}>
      <div className="flex items-start gap-3">
        <span className="text-[18px] leading-none mt-[1px]">{failing ? "⚠" : "ℹ"}</span>
        <div className="text-[13px] leading-[1.6]">
          {failing ? (
            <>
              <strong className="block text-[14px] mb-[2px]">
                O cálculo de frete está falhando
              </strong>
              As clientes não conseguem fechar pedidos com envio (a retirada continua
              funcionando). {when && <>Última falha em {when}. </>}
              {health.lastFailureReason && <em>{health.lastFailureReason}</em>}
              <span className="block mt-1">
                O token do Melhor Envio costuma expirar a cada 30 dias — gere um novo no painel
                deles e atualize <code className="font-mono">MELHOR_ENVIO_TOKEN</code>.
              </span>
            </>
          ) : (
            <>
              <strong className="block text-[14px] mb-[2px]">Frete simulado</strong>
              Ainda não há token do Melhor Envio, então os valores mostrados na loja são uma{" "}
              <strong>estimativa</strong>, não o preço real dos Correios. Configure{" "}
              <code className="font-mono">MELHOR_ENVIO_TOKEN</code> para cotações reais.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
