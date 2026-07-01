import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { logoutAction } from "@/app/area-da-nic/actions";
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

        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h2 className="font-serif text-[22px] text-cloud">Suas bolsas</h2>
          <Link
            href="/area-da-nic/painel/nova"
            className="btn-pill bg-sage text-cream px-[22px] py-[12px] !text-[12px] hover:bg-sage-light"
          >
            + Nova bolsa
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-panel-card border border-panel-line rounded-[16px] px-6 py-12 text-center">
            <div className="font-serif italic text-[22px] text-cloud">Nenhuma bolsa ainda</div>
            <p className="text-[14px] text-muted-faint mt-2">
              Cadastre sua primeira peça para ela aparecer na loja.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {products.map((p) => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
