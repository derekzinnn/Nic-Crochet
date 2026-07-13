import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getProductById } from "@/lib/products";
import { draftFromProduct } from "@/lib/product-form";
import ProductWizard from "@/components/admin/ProductWizard";

export const metadata: Metadata = {
  title: "Editar bolsa",
  robots: { index: false, follow: false },
};

export default async function EditarBolsaPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/area-da-nic/painel"
        className="text-[13px] text-muted-soft hover:text-sage transition-colors"
      >
        ← Suas bolsas
      </Link>
      <h1 className="font-serif font-medium text-[clamp(30px,4vw,42px)] text-ink mt-2 mb-5">
        Editar bolsa
      </h1>
      <ProductWizard mode="edit" productId={product.id} initial={draftFromProduct(product)} />
    </div>
  );
}
