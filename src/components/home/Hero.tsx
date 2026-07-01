import Link from "next/link";

export default function Hero() {
  return (
    <header className="relative min-h-screen grid grid-cols-1 min-[881px]:grid-cols-[1.1fr_0.9fr] items-center gap-[clamp(40px,6vw,90px)] px-[clamp(20px,5vw,72px)] pt-[120px] min-[881px]:pt-[160px] pb-[60px] min-[881px]:pb-[100px] bg-sand text-center min-[881px]:text-left">
      <div className="relative max-w-[640px] mx-auto min-[881px]:mx-0">
        <div
          data-reveal
          className="text-[12px] tracking-[0.32em] uppercase text-sage mb-7"
        >
          Feito à mão · um ponto de cada vez
        </div>
        <h1
          data-reveal
          className="font-serif font-normal text-[clamp(48px,7vw,104px)] leading-none tracking-[-0.015em] text-ink"
        >
          Bolsas tecidas
          <br />
          com <span className="italic text-sage">tempo</span>.
        </h1>
        <p
          data-reveal
          className="mt-8 text-[clamp(15px,1.3vw,18px)] leading-[1.75] text-muted max-w-[420px] font-light mx-auto min-[881px]:mx-0"
        >
          Peças únicas em crochê, criadas no ateliê da Nic. Fios naturais e formas atemporais.
        </p>
        <div
          data-reveal
          className="flex flex-wrap gap-[14px] mt-10 justify-center min-[881px]:justify-start"
        >
          <Link
            href="/colecao"
            className="btn-pill bg-ink text-cream px-[34px] py-4 hover:bg-sage"
          >
            Ver a coleção
          </Link>
          <Link
            href="/sob-medida"
            className="btn-pill bg-transparent text-ink border border-line px-[34px] py-4 hover:border-sage hover:text-sage"
          >
            Sob medida
          </Link>
        </div>
      </div>

      <div
        data-reveal
        className="relative w-full aspect-[4/5] max-h-[52vh] min-[881px]:max-h-[74vh] rounded-[300px_300px_16px_16px] overflow-hidden bg-sage-tint mx-auto"
      >
        <span className="absolute left-1/2 bottom-6 -translate-x-1/2 font-sans text-[10px] tracking-[0.28em] uppercase text-cream/80 whitespace-nowrap">
          foto principal
        </span>
      </div>
    </header>
  );
}
