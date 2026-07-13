import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import ProductRow from "@/components/admin/ProductRow";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

// Always render fresh so newly created/edited bags show immediately.
export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const products = await getAllProducts();
  const disponiveis = products.filter((p) => p.status === "AVAILABLE").length;
  const sobEncomenda = products.filter((p) => p.status === "MADE_TO_ORDER").length;

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-[22px]">
        <div>
          <h1 className="font-serif font-medium text-[clamp(30px,4vw,42px)] text-ink">
            Suas bolsas
          </h1>
          <p className="text-[13px] text-muted-soft mt-1">
            Tudo o que está na loja, em um lugar só.
          </p>
        </div>
        <Link
          href="/area-da-nic/painel/nova"
          className="btn-pill bg-ink text-cream px-[26px] py-[14px] !text-[12px] hover:bg-sage"
        >
          + Nova bolsa
        </Link>
      </div>

      <div className="grid grid-cols-1 min-[881px]:grid-cols-3 gap-[14px] mb-[26px]">
        <div className="bg-white border border-line-card rounded-[16px] px-5 py-[18px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft">Na loja</div>
          <div className="font-serif text-[34px] text-ink mt-1">{products.length}</div>
        </div>
        <div className="bg-white border border-line-card rounded-[16px] px-5 py-[18px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft">Disponíveis</div>
          <div className="font-serif text-[34px] text-sage-deep mt-1">{disponiveis}</div>
        </div>
        <div className="bg-white border border-line-card rounded-[16px] px-5 py-[18px]">
          <div className="text-[11px] tracking-[0.16em] uppercase text-muted-soft">
            Sob encomenda
          </div>
          <div className="font-serif text-[34px] text-[#B08D4F] mt-1">{sobEncomenda}</div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D8D0BC] rounded-[18px] px-5 py-[60px] text-center">
          <div className="font-serif italic text-[24px] text-muted">
            Nenhuma bolsa por aqui ainda
          </div>
          <p className="text-[14px] text-muted-soft mt-2">Cadastre a primeira peça do ateliê.</p>
          <Link
            href="/area-da-nic/painel/nova"
            className="btn-pill inline-block mt-5 bg-sage text-cream px-[26px] py-[13px] !text-[12px]"
          >
            + Nova bolsa
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
