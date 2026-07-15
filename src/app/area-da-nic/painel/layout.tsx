import Link from "next/link";
import { logoutAction } from "@/app/area-da-nic/actions";
import { getNewOrdersCount } from "@/lib/admin-data";
import PainelTabs from "@/components/admin/PainelTabs";

/** Shared admin shell: sticky "Painel da Nic" bar over a light panel background. */
export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const newOrders = await getNewOrdersCount();
  return (
    <div className="min-h-screen bg-panel">
      <header className="nc-blur sticky top-0 z-50 flex items-center justify-between gap-[14px] px-[clamp(20px,4vw,40px)] h-[62px] bg-[rgba(251,248,241,.94)] backdrop-blur-[10px] border-b border-line-card">
        <div className="flex items-center gap-[10px]">
          <span className="grid place-items-center w-[34px] h-[34px] border-[1.5px] border-sage rounded-full text-sage font-serif text-[18px] italic">
            n
          </span>
          <span className="leading-none">
            <span className="block font-serif text-[18px] font-semibold text-ink">
              Painel da Nic
            </span>
            <span className="block text-[9px] tracking-[0.3em] uppercase text-muted-soft mt-[2px]">
              ateliê nic crochet
            </span>
          </span>
        </div>
        <div className="flex items-center gap-[10px]">
          <Link
            href="/"
            className="bg-transparent text-muted-nav border border-line-input rounded-pill px-[18px] py-[9px] text-[12px] tracking-[0.06em] hover:border-sage hover:text-sage transition-colors"
          >
            Ver site
          </Link>
          <form action={logoutAction}>
            <button className="bg-transparent text-muted-soft px-[6px] py-[9px] text-[12px] tracking-[0.06em] hover:text-[#C06A4A] transition-colors">
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-[1020px] mx-auto px-[clamp(20px,4vw,40px)] pt-[28px] pb-[90px]">
        <PainelTabs newOrders={newOrders} />
        {children}
      </div>
    </div>
  );
}
