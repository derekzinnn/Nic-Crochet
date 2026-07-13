import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Área da Nic",
  robots: { index: false, follow: false },
};

export default async function AreaDaNicPage() {
  const session = await getSession();
  if (session) redirect("/area-da-nic/painel");

  return (
    <section className="min-h-screen grid place-items-center bg-panel px-5 py-10">
      <div className="w-[min(400px,100%)]">
        <div className="text-center mb-[26px]">
          <span className="inline-grid place-items-center w-[56px] h-[56px] border-[1.5px] border-sage rounded-full text-sage font-serif text-[28px] italic">
            n
          </span>
          <h1 className="font-serif font-medium text-[36px] text-ink mt-[14px]">Área da Nic</h1>
          <p className="text-[13px] text-muted-soft mt-[6px]">Entre para gerenciar o ateliê.</p>
        </div>

        <LoginForm />

        <Link
          href="/"
          className="block mx-auto mt-[18px] w-fit bg-transparent text-muted-soft text-[13px] hover:text-sage transition-colors"
        >
          ← Voltar ao site
        </Link>
      </div>
    </section>
  );
}
