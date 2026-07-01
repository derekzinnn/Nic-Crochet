import type { Metadata } from "next";
import CustomWizard from "@/components/custom/CustomWizard";

export const metadata: Metadata = {
  title: "Sob medida",
  description:
    "Crie sua bolsa de crochê sob medida com a Nic: formato, cores e tamanho pensados com você. A Nic responde em até 48h com esboço, valor e prazo.",
};

export default function SobMedidaPage() {
  return (
    <section className="relative min-h-screen px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-sand">
      <div className="max-w-[680px] mx-auto">
        <div className="text-center mb-[30px]">
          <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-[14px]">
            Encomenda sob medida
          </div>
          <h1 className="font-serif font-normal text-[clamp(36px,5vw,62px)] leading-none text-ink">
            Sua bolsa, do seu jeito
          </h1>
        </div>
        <CustomWizard />
      </div>
    </section>
  );
}
