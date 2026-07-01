type Review = {
  quote: string;
  name: string;
  location: string;
  dark?: boolean;
  delay?: number;
  swatch: string;
  starColor: string;
};

const REVIEWS: Review[] = [
  {
    quote:
      "Minha bolsa Margarida virou meu xodó. Todo mundo pergunta onde comprei — e ninguém acredita que é crochê.",
    name: "Marina L.",
    location: "São Paulo, SP",
    swatch: "repeating-linear-gradient(40deg,#9AA86E 0 6px,#8B9A60 6px 12px)",
    starColor: "#C9A85B",
  },
  {
    quote:
      "Encomendei sob medida para o casamento da minha irmã. A Nic entendeu exatamente o que eu queria. Chorei quando chegou.",
    name: "Bia R.",
    location: "Belo Horizonte, MG",
    dark: true,
    delay: 100,
    swatch: "repeating-linear-gradient(40deg,#C9AE7E 0 6px,#BC9E6A 6px 12px)",
    starColor: "#E7D79A",
  },
  {
    quote:
      "Qualidade de outro nível. Dá pra sentir o cuidado em cada ponto. Já é a terceira que compro.",
    name: "Clara M.",
    location: "Curitiba, PR",
    delay: 200,
    swatch: "repeating-linear-gradient(40deg,#AEB985 0 6px,#97A56C 6px 12px)",
    starColor: "#C9A85B",
  },
];

export default function Reviews() {
  return (
    <section
      id="depoimentos"
      className="relative scroll-mt-[64px] px-[clamp(20px,5vw,64px)] py-[clamp(70px,9vw,130px)] bg-cream overflow-hidden"
    >
      <div data-reveal className="text-center mb-[54px]">
        <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-4">Quem levou, amou</div>
        <h2 className="font-serif font-medium text-[clamp(36px,5vw,68px)] leading-none text-ink">
          Cartinhas do coração
        </h2>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-[clamp(18px,2.2vw,28px)] max-w-[1180px] mx-auto">
        {REVIEWS.map((r) => (
          <figure
            key={r.name}
            data-reveal
            {...(r.delay ? { "data-delay": String(r.delay) } : {})}
            className={
              r.dark
                ? "bg-sage-deep rounded-[20px] p-[34px_30px] text-[#F3F0E4]"
                : "bg-sand border border-line-card rounded-[20px] p-[34px_30px]"
            }
          >
            <div className="tracking-[3px] text-[16px] mb-4" style={{ color: r.starColor }}>
              ★★★★★
            </div>
            <blockquote
              className={`font-serif italic text-[22px] leading-[1.4] ${r.dark ? "" : "text-ink"}`}
            >
              &ldquo;{r.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                className="w-[42px] h-[42px] rounded-full flex-none"
                style={{ background: r.swatch }}
              />
              <span>
                <span className={`block font-semibold ${r.dark ? "" : "text-ink"}`}>{r.name}</span>
                <span
                  className={`text-[12px] tracking-[0.1em] ${r.dark ? "text-sage-pale" : "text-muted-soft"}`}
                >
                  {r.location}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
