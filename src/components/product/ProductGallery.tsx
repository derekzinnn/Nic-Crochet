"use client";

import { useState } from "react";
import Image from "next/image";
import ProductMedia from "@/components/product/ProductMedia";

/**
 * Photo gallery for a bag. All photos are rendered stacked and toggled with
 * opacity (not by swapping a single <img> src), so every photo is preloaded and
 * switching is instant with a crossfade instead of a blank flash. Falls back to
 * the woven swatch when the bag has no photo. Render inside a `relative` box.
 */
export default function ProductGallery({
  name,
  photos,
  colorPrimary,
  colorSecondary,
  variant = "modal",
  priority = false,
  sizes,
}: {
  name: string;
  photos: string[];
  colorPrimary: string;
  colorSecondary: string;
  variant?: "card" | "modal" | "thumb";
  priority?: boolean;
  sizes?: string;
}) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="absolute inset-0">
        <ProductMedia
          name={name}
          photo={null}
          colorPrimary={colorPrimary}
          colorSecondary={colorSecondary}
          variant={variant}
        />
      </div>
    );
  }

  const many = photos.length > 1;
  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 grid place-items-center w-9 h-9 rounded-full " +
    "bg-cream/85 text-ink text-[18px] leading-none shadow-[0_6px_18px_-6px_rgba(59,58,46,.5)] " +
    "hover:bg-cream transition-colors";

  return (
    <div className="absolute inset-0">
      {photos.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={name}
          fill
          // Preload every photo (not lazy) so switching is instant, no blank flash.
          {...(i === 0 ? { priority } : { loading: "eager" as const })}
          sizes={sizes ?? "(max-width: 880px) 100vw, 450px"}
          // Already-optimized WebP from upload — stream straight from Supabase CDN
          // instead of paying a slow AVIF re-encode on the ARM VPS.
          unoptimized
          className={`object-cover transition-opacity duration-300 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {many && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Foto anterior"
            className={`${arrow} left-3`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próxima foto"
            className={`${arrow} right-3`}
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-[6px]">
            {photos.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1} de ${photos.length}`}
                aria-current={i === index}
                className={`rounded-full transition-all ${
                  i === index ? "w-[18px] h-[6px] bg-cream" : "w-[6px] h-[6px] bg-cream/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
