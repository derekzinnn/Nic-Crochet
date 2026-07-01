import Image from "next/image";

type Variant = "card" | "modal" | "thumb";

type Props = {
  name: string;
  photo?: string | null;
  colorPrimary: string;
  colorSecondary: string;
  variant?: Variant;
  /** Render the centered "[ name ]" caption used on cards (placeholder only). */
  showCaption?: boolean;
  priority?: boolean;
  sizes?: string;
};

/**
 * Renders a product's cover photo when available, otherwise the prototype's
 * woven-swatch placeholder. Keeps the handmade look until Nic uploads real photos.
 */
export default function ProductMedia({
  name,
  photo,
  colorPrimary,
  colorSecondary,
  variant = "card",
  showCaption = false,
  priority = false,
  sizes,
}: Props) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt={name}
        fill
        priority={priority}
        sizes={sizes ?? "(max-width: 880px) 50vw, 300px"}
        className="object-cover"
      />
    );
  }

  // Placeholder backgrounds per context, lifted from the prototype.
  const background =
    variant === "card"
      ? colorPrimary
      : variant === "thumb"
        ? `repeating-linear-gradient(42deg, ${colorPrimary} 0 9px, ${colorSecondary} 9px 18px)`
        : `repeating-linear-gradient(42deg, ${colorPrimary} 0 14px, ${colorSecondary} 14px 28px)`;

  return (
    <div className="absolute inset-0" style={{ background }}>
      {variant === "modal" && (
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,.18), transparent 55%)" }}
        />
      )}
      {(showCaption || variant === "modal") && (
        <span className="absolute left-1/2 bottom-5 -translate-x-1/2 font-sans text-[9px] tracking-[0.26em] uppercase text-white/[0.78] whitespace-nowrap">
          {variant === "modal" ? `[ ${name} ]` : `[ ${name} ]`}
        </span>
      )}
    </div>
  );
}
