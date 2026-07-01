import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { priceLabel } from "@/lib/format";
import { PRODUCT_STATUS_LABEL } from "@/lib/types";
import ProductMedia from "@/components/product/ProductMedia";
import AddToCartButton from "@/components/product/AddToCartButton";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Peça não encontrada" };
  return {
    title: product.name,
    description: product.description,
    openGraph: product.photos[0] ? { images: [product.photos[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const fromPrefix = product.category === "Custom" || product.status === "MADE_TO_ORDER";

  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-sand">
      <div className="max-w-[960px] mx-auto">
        <Link
          href="/colecao"
          className="inline-block mb-6 text-[13px] text-muted hover:text-sage transition-colors"
        >
          ← Voltar para a coleção
        </Link>

        <div className="grid grid-cols-1 min-[721px]:grid-cols-2 bg-cream rounded-[24px] overflow-hidden shadow-[0_50px_110px_-40px_rgba(0,0,0,.5)]">
          <div className="relative min-h-[340px] min-[721px]:min-h-full aspect-[16/10] min-[721px]:aspect-auto">
            <ProductMedia
              name={product.name}
              photo={product.photos[0]}
              colorPrimary={product.colorPrimary}
              colorSecondary={product.colorSecondary}
              variant="modal"
              priority
              sizes="(max-width: 720px) 100vw, 480px"
            />
          </div>

          <div className="relative p-[clamp(26px,3vw,44px)]">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] tracking-[0.2em] uppercase text-sage">
                {product.category}
              </span>
              <span className="text-[11px] tracking-[0.12em] uppercase text-muted-faint">
                · {PRODUCT_STATUS_LABEL[product.status]}
              </span>
            </div>
            <h1 className="font-serif font-medium text-[clamp(30px,3.4vw,46px)] leading-none text-ink">
              {product.name}
            </h1>
            <div className="font-serif text-[30px] text-sage-deep mt-[14px]">
              {priceLabel(product.priceCents, fromPrefix)}
            </div>
            <p className="mt-5 text-[15px] leading-[1.75] text-muted font-light">
              {product.description}
            </p>

            {product.details.length > 0 && (
              <div className="mt-6 flex flex-col gap-[10px]">
                {product.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-[11px] text-[14px] text-muted-nav">
                    <span className="w-[6px] h-[6px] rounded-full bg-sage flex-none" />
                    {d}
                  </div>
                ))}
              </div>
            )}

            <AddToCartButton product={product} />
            <p className="mt-[14px] text-center text-[12px] text-muted-soft">
              Peça única · feita à mão · pode levar algumas semanas
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
