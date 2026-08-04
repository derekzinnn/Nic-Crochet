import Link from "next/link";
import { getLatestProducts } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";

/** Newest pieces first. Desktop shows 5; phones/tablets show the first 3. */
const DESKTOP_COUNT = 5;
const COMPACT_COUNT = 3;

export default async function FeaturedSection() {
  const featured = await getLatestProducts(DESKTOP_COUNT);

  return (
    <section className="relative px-[clamp(20px,5vw,64px)] py-[clamp(70px,9vw,130px)] bg-cream">
      <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
        <div data-reveal>
          <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-4">Destaques</div>
          <h2 className="font-serif font-medium text-[clamp(36px,5vw,68px)] leading-none text-ink">
            As mais queridas
            <br />
            do ateliê
          </h2>
        </div>
        <Link
          href="/colecao"
          data-reveal
          className="btn-pill bg-transparent text-ink border border-line px-7 py-[14px] !text-[12px] hover:border-sage hover:text-sage whitespace-nowrap"
        >
          Ver coleção completa →
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] min-[1100px]:grid-cols-5 gap-[clamp(18px,2.4vw,34px)]">
        {featured.map((p, i) => (
          // Below the 5-column breakpoint only the first 3 stay on screen.
          <div key={p.id} className={i >= COMPACT_COUNT ? "max-[1099px]:hidden" : undefined}>
            <ProductCard product={p} reveal />
          </div>
        ))}
      </div>
    </section>
  );
}
