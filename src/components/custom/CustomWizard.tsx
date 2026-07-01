"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  PIECE_TYPES,
  SIZES,
  WIZARD_STEP_LABELS,
  emptyCustomOrder,
  validateCustomOrder,
  customOrderWhatsappMessage,
  type CustomOrderInput,
} from "@/lib/custom-order";
import { whatsappLink } from "@/lib/config";
import { submitCustomOrder } from "@/app/sob-medida/actions";

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[30px] px-5 py-[11px] text-[14px] border transition-colors ${
        active
          ? "bg-sage text-cream border-sage"
          : "bg-transparent text-muted-nav border-[#D8D0BC] hover:border-sage"
      }`}
    >
      {children}
    </button>
  );
}

const inputClass =
  "w-full bg-sand border border-line-input rounded-[12px] px-[15px] py-[13px] font-sans text-[15px] text-ink outline-none focus:border-sage";
const labelClass =
  "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[7px]";

export default function CustomWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CustomOrderInput>(emptyCustomOrder);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof CustomOrderInput>(key: K, value: CustomOrderInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const next = () => {
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const reset = () => {
    setForm(emptyCustomOrder);
    setStep(1);
    setSent(false);
    setError(null);
  };

  const submit = () => {
    const err = validateCustomOrder(form);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitCustomOrder(form);
      if (res.ok) setSent(true);
      else setError(res.error ?? "Algo deu errado. Tente novamente.");
    });
  };

  const coresResumo = form.colors.trim()
    ? form.colors.length > 40
      ? form.colors.slice(0, 40) + "…"
      : form.colors
    : "a combinar";

  if (sent) {
    return (
      <div className="bg-cream border border-line-card rounded-[24px] p-[clamp(34px,5vw,60px)] text-center">
        <div className="w-[72px] h-[72px] mx-auto mb-[22px] rounded-full bg-sage text-cream grid place-items-center text-[34px] animate-floaty">
          ✓
        </div>
        <h2 className="font-serif text-[34px] text-ink">Pedido enviado com carinho!</h2>
        <p className="mt-[14px] text-muted text-[15px] leading-[1.7]">
          A Nic recebeu sua ideia e responde em até 48h com esboço, valor e prazo. Toque abaixo para
          avisá-la agora mesmo no WhatsApp.
        </p>
        <div className="flex gap-3 justify-center flex-wrap mt-7">
          <a
            href={whatsappLink(customOrderWhatsappMessage(form))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill bg-sage text-cream px-7 py-[14px] hover:bg-sage-deep"
          >
            Avisar a Nic no WhatsApp
          </a>
          <Link href="/colecao" className="btn-pill bg-ink text-cream px-7 py-[14px] hover:bg-sage">
            Ver a coleção
          </Link>
          <button
            onClick={reset}
            className="btn-pill bg-transparent text-ink border border-line px-7 py-[14px] hover:border-sage"
          >
            Novo pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream border border-line-card rounded-[24px] p-[clamp(26px,4vw,44px)] max-[880px]:!p-[24px_20px]">
      {/* progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] tracking-[0.18em] uppercase text-sage">Etapa {step} de 4</span>
        <span className="text-[11px] tracking-[0.12em] uppercase text-muted-faint">
          {WIZARD_STEP_LABELS[step - 1]}
        </span>
      </div>
      <div className="h-[5px] bg-line-divider rounded-[10px] overflow-hidden mb-[30px]">
        <div
          className="h-full bg-sage rounded-[10px] transition-[width] duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* step 1 */}
      {step === 1 && (
        <div className="animate-fadeUp">
          <h3 className="font-serif text-[26px] text-ink mb-[6px]">O que vamos criar?</h3>
          <p className="text-[14px] text-[#7C7A66] mb-5">Escolha o tipo de peça e o tamanho ideal.</p>
          <span className={labelClass}>Tipo de peça</span>
          <div className="flex flex-wrap gap-[9px] mb-[26px]">
            {PIECE_TYPES.map((t) => (
              <Chip key={t} active={form.pieceType === t} onClick={() => set("pieceType", t)}>
                {t}
              </Chip>
            ))}
          </div>
          <span className={labelClass}>Tamanho</span>
          <div className="flex flex-wrap gap-[9px]">
            {SIZES.map((t) => (
              <Chip key={t} active={form.size === t} onClick={() => set("size", t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* step 2 */}
      {step === 2 && (
        <div className="animate-fadeUp">
          <h3 className="font-serif text-[26px] text-ink mb-[6px]">Quais cores te encantam?</h3>
          <p className="text-[14px] text-[#7C7A66] mb-5">
            Pode citar nomes, tons ou uma vibe. A Nic combina os fios.
          </p>
          <textarea
            value={form.colors}
            onChange={(e) => set("colors", e.target.value)}
            placeholder="Ex: terracota com cru, ou tons de verde sálvia, ou “algo bem clean e neutro”..."
            rows={4}
            className={`${inputClass} !rounded-[14px] !px-[15px] resize-y`}
          />
        </div>
      )}

      {/* step 3 */}
      {step === 3 && (
        <div className="animate-fadeUp">
          <h3 className="font-serif text-[26px] text-ink mb-[6px]">Conte os detalhes</h3>
          <p className="text-[14px] text-[#7C7A66] mb-5">
            Para quem é, ocasião, inspirações e quando você precisa.
          </p>
          <label className="block mb-[18px]">
            <span className={labelClass}>Prazo desejado</span>
            <input
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              placeholder="Ex: até o fim do mês"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Conta tudo</span>
            <textarea
              value={form.details}
              onChange={(e) => set("details", e.target.value)}
              placeholder="Inspirações, referências, para quem é, ocasião..."
              rows={4}
              className={`${inputClass} resize-y`}
            />
          </label>
        </div>
      )}

      {/* step 4 */}
      {step === 4 && (
        <div className="animate-fadeUp">
          <h3 className="font-serif text-[26px] text-ink mb-[6px]">Como te encontro?</h3>
          <p className="text-[14px] text-[#7C7A66] mb-5">
            Deixe seu contato e confira o resumo do pedido.
          </p>
          <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-[14px] mb-[22px]">
            <label className="block">
              <span className={labelClass}>Seu nome</span>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Como te chamam"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Contato</span>
              <input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="WhatsApp ou @insta"
                className={inputClass}
              />
            </label>
          </div>
          <div className="bg-sand border border-dashed border-line rounded-[16px] px-[22px] py-5">
            <div className="text-[11px] tracking-[0.18em] uppercase text-sage mb-[14px]">
              Resumo do pedido
            </div>
            <div className="flex justify-between gap-3 py-[7px] border-b border-line-soft">
              <span className="text-muted-soft text-[13px]">Tipo</span>
              <span className="text-ink font-semibold text-[14px]">{form.pieceType}</span>
            </div>
            <div className="flex justify-between gap-3 py-[7px] border-b border-line-soft">
              <span className="text-muted-soft text-[13px]">Tamanho</span>
              <span className="text-ink font-semibold text-[14px]">{form.size}</span>
            </div>
            <div className="flex justify-between gap-3 py-[7px]">
              <span className="text-muted-soft text-[13px]">Cores</span>
              <span className="text-ink font-semibold text-[14px] text-right max-w-[60%]">
                {coresResumo}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <div className="mt-4 text-[13px] text-[#C06A4A]">{error}</div>}

      {/* nav */}
      <div className="flex gap-3 mt-[30px]">
        {step > 1 && (
          <button
            onClick={back}
            className="btn-pill flex-none bg-transparent text-ink border border-line px-[26px] py-[15px] hover:border-sage"
          >
            ← Voltar
          </button>
        )}
        {step < 4 && (
          <button
            onClick={next}
            className="btn-pill flex-1 bg-ink text-cream py-[15px] hover:bg-sage"
          >
            Continuar →
          </button>
        )}
        {step === 4 && (
          <button
            onClick={submit}
            disabled={pending}
            className="btn-pill flex-1 bg-sage text-cream py-[15px] hover:bg-sage-deep disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Enviando..." : "Enviar pedido ♥"}
          </button>
        )}
      </div>
    </div>
  );
}
