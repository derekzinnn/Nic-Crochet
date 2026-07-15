"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; match: (p: string) => boolean }[] = [
  {
    href: "/area-da-nic/painel",
    label: "Bolsas",
    match: (p) =>
      p === "/area-da-nic/painel" ||
      p.startsWith("/area-da-nic/painel/nova") ||
      /\/painel\/[^/]+\/editar/.test(p),
  },
  {
    href: "/area-da-nic/painel/encomendas",
    label: "Encomendas",
    match: (p) => p.startsWith("/area-da-nic/painel/encomendas"),
  },
  {
    href: "/area-da-nic/painel/agenda",
    label: "Agenda",
    match: (p) => p.startsWith("/area-da-nic/painel/agenda"),
  },
];

export default function PainelTabs({ newOrders = 0 }: { newOrders?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-line-card mb-8">
      {TABS.map((t) => {
        const active = t.match(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative -mb-px px-4 py-3 text-[13px] tracking-[0.06em] uppercase border-b-2 transition-colors ${
              active
                ? "border-sage text-ink font-semibold"
                : "border-transparent text-muted-soft hover:text-ink"
            }`}
          >
            {t.label}
            {t.label === "Encomendas" && newOrders > 0 && (
              <span className="ml-2 inline-grid place-items-center min-w-[18px] h-[18px] px-[5px] bg-sage text-cream rounded-full text-[10px] font-bold align-middle">
                {newOrders}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
