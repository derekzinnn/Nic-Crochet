import type { NextConfig } from "next";

const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Self-contained build output — required by the Docker deploy on the OCI VPS.
  // Harmless locally: it only changes what `next build` emits.
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    // Client-side Router Cache: keep already-visited routes around instead of
    // re-fetching them on every navigation. Makes going back to the coleção,
    // or switching admin tabs, feel instant rather than a fresh page load.
    staleTimes: {
      dynamic: 30, // seconds — pages with search params / force-dynamic
      static: 300, // seconds — prerendered pages (home, product pages)
    },
  },
  images: {
    // Supabase Storage public bucket URLs. Host is derived from the env var so
    // it works across environments without hardcoding the project ref.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;
