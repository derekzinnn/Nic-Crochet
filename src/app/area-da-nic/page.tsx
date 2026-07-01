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
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-panel">
      <div className="max-w-[400px] mx-auto mt-10">
        <div className="text-center mb-[30px]">
          <span className="inline-grid place-items-center w-[56px] h-[56px] border-[1.5px] border-sage-light rounded-full text-sage-light font-serif text-[28px] italic mb-4">
            n
          </span>
          <h1 className="font-serif font-normal text-[38px] text-cream">Área da Nic</h1>
          <p className="text-[13px] text-muted-faint mt-2">Entre para gerenciar suas bolsas.</p>
        </div>

        <LoginForm />

        <Link
          href="/"
          className="block mx-auto mt-[18px] w-fit bg-transparent text-muted-faint text-[13px] hover:text-cloud transition-colors"
        >
          ← Voltar ao site
        </Link>
      </div>
    </section>
  );
}
