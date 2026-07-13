import type { Metadata } from "next";
import Link from "next/link";
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
    <div>
      <Link
        href="/area-da-nic/painel"
        className="text-[13px] text-muted-soft hover:text-sage transition-colors"
      >
        ← Suas bolsas
      </Link>
      <h1 className="font-serif font-medium text-[clamp(30px,4vw,42px)] text-ink mt-2 mb-5">
        Nova bolsa
      </h1>
      <ProductWizard mode="create" initial={emptyDraft} />
    </div>
  );
}
