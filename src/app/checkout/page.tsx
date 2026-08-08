import type { Metadata } from "next";
import CheckoutFlow from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="min-h-screen bg-cream px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px]">
      <div className="max-w-[1000px] mx-auto">
        <CheckoutFlow />
      </div>
    </section>
  );
}
