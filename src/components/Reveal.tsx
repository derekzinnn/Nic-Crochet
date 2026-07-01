"use client";

import { useEffect } from "react";

/**
 * Recreates the prototype's motion system:
 *  - elements with [data-reveal] fade + slide up when scrolled into view
 *  - elements with [data-parallax] drift on scroll
 * Mounted once in the root layout. Respects prefers-reduced-motion.
 */
export default function Reveal() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    document.documentElement.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute("data-seen", "1");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    const scan = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-seen])").forEach((el) => {
        const delay = Number(el.getAttribute("data-delay") ?? 0);
        el.style.transitionDelay = `${delay}ms`;
        io.observe(el);
      });
    scan();
    const scanInt = window.setInterval(scan, 700);

    const parallaxEls = () => document.querySelectorAll<HTMLElement>("[data-parallax]");
    const onScroll = () => {
      const y = window.scrollY || 0;
      parallaxEls().forEach((el) => {
        const s = parseFloat(el.getAttribute("data-parallax") || "0");
        el.style.transform = `translate3d(0, ${y * s}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.clearInterval(scanInt);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return null;
}
