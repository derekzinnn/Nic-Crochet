import Link from "next/link";

export default function ComingSoon({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <section className="relative min-h-screen grid place-items-center px-[clamp(20px,5vw,64px)] pt-[108px] pb-[90px] bg-sand text-center">
      <div className="max-w-[520px]">
        <div className="text-[12px] tracking-[0.34em] uppercase text-sage mb-4">{eyebrow}</div>
        <h1 className="font-serif font-normal text-[clamp(36px,5vw,64px)] leading-none text-ink">
          {title}
        </h1>
        <p className="mt-5 text-[15px] leading-[1.7] text-muted font-light">{note}</p>
        <Link
          href="/"
          className="btn-pill inline-block mt-8 bg-ink text-cream px-7 py-[14px] hover:bg-sage"
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
