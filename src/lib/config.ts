/**
 * Public site configuration. Values come from env so they can be swapped per
 * environment without touching code. These are NEXT_PUBLIC_* so they are safe
 * to read on the client.
 */
export const siteConfig = {
  name: "nic crochet",
  tagline: "feito à mão",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "5500000000000",
  instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "nic.crochet",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@niccrochet.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

/** Build a wa.me link with a URL-encoded prefilled message. */
export function whatsappLink(message: string, number = siteConfig.whatsappNumber): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const instagramUrl = `https://instagram.com/${siteConfig.instagramHandle.replace(/^@/, "")}`;
