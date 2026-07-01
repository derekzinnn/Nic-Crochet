import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { emptyDraft } from "@/lib/product-form";
import ProductWizard from "@/components/admin/ProductWizard";

export const metadata: Metadata = {
  title: "Nova bolsa",
  robots: { index: false, follow: false },
};

export default async function NovaBolsaPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-panel">
      <div className="max-w-[920px] mx-auto">
        <div className="mb-[30px]">
          <div className="text-[12px] tracking-[0.28em] uppercase text-sage-light">Painel</div>
          <h1 className="font-serif font-normal text-[clamp(30px,4vw,46px)] text-cream mt-1">
            Cadastrar nova bolsa
          </h1>
        </div>
        <ProductWizard mode="create" initial={emptyDraft} />
      </div>
    </section>
  );
}
