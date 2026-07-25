import Hero from "@/components/home/Hero";
import FeaturedSection from "@/components/home/FeaturedSection";
import AtelierStrip from "@/components/home/AtelierStrip";
import CustomCta from "@/components/home/CustomCta";
import { getHeroProduct } from "@/lib/products";

// Featured products come from the DB; revalidate periodically.
export const revalidate = 60;

export default async function HomePage() {
  const heroBag = await getHeroProduct();
  return (
    <>
      <Hero heroBag={heroBag} />
      <FeaturedSection />
      <AtelierStrip />
      <CustomCta />
    </>
  );
}
