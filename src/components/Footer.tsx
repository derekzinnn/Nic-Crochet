import Link from "next/link";
import { siteConfig, instagramUrl, whatsappLink } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="relative bg-ink text-cloud px-[clamp(20px,5vw,64px)] pt-[clamp(60px,8vw,100px)] pb-9 overflow-hidden">
      <div className="absolute -top-[60px] left-1/2 -translate-x-1/2 font-serif italic text-[clamp(80px,18vw,240px)] text-white/[0.04] whitespace-nowrap pointer-events-none select-none">
        nic crochet
      </div>

      <div className="nc-footer-grid relative z-[2] grid grid-cols-[1.4fr_1fr_1fr] gap-10 pb-[50px] border-b border-white/[0.12] max-[520px]:grid-cols-1 max-[520px]:gap-[30px]">
        <div>
          <div className="flex items-center gap-3 mb-[18px]">
            <span className="grid place-items-center w-[42px] h-[42px] rounded-full border-[1.5px] border-sage-light text-sage-light font-serif text-[22px] italic">
              n
            </span>
            <span className="font-serif text-[24px] text-cream">nic crochet</span>
          </div>
          <p className="max-w-[320px] text-[15px] leading-[1.7] text-[#B7B6A0] font-light">
            Bolsas de crochê feitas à mão, uma de cada vez, no interior — com fios naturais e muito
            tempo.
          </p>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.24em] uppercase text-sage mb-[18px]">Navegar</div>
          <div className="flex flex-col gap-[11px]">
            <Link href="/colecao" className="text-[#D9D8C4] text-[15px] hover:text-cream transition-colors">
              Coleção
            </Link>
            <Link href="/sob-medida" className="text-[#D9D8C4] text-[15px] hover:text-cream transition-colors">
              Sob medida
            </Link>
          </div>
        </div>

        <div>
          <div className="text-[11px] tracking-[0.24em] uppercase text-sage mb-[18px]">
            Encontre a Nic
          </div>
          <div className="flex flex-col gap-[11px]">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D9D8C4] text-[15px] hover:text-cream transition-colors"
            >
              @{siteConfig.instagramHandle.replace(/^@/, "")}
            </a>
            <a
              href={whatsappLink("Olá, Nic! Vim pelo site 🌿")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D9D8C4] text-[15px] hover:text-cream transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="text-[#D9D8C4] text-[15px] hover:text-cream transition-colors"
            >
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-[2] flex justify-between flex-wrap gap-3 pt-6 text-[12px] tracking-[0.08em] text-[#8B8A76]">
        <span>© {new Date().getFullYear()} nic crochet · feito à mão, com amor</span>
        <span>Cada ponto, uma história.</span>
      </div>
    </footer>
  );
}
