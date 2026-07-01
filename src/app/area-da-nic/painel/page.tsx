import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { logoutAction } from "@/app/area-da-nic/actions";
import { brl } from "@/lib/format";
import { PRODUCT_STATUS_LABEL, type ProductStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

const STATUS_STYLE: Record<ProductStatus, string> = {
  AVAILABLE: "bg-sage/20 text-sage-light border-sage/40",
  SOLD: "bg-[#C06A4A]/15 text-[#E0A48C] border-[#C06A4A]/40",
  MADE_TO_ORDER: "bg-[#C9A85B]/15 text-[#E7D79A] border-[#C9A85B]/40",
};

export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const products = await getAllProducts();

  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-panel">
      <div className="max-w-[920px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-[14px] mb-[30px]">
          <div>
            <div className="text-[12px] tracking-[0.28em] uppercase text-sage-light">Painel</div>
            <h1 className="font-serif font-normal text-[clamp(30px,4vw,46px)] text-cream mt-1">
              Olá, Nic 🌿
            </h1>
          </div>
          <div className="flex items-center gap-[14px]">
            <span className="text-[13px] text-muted-faint">
              {products.length} bolsa(s) cadastrada(s)
            </span>
            <form action={logoutAction}>
              <button className="btn-pill bg-transparent text-cloud border border-panel-line px-[18px] py-[10px] !text-[12px] hover:border-sage-light">
                Sair
              </button>
            </form>
          </div>
        </div>

        <div className="bg-panel-card border border-panel-line rounded-[16px] px-5 py-4 mb-6 text-[13px] text-muted-faint">
          Cadastro, edição, exclusão e upload de fotos chegam na próxima etapa. Por ora, aqui está
          tudo que está publicado na loja.
        </div>

        <div className="flex flex-col gap-[10px]">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-panel-card border border-panel-line rounded-[14px] p-3"
            >
              <div
                className="flex-none w-[54px] h-[64px] rounded-[10px] overflow-hidden bg-cover bg-center"
                style={{
                  background: p.photos[0]
                    ? `center / cover no-repeat url(${p.photos[0]})`
                    : `repeating-linear-gradient(42deg, ${p.colorPrimary} 0 8px, ${p.colorSecondary} 8px 16px)`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-serif text-[19px] text-cream truncate">{p.name}</div>
                <div className="text-[12px] tracking-[0.12em] uppercase text-muted-soft mt-[2px]">
                  {p.category}
                  {p.tag ? ` · ${p.tag}` : ""}
                </div>
              </div>
              <span className="text-[15px] font-semibold text-sage-light whitespace-nowrap">
                {brl(p.priceCents)}
              </span>
              <span
                className={`text-[10px] tracking-[0.1em] uppercase font-semibold px-[10px] py-[5px] rounded-[20px] border whitespace-nowrap ${STATUS_STYLE[p.status]}`}
              >
                {PRODUCT_STATUS_LABEL[p.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
