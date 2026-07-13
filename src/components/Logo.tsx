import Link from "next/link";

/**
 * The "n" monogram + "nic crochet / feito à mão" wordmark from the prototype.
 * `compact` (pill nav state) hides the badge and the subtitle, keeping only
 * the wordmark — matching the scrolled nav in the design.
 */
export default function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-[11px] no-underline">
      <span
        className={`${compact ? "hidden" : "grid"} place-items-center w-10 h-10 rounded-full border-[1.5px] border-sage text-sage font-serif text-[21px] font-semibold italic`}
      >
        n
      </span>
      <span className="leading-none">
        <span className="block font-serif text-[22px] font-semibold tracking-[0.02em] text-ink">
          nic crochet
        </span>
        <span
          className={`${compact ? "hidden" : "block"} text-[9px] tracking-[0.4em] uppercase text-muted-soft mt-[2px] pl-[2px]`}
        >
          feito à mão
        </span>
      </span>
    </Link>
  );
}
