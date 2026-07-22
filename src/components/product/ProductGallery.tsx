"use client";

import { useState } from "react";
import ProductMedia from "@/components/product/ProductMedia";

/**
 * Photo gallery for a bag: shows the cover and lets the customer flip through
 * the remaining photos with arrows / dots. Falls back to the woven swatch when
 * the bag has no photo yet. Renders as an absolute layer so `next/image fill`
 * resolves against it — drop it inside a `relative` sized container.
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
  const many = photos.length > 1;
  const current = photos[index] ?? null;

  const go = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-10 grid place-items-center w-9 h-9 rounded-full " +
    "bg-cream/85 text-ink text-[18px] leading-none shadow-[0_6px_18px_-6px_rgba(59,58,46,.5)] " +
    "hover:bg-cream transition-colors";

  return (
    <div className="absolute inset-0">
      <ProductMedia
        name={name}
        photo={current}
        colorPrimary={colorPrimary}
        colorSecondary={colorSecondary}
        variant={variant}
        priority={priority}
        sizes={sizes}
      />

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
