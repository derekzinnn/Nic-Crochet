"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Hero photos of the featured bag. Photos are stacked (preloaded) and
 * auto-rotate with a slow crossfade; the whole frame links to the product.
 */
export default function HeroGallery({
  photos,
  slug,
  name,
}: {
  photos: string[];
  slug: string;
  name: string;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % photos.length), 4500);
    return () => clearInterval(t);
  }, [photos.length]);

  return (
    <Link
      href={`/produto/${slug}`}
      aria-label={`Ver ${name}`}
      className="group relative block w-full aspect-[4/5] max-h-[52vh] min-[881px]:max-h-[74vh] rounded-[300px_300px_16px_16px] overflow-hidden bg-sage-tint mx-auto"
    >
      {photos.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt={name}
          fill
          {...(idx === 0 ? { priority: true } : { loading: "eager" as const })}
          sizes="(max-width: 880px) 90vw, 42vw"
          className={`object-cover transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-black/45 to-transparent" />
      <span className="absolute left-6 bottom-5 z-10 font-serif italic text-cream text-[22px] drop-shadow-[0_2px_10px_rgba(0,0,0,.5)]">
        {name}
      </span>

      {photos.length > 1 && (
        <div className="absolute right-6 bottom-6 z-10 flex items-center gap-[6px]">
          {photos.map((p, idx) => (
            <span
              key={p}
              className={`rounded-full transition-all ${
                idx === i ? "w-[16px] h-[5px] bg-cream" : "w-[5px] h-[5px] bg-cream/60"
              }`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
