"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useCart, selectCount } from "@/components/cart/cart-store";

const LINKS = [
  { href: "/colecao", label: "Coleção" },
  { href: "/sob-medida", label: "Sob medida" },
];

const NAV_EASE = "cubic-bezier(.2,.8,.2,1)";

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart(selectCount);
  const hydrated = useCart((s) => s.hydrated);
  const toggleCart = useCart((s) => s.toggle);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the menu popover whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  // The admin area has its own shell — no storefront chrome.
  if (pathname.startsWith("/area-da-nic")) return null;

  const badge = hydrated ? count : 0;

  const menuItem =
    "block text-[14px] text-ink px-[14px] py-3 rounded-[12px] cursor-pointer hover:bg-[#F0EAD9] transition-colors";

  return (
    <>
      <nav
        className="fixed left-1/2 -translate-x-1/2 z-[90] flex items-center justify-between backdrop-blur-[12px] border"
        style={{
          top: scrolled ? 12 : 0,
          width: scrolled ? "min(880px, calc(100% - 28px))" : "100%",
          height: scrolled ? 56 : 68,
          padding: scrolled ? "0 10px 0 24px" : "0 clamp(18px,5vw,64px)",
          borderRadius: scrolled ? 44 : 0,
          background: scrolled
            ? "rgba(251,248,241,.92)"
            : isHome
              ? "rgba(246,242,233,0)"
              : "rgba(246,242,233,.9)",
          borderColor: scrolled ? "rgba(201,191,166,.7)" : "rgba(201,191,166,0)",
          boxShadow: scrolled ? "0 14px 44px -20px rgba(59,58,46,.4)" : "none",
          transition: `top .45s ${NAV_EASE}, width .45s ${NAV_EASE}, height .45s ${NAV_EASE}, padding .45s ${NAV_EASE}, border-radius .45s ${NAV_EASE}, background .4s ease, border-color .4s ease, box-shadow .4s ease`,
        }}
      >
        <Logo compact={scrolled} />

        {/* desktop */}
        <div className="hidden min-[881px]:flex items-center gap-[clamp(14px,2vw,30px)]">
          {!scrolled && (
            <div className="flex items-center gap-[clamp(16px,2.4vw,36px)]">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13px] tracking-[0.08em] uppercase text-muted-nav hover:text-sage transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/area-da-nic"
                title="Área da Nic"
                className="grid place-items-center w-[34px] h-[34px] rounded-full border border-line text-sage hover:border-sage hover:bg-[#EFEADB] transition-colors text-[14px]"
              >
                ⚲
              </Link>
            </div>
          )}
          <button
            onClick={toggleCart}
            className="relative flex items-center gap-2 bg-ink text-cream rounded-pill px-[18px] py-[10px] text-[12px] tracking-[0.1em] uppercase hover:-translate-y-[2px] hover:bg-sage transition-[transform,background-color] duration-300"
          >
            Sacola
            <span className="inline-grid place-items-center min-w-[20px] h-[20px] px-[5px] bg-sage text-cream rounded-[20px] text-[11px] font-bold">
              {badge}
            </span>
          </button>
          {scrolled && (
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Abrir menu"
              className="grid place-items-center w-10 h-10 bg-transparent border border-line rounded-full text-ink text-[16px] p-0 hover:border-sage hover:text-sage transition-colors"
            >
              ≡
            </button>
          )}
        </div>

        {/* mobile */}
        <div className="flex min-[881px]:hidden items-center gap-[10px]">
          <button
            onClick={toggleCart}
            aria-label="Abrir sacola"
            className="relative grid place-items-center w-[42px] h-[42px] bg-ink text-cream rounded-full text-[16px]"
          >
            ⛌
            <span className="absolute -top-[3px] -right-[3px] inline-grid place-items-center min-w-[18px] h-[18px] px-[4px] bg-sage text-cream rounded-[20px] text-[10px] font-bold">
              {badge}
            </span>
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Abrir menu"
            className="grid place-items-center w-[42px] h-[42px] bg-transparent border border-line rounded-full text-ink text-[17px]"
          >
            ≡
          </button>
        </div>
      </nav>

      {/* menu popover */}
      {menuOpen && (
        <div className="fixed inset-0 z-[95]">
          <div onClick={() => setMenuOpen(false)} className="absolute inset-0" />
          <div
            className="absolute w-[220px] bg-cream border border-line-soft rounded-[18px] shadow-[0_24px_60px_-24px_rgba(59,58,46,.4)] p-2 animate-scaleIn origin-top-right"
            style={{
              top: 76,
              right: scrolled ? "max(24px, calc(50% - 430px))" : "clamp(18px,5vw,64px)",
            }}
          >
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={menuItem}>
                {l.label}
              </Link>
            ))}
            <div className="h-px bg-[#EDE6D4] mx-[10px] my-[6px]" />
            <Link href="/area-da-nic" className={`${menuItem} italic !text-sage`}>
              Área da Nic →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
