export default function AtelierStrip() {
  return (
    <section className="relative px-[clamp(20px,5vw,64px)] py-[clamp(80px,11vw,150px)] bg-sage-deep text-[#F3F0E4] overflow-hidden">
      <div
        data-parallax="0.05"
        className="absolute -top-[90px] right-[6%] w-[340px] h-[340px] rounded-full"
        style={{ background: "radial-gradient(circle at 38% 32%, rgba(255,255,255,.18), transparent 62%)" }}
      />
      <div className="relative z-[2] grid grid-cols-1 min-[881px]:grid-cols-2 gap-[clamp(36px,6vw,90px)] items-center">
        <div data-reveal>
          <div className="text-[12px] tracking-[0.34em] uppercase text-sage-pale mb-[22px]">
            No ateliê da Nic
          </div>
          <h2 className="font-serif font-medium text-[clamp(32px,4.4vw,58px)] leading-[1.04]">
            Olá, eu sou a Nic.
            <br />
            Faço bolsas que duram
            <br />
            mais que modas.
          </h2>
          <p className="mt-[26px] text-[16px] leading-[1.8] text-[#E3E2CF] font-light max-w-[460px]">
            Comecei o crochê na varanda de casa, com um novelo herdado da minha avó. Hoje cada bolsa
            nasce do mesmo lugar: tempo, paciência e a vontade de fazer algo que ninguém mais tem
            igual.
          </p>
          <div className="flex gap-[14px] mt-[34px] items-center">
            <div className="font-serif italic text-[34px] text-cream">~ Nic</div>
            <div className="h-px w-[60px] bg-white/40" />
            <div className="text-[12px] tracking-[0.2em] uppercase text-sage-pale">
              fundadora &amp; artesã
            </div>
          </div>
        </div>

        <div
          data-reveal
          data-delay="120"
          className="relative aspect-[5/6] rounded-[180px_18px_180px_18px] overflow-hidden shadow-[0_40px_90px_-40px_rgba(0,0,0,.5)]"
        >
          <div
            className="absolute inset-0"
            style={{ background: "repeating-linear-gradient(46deg, #C9AE7E 0 14px, #BC9E6A 14px 28px)" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,.2), transparent 55%)" }}
          />
          <span className="absolute left-1/2 bottom-[22px] -translate-x-1/2 text-[10px] tracking-[0.28em] uppercase text-white/85 whitespace-nowrap">
            [ retrato — Nic no ateliê ]
          </span>
        </div>
      </div>
    </section>
  );
}
