import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { emptyDraft } from "@/lib/product-form";
import ProductWizard from "@/components/admin/ProductWizard";

export const metadata: Metadata = {
  title: "Nova peça",
  robots: { index: false, follow: false },
};

export default async function NovaBolsaPage() {
  const session = await getSession();
  if (!session) redirect("/area-da-nic");

  return <ProductWizard mode="create" initial={emptyDraft} />;
}
