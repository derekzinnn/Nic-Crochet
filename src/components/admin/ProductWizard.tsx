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
  "w-full bg-sand border border-line-input rounded-[12px] px-[15px] py-[13px] font-sans text-[15px] text-ink outline-none focus:border-sage";
const dLabel = "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[7px]";
const card = "bg-white border border-line-card rounded-[18px] p-[26px] animate-fadeUp";

function Chip({
  active,
  tone = "ink",
  onClick,
  children,
}: {
  active: boolean;
  /** "ink" for categories (dark active), "sage" for status (green active). */
  tone?: "ink" | "sage";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const activeCls =
    tone === "ink" ? "bg-ink text-cream border-ink" : "bg-sage text-cream border-sage";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[30px] px-4 py-[9px] text-[13px] border transition-colors ${
        active ? activeCls : "bg-white text-muted-nav border-line-input hover:border-sage"
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
  const detailCount = draft.detailsText.split("\n").filter((s) => s.trim()).length;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create" ? await createProduct(draft) : await updateProduct(productId!, draft);
      if (res && res.ok) {
        toast.success(mode === "create" ? "Bolsa publicada na loja!" : "Alterações salvas!");
        router.push("/area-da-nic/painel");
      } else {
        setError(res?.error ?? "Não foi possível salvar.");
      }
    });
  };

  return (
    <div>
      {/* stepper */}
      <div className="flex items-center gap-[10px] flex-wrap mb-6">
        {WIZARD_STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const current = n === step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => done && setStep(n)}
              className="inline-flex items-center gap-[9px] bg-transparent p-0 font-sans"
            >
              <span
                className="grid place-items-center w-[30px] h-[30px] rounded-full text-[13px] font-bold border transition-colors"
                style={{
                  background: current ? "#3B3A2E" : done ? "#8B9A60" : "#FFFFFF",
                  color: current || done ? "#FBF8F1" : "#9A9580",
                  borderColor: current || done ? "transparent" : "#E0D8C4",
                }}
              >
                {done ? "✓" : n}
              </span>
              <span
                className={`text-[12px] tracking-[0.08em] uppercase ${current ? "text-ink" : "text-muted-soft"}`}
              >
                {label}
              </span>
              <span className="w-[26px] h-px bg-[#D8D0BC] ml-[2px]" />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 min-[881px]:grid-cols-[1.25fr_0.75fr] gap-6 items-start">
        {/* form side */}
        <div className="flex flex-col gap-4">
          {step === 1 && (
            <div className={card}>
              <h2 className="font-serif text-[23px] text-ink mb-1">O essencial</h2>
              <p className="text-[13px] text-muted-soft mb-5">
                Nome, categoria, preço e situação da peça.
              </p>
              <label className="block mb-4">
                <span className={dLabel}>Nome da bolsa</span>
                <input
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Ex: Bolsa Margarida"
                  className={dInput}
                />
              </label>
              <span className={`${dLabel} mb-[9px]`}>Categoria</span>
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
              <span className={`${dLabel} mb-[9px]`}>Situação</span>
              <div className="flex flex-wrap gap-2 mb-4">
                {STATUS_OPTIONS.map((s) => (
                  <Chip
                    key={s.value}
                    tone="sage"
                    active={draft.status === s.value}
                    onClick={() => set("status", s.value)}
                  >
                    {s.label}
                  </Chip>
                ))}
              </div>
              <Chip tone="sage" active={draft.featured} onClick={() => set("featured", !draft.featured)}>
                {draft.featured ? "★ Em destaque na home" : "☆ Destacar na home"}
              </Chip>
            </div>
          )}

          {step === 2 && (
            <div className={card}>
              <h2 className="font-serif text-[23px] text-ink mb-1">Aparência</h2>
              <p className="text-[13px] text-muted-soft mb-5">
                Fotos da peça e as cores do fornecedor em que ela pode ser feita.
              </p>

              <div className="mb-6">
                <PhotoUploader photos={draft.photos} onChange={(photos) => set("photos", photos)} />
              </div>

              <span className={`${dLabel} mb-[10px]`}>Cores disponíveis (do fornecedor)</span>
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
                          ? "border-sage bg-sage/15 text-ink"
                          : "border-line-input text-muted-nav hover:border-sage"
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
              <p className="mb-4 text-[12px] text-muted-faint">
                Aparecem como “disponível nas cores” na loja e pintam o cartão enquanto a foto da
                peça não chega.
              </p>

              <button
                type="button"
                onClick={() => set("allowsMultipleColors", !draft.allowsMultipleColors)}
                className="flex items-center gap-3 mb-5 text-left"
              >
                <span
                  className={`relative w-[42px] h-[24px] rounded-full transition-colors flex-none ${
                    draft.allowsMultipleColors ? "bg-sage" : "bg-line-input"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${
                      draft.allowsMultipleColors ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </span>
                <span className="text-[13px] text-muted-nav">
                  Cliente pode escolher <strong className="text-ink">mais de uma cor</strong> ao
                  encomendar
                </span>
              </button>

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
            <div className="flex flex-col gap-4 animate-fadeUp">
              <div className="bg-white border border-line-card rounded-[18px] p-[26px]">
                <h2 className="font-serif text-[23px] text-ink mb-1">História da peça</h2>
                <p className="text-[13px] text-muted-soft mb-5">
                  O texto que aparece na página da bolsa.
                </p>
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

              <div className="bg-white border border-dashed border-line rounded-[18px] px-6 py-[22px]">
                <div className="text-[11px] tracking-[0.18em] uppercase text-sage mb-3">
                  Revisão rápida
                </div>
                {[
                  ["Nome", draft.name.trim() || "—"],
                  ["Categoria", draft.category],
                  ["Situação", PRODUCT_STATUS_LABEL[draft.status]],
                  ["Destaque", draft.featured ? "Sim" : "Não"],
                  ["Detalhes", `${detailCount} detalhe(s)`],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-3 py-[6px] border-b border-panel-line2"
                  >
                    <span className="text-muted-soft text-[13px]">{k}</span>
                    <span className="text-ink font-semibold text-[14px]">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 py-[6px]">
                  <span className="text-muted-soft text-[13px]">Preço</span>
                  <span className="text-sage-deep font-semibold text-[14px]">{priceLabel}</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="text-[13px] text-[#C06A4A]">{error}</div>}

          {/* step nav */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="btn-pill flex-none bg-transparent text-muted-nav border border-line-input px-6 py-[15px] hover:border-sage hover:text-sage"
              >
                ← Voltar
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="btn-pill flex-1 bg-ink text-cream py-[15px] hover:bg-sage"
              >
                Continuar →
              </button>
            )}
            {step === 3 && (
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className="btn-pill flex-1 bg-sage text-cream py-[15px] hover:bg-sage-deep disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending
                  ? "Salvando..."
                  : mode === "create"
                    ? "Publicar na loja"
                    : "Salvar alterações"}
              </button>
            )}
          </div>
        </div>

        {/* live preview side */}
        <aside className="min-[881px]:sticky min-[881px]:top-[86px]">
          <div className="text-[11px] tracking-[0.18em] uppercase text-muted-soft mb-3">
            Como aparece na loja
          </div>
          <div className="bg-cream border border-line-card rounded-[18px] p-4">
            <div className="relative aspect-[3/4] rounded-[14px] overflow-hidden">
              {draft.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.photos[0]}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `repeating-linear-gradient(42deg, ${swatch.primary} 0 12px, ${swatch.secondary} 12px 24px)`,
                  }}
                />
              )}
              {draft.tag.trim() && (
                <span className="absolute top-3 left-3 bg-cream text-sage-deep px-3 py-[5px] rounded-[30px] text-[10px] tracking-[0.14em] uppercase font-semibold">
                  {draft.tag}
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between gap-[10px] mt-[13px]">
              <span className="font-serif text-[20px] text-ink">
                {draft.name.trim() || "Nome da bolsa"}
              </span>
              <span className="text-[14px] font-bold text-sage-deep whitespace-nowrap">
                {priceLabel}
              </span>
            </div>
            <div className="text-[11px] tracking-[0.14em] uppercase text-muted-faint mt-[3px]">
              {draft.category}
            </div>
          </div>

          <Link
            href="/area-da-nic/painel"
            className="inline-block mt-5 text-[13px] text-muted-soft hover:text-sage transition-colors"
          >
            ← Cancelar e voltar ao painel
          </Link>
        </aside>
      </div>
    </div>
  );
}
