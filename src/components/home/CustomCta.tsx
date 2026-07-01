import Link from "next/link";

export default function CustomCta() {
  return (
    <section className="relative px-[clamp(20px,5vw,64px)] py-[clamp(70px,9vw,130px)] bg-sand">
      <div
        data-reveal
        className="relative max-w-[1100px] mx-auto bg-sage-deep rounded-[28px] overflow-hidden p-[clamp(40px,6vw,80px)] text-center text-[#F3F0E4]"
      >
        <div className="text-[12px] tracking-[0.34em] uppercase text-sage-pale mb-[18px]">
          Sob medida
        </div>
        <h2 className="font-serif font-medium text-[clamp(34px,5vw,64px)] leading-[1.02]">
          Vamos criar algo
          <br />
          que é só seu?
        </h2>
        <p className="mt-[22px] mx-auto max-w-[480px] text-[16px] leading-[1.8] text-[#E3E2CF] font-light">
          Formato, cores e tamanho pensados com você. Um passo a passo simples — a Nic responde em
          até 48h com esboço, valor e prazo.
        </p>
        <Link
          href="/sob-medida"
          className="btn-pill inline-block mt-[34px] bg-cream text-ink px-10 py-[17px] hover:-translate-y-[3px] transition-transform"
        >
          Começar minha encomenda
        </Link>
      </div>
    </section>
  );
}
