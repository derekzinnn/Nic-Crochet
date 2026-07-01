"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Drives the `q` URL param (server-side filtering) with a debounce, so the
 * result page stays shareable/SEO-friendly while typing feels live.
 */
export default function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qParam = searchParams.get("q") ?? "";

  const [value, setValue] = useState(qParam);
  const firstRun = useRef(true);

  // Keep local state in sync when the URL changes externally (e.g. "Limpar busca").
  useEffect(() => setValue(qParam), [qParam]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value) params.set("q", value);
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
    // Only re-run on typed value changes; searchParams intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 min-w-[240px] max-w-[440px]">
      <span className="absolute left-[18px] top-1/2 -translate-y-1/2 text-muted-faint text-[15px]">
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nome — ex: Margarida, clutch..."
        aria-label="Buscar peças"
        className="w-full bg-white border border-line-input rounded-pill py-[14px] pr-[18px] pl-[44px] font-sans text-[15px] text-ink outline-none focus:border-sage"
      />
    </div>
  );
}
