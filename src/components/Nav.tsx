"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useCart, selectCount } from "@/components/cart/cart-store";

const LINKS = [
  { href: "/colecao", label: "Coleção" },
  { href: "/sob-medida", label: "Sob medida" },
  { href: "/#depoimentos", label: "Depoimentos" },
];

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart(selectCount);
  const hydrated = useCart((s) => s.hydrated);
  const toggleCart = useCart((s) => s.toggle);

  const isHome = pathname === "/";
  const solid = scrolled || !isHome;

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  const badge = hydrated ? count : 0;

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[90] flex items-center justify-between h-[68px] px-[clamp(18px,5vw,64px)] backdrop-blur-[12px] border-b transition-[background-color,border-color] [transition-duration:400ms]"
        style={{
          background: solid ? "rgba(246,242,233,.9)" : "rgba(246,242,233,0)",
          borderColor: solid ? "rgba(201,191,166,.6)" : "rgba(201,191,166,0)",
        }}
      >
        <Logo />

        {/* desktop */}
        <div className="hidden min-[881px]:flex items-center gap-[clamp(16px,2.4vw,36px)]">
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
          <button
            onClick={toggleCart}
            className="relative flex items-center gap-2 bg-ink text-cream rounded-pill px-[18px] py-[10px] text-[12px] tracking-[0.1em] uppercase hover:-translate-y-[2px] hover:bg-sage transition-[transform,background-color] duration-300"
          >
            Sacola
            <span className="inline-grid place-items-center min-w-[20px] h-[20px] px-[5px] bg-sage text-cream rounded-[20px] text-[11px] font-bold">
              {badge}
            </span>
          </button>
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
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="grid place-items-center w-[42px] h-[42px] bg-transparent border border-line rounded-full text-ink text-[17px]"
          >
            ≡
          </button>
        </div>
      </nav>

      {/* mobile fullscreen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[95] bg-sand flex flex-col px-[clamp(24px,7vw,40px)] pt-[84px] pb-10 animate-fadeUp">
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
            className="absolute top-[18px] right-5 w-[42px] h-[42px] rounded-full border border-line bg-transparent text-ink text-[18px]"
          >
            ✕
          </button>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-serif text-[38px] text-ink py-[14px] border-b border-line-soft"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/area-da-nic"
            className="font-serif italic text-[24px] text-sage py-5"
          >
            Área da Nic →
          </Link>
        </div>
      )}
    </>
  );
}
