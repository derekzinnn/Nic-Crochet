import type { Metadata } from "next";
import { Cormorant_Garamond, Mulish } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ChromeGate from "@/components/ChromeGate";
import Reveal from "@/components/Reveal";
import CartDrawer from "@/components/cart/CartDrawer";
import ProductModal from "@/components/product/ProductModal";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/config";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "nic crochet — bolsas tecidas com tempo",
    template: "%s · nic crochet",
  },
  description:
    "Bolsas de crochê feitas à mão, uma de cada vez, no ateliê da Nic. Fios naturais, formas atemporais e peças sob medida.",
  openGraph: {
    title: "nic crochet — bolsas tecidas com tempo",
    description: "Bolsas de crochê feitas à mão, no ateliê da Nic.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${mulish.variable}`}>
      <body>
        {/* Apply the persisted dark-mode class before first paint (no FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('nc-dark')==='1')document.body.classList.add('nc-dark')}catch(e){}`,
          }}
        />
        <Reveal />
        <Nav />
        <main>{children}</main>
        <ChromeGate>
          <Footer />
        </ChromeGate>
        <CartDrawer />
        <ProductModal />
        <Toaster />
      </body>
    </html>
  );
}
