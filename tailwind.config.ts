import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Design tokens lifted directly from the approved Claude Design prototype
 * (`Nic Crochet.dc.html`). Every hex the mockup used lives here as a named
 * token so components reference intent (`bg-sage`, `text-ink`) instead of
 * magic values.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: "#F6F2E9", // primary page background
        cream: "#FBF8F1", // raised surfaces / light sections
        ink: "#3B3A2E", // primary text + dark buttons + dark sections
        sage: {
          DEFAULT: "#8B9A60", // accent
          deep: "#6E7C48", // deep accent / prices / dark green sections
          light: "#AEB985", // accent on dark backgrounds
          pale: "#C9D3A4", // light sage labels on dark
          tint: "#9AA86E", // hero / product swatch green
        },
        muted: {
          DEFAULT: "#6C6A56", // body copy
          soft: "#9A9580", // small labels
          faint: "#A9A48C", // faintest captions
          nav: "#5C5A48", // nav link text
        },
        line: {
          DEFAULT: "#C9BFA6", // default borders / pill outlines
          input: "#E0D8C4", // input borders
          card: "#E7E0CE", // card borders
          divider: "#ECE5D4", // light dividers
          soft: "#E4DCC8", // soft dividers (mobile menu)
          scroll: "#DCD4C2", // scrollbar thumb
        },
        panel: {
          DEFAULT: "#3B3A2E", // admin page background (= ink)
          card: "#454433", // admin cards
          line: "#55543F", // admin borders
          line2: "#4D4C39", // admin inner dividers
        },
        cloud: "#E3E2CF", // light text on dark surfaces
        gold: "#C9A85B", // review stars
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-mulish)", "Mulish", "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "40px",
      },
      maxWidth: {
        shell: "1280px",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "none" },
        },
        drawerIn: {
          from: { transform: "translateX(100%)" },
          to: { transform: "none" },
        },
      },
      animation: {
        floaty: "floaty 3s ease-in-out infinite",
        "floaty-slow": "floaty 4s ease-in-out infinite",
        fadeUp: "fadeUp .3s ease",
        modalUp: "fadeUp .45s cubic-bezier(.2,.8,.2,1)",
        drawerIn: "drawerIn .42s cubic-bezier(.2,.8,.2,1)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
