"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the site chrome (footer, etc.) on the admin area — the redesign gives
 * "Área da Nic" its own standalone shell with no storefront nav/footer.
 */
export default function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/area-da-nic")) return null;
  return <>{children}</>;
}
