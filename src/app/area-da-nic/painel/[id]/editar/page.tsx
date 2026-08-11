import type { Metadata } from "next";
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
    <ProductWizard mode="edit" productId={product.id} initial={draftFromProduct(product)} />
  );
}
