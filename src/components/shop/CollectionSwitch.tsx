"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OPTIONS = [
  { href: "/colecao", label: "Bolsas" },
  { href: "/roupas", label: "Roupas" },
];

/**
 * Pill switch to hop between the Bolsas and Roupas collections. Rendered inline
 * at the top of the collection pages (centered); the active side is highlighted.
 */
export default function CollectionSwitch() {
  const pathname = usePathname();

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-pill bg-[rgba(251,248,241,.92)] border border-line/70 shadow-[0_16px_44px_-18px_rgba(59,58,46,.35)]">
      {OPTIONS.map((o) => {
        const active = pathname === o.href || pathname.startsWith(`${o.href}/`);
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={active}
            className={`rounded-pill px-5 py-[9px] text-[12px] tracking-[0.1em] uppercase transition-colors ${
              active ? "bg-ink text-cream" : "text-muted-nav hover:text-ink"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
