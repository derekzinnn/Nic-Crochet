import Hero from "@/components/home/Hero";
import FeaturedSection from "@/components/home/FeaturedSection";
import AtelierStrip from "@/components/home/AtelierStrip";
import CustomCta from "@/components/home/CustomCta";

// Featured products come from the DB; revalidate periodically.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedSection />
      <AtelierStrip />
      <CustomCta />
    </>
  );
}
