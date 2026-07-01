"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ADMIN_CATEGORIES,
  STATUS_OPTIONS,
  WIZARD_STEP_LABELS,
  type ProductDraft,
} from "@/lib/product-form";
import { brl, reaisToCents } from "@/lib/format";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import { YARN_COLORS, swatchFromColors } from "@/lib/yarn-colors";
import { createProduct, updateProduct } from "@/app/area-da-nic/painel/actions";
import PhotoUploader from "@/components/admin/PhotoUploader";

const dInput =
  "w-full bg-panel border border-panel-line rounded-[12px] px-[15px] py-[13px] font-sans text-[15px] text-cream outline-none focus:border-sage";
const dLabel = "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[7px]";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[30px] px-4 py-[9px] text-[13px] border transition-colors ${
        active
          ? "bg-sage text-cream border-sage"
          : "bg-transparent text-cloud border-panel-line hover:border-sage-light"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductWizard({
  mode,
  productId,
  initial,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial: ProductDraft;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleColor = (id: string) =>
    setDraft((d) => ({
      ...d,
      colors: d.colors.includes(id) ? d.colors.filter((c) => c !== id) : [...d.colors, id],
    }));

  const priceLabel = draft.priceReais ? brl(reaisToCents(draft.priceReais)) : "R$ —";
  const swatch = swatchFromColors(draft.colors);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProduct(draft)
          : await updateProduct(productId!, draft);
      if (res && res.ok) {
        toast.success(mode === "create" ? "Bolsa publicada na loja!" : "Alterações salvas!");
        router.push("/area-da-nic/painel");
      } else {
        setError(res?.error ?? "Não foi possível salvar.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 min-[820px]:grid-cols-[1.3fr_0.7fr] gap-6">
      {/* form side */}
      <div className="bg-panel-card border border-panel-line rounded-[22px] p-[clamp(24px,3vw,36px)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] tracking-[0.18em] uppercase text-sage-light">
            Passo {step} de 4
          </span>
          <span className="text-[11px] tracking-[0.12em] uppercase text-muted-soft">
            {WIZARD_STEP_LABELS[step - 1]}
          </span>
        </div>
        <div className="h-[5px] bg-panel rounded-[10px] overflow-hidden mb-7">
          <div
            className="h-full bg-sage rounded-[10px] transition-[width] [transition-duration:400ms] [transition-timing-function:cubic-bezier(.2,.8,.2,1)]"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step === 1 && (
          <div className="animate-fadeUp">
            <h3 className="font-serif text-[24px] text-cream mb-[18px]">Informações básicas</h3>
            <label className="block mb-4">
              <span className={dLabel}>Nome da bolsa</span>
              <input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Bolsa Margarida"
                className={dInput}
              />
            </label>
            <span className={dLabel}>Categoria</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {ADMIN_CATEGORIES.map((c) => (
                <Chip key={c} active={draft.category === c} onClick={() => set("category", c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <label className="block mb-4">
              <span className={dLabel}>Preço (R$)</span>
              <input
                value={draft.priceReais}
                onChange={(e) => set("priceReais", e.target.value)}
                inputMode="decimal"
                placeholder="189"
                className={dInput}
              />
            </label>
            <span className={dLabel}>Status</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUS_OPTIONS.map((s) => (
                <Chip key={s.value} active={draft.status === s.value} onClick={() => set("status", s.value)}>
                  {s.label}
                </Chip>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("featured", !draft.featured)}
              className={`rounded-[30px] px-4 py-[9px] text-[13px] border transition-colors ${
                draft.featured
                  ? "bg-sage text-cream border-sage"
                  : "bg-transparent text-cloud border-panel-line hover:border-sage-light"
              }`}
            >
              {draft.featured ? "★ Em destaque na home" : "☆ Destacar na home"}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fadeUp">
            <h3 className="font-serif text-[24px] text-cream mb-[18px]">Aparência</h3>

            <div className="mb-6">
              <PhotoUploader photos={draft.photos} onChange={(photos) => set("photos", photos)} />
            </div>

            <span className={dLabel}>Cores disponíveis (do fornecedor)</span>
            <div className="flex flex-wrap gap-[10px] mb-1">
              {YARN_COLORS.map((c) => {
                const active = draft.colors.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => toggleColor(c.id)}
                    className={`flex items-center gap-2 rounded-[30px] border pl-[6px] pr-3 py-[5px] transition-colors ${
                      active
                        ? "border-sage bg-sage/15 text-cream"
                        : "border-panel-line text-cloud hover:border-sage-light"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/15"
                      style={{ background: c.hex }}
                    />
                    <span className="text-[12px]">{c.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="mb-5 text-[12px] text-muted-soft">
              Selecione as cores em que esta bolsa pode ser feita — só as do fornecedor. Aparecem como
              “disponível nas cores” na loja e geram o fundo tecido quando não há foto.
            </p>

            <label className="block">
              <span className={dLabel}>Selo (opcional)</span>
              <input
                value={draft.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="Ex: Novidade, Mais amada..."
                className={dInput}
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fadeUp">
            <h3 className="font-serif text-[24px] text-cream mb-[18px]">Descrição &amp; detalhes</h3>
            <label className="block mb-4">
              <span className={dLabel}>Descrição</span>
              <textarea
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Conte a história e o caimento da peça..."
                rows={3}
                className={`${dInput} resize-y`}
              />
            </label>
            <label className="block">
              <span className={dLabel}>Detalhes (um por linha)</span>
              <textarea
                value={draft.detailsText}
                onChange={(e) => set("detailsText", e.target.value)}
                placeholder={"Algodão 100% natural\nForro em linho\nAlça reforçada 60cm"}
                rows={4}
                className={`${dInput} resize-y`}
              />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fadeUp">
            <h3 className="font-serif text-[24px] text-cream mb-2">Revisão</h3>
            <p className="text-[14px] text-muted-faint mb-[18px]">
              Confira tudo antes de {mode === "create" ? "publicar" : "salvar"}.
            </p>
            <div className="bg-panel border border-panel-line rounded-[14px] px-5 py-[18px]">
              {[
                ["Nome", draft.name || "—"],
                ["Categoria", draft.category],
                ["Status", PRODUCT_STATUS_LABEL[draft.status]],
                ["Destaque", draft.featured ? "Sim" : "Não"],
              ].map(([k, v], i, arr) => (
                <div
                  key={k}
                  className={`flex justify-between gap-3 py-[7px] ${i < arr.length - 1 ? "border-b border-panel-line2" : ""}`}
                >
                  <span className="text-muted-soft text-[13px]">{k}</span>
                  <span className="text-cream font-semibold text-[14px]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between gap-3 py-[7px] border-t border-panel-line2 mt-1">
                <span className="text-muted-soft text-[13px]">Preço</span>
                <span className="text-sage-light font-semibold text-[14px]">{priceLabel}</span>
              </div>
            </div>
          </div>
        )}

        {error && <div className="mt-4 text-[13px] text-[#E0A48C]">{error}</div>}

        <div className="flex gap-3 mt-7">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="btn-pill flex-none bg-transparent text-cloud border border-panel-line px-6 py-[14px] hover:border-sage-light"
            >
              ← Voltar
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-pill flex-1 bg-cream text-ink py-[14px] hover:bg-cloud"
            >
              Continuar →
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn-pill flex-1 bg-sage text-cream py-[14px] hover:bg-sage-light disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending
                ? "Salvando..."
                : mode === "create"
                  ? "Publicar na loja ✦"
                  : "Salvar alterações ✦"}
            </button>
          )}
        </div>
      </div>

      {/* live preview side */}
      <div>
        <div className="text-[11px] tracking-[0.18em] uppercase text-muted-soft mb-3">
          Pré-visualização
        </div>
        <div className="relative aspect-[3/4] rounded-[18px] overflow-hidden">
          {draft.photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(42deg, ${swatch.primary} 0 12px, ${swatch.secondary} 12px 24px)`,
              }}
            />
          )}
          {draft.tag.trim() && (
            <span className="absolute top-[14px] left-[14px] bg-cream text-sage-deep px-3 py-[5px] rounded-[30px] text-[10px] tracking-[0.14em] uppercase font-semibold">
              {draft.tag}
            </span>
          )}
        </div>
        <div className="flex items-baseline justify-between gap-[10px] mt-[14px]">
          <span className="font-serif text-[21px] text-cream">{draft.name.trim() || "Nome da bolsa"}</span>
          <span className="text-[14px] font-semibold text-sage-light whitespace-nowrap">
            {priceLabel}
          </span>
        </div>
        <div className="text-[12px] tracking-[0.14em] uppercase text-muted-soft mt-1">
          {draft.category}
        </div>

        <Link
          href="/area-da-nic/painel"
          className="inline-block mt-6 text-[13px] text-muted-faint hover:text-cloud transition-colors"
        >
          ← Cancelar e voltar ao painel
        </Link>
      </div>
    </div>
  );
}
