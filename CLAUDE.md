# Nic Crochet — Build Log & Architecture

Portfolio + storefront for **Nic Crochet**, a handmade crochet-bag business.
Recreates the approved Claude Design prototype (`Nic Crochet.dc.html`) pixel-for-
pixel on a production stack, and makes real the functionality the prototype faked.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v3** — design tokens in `tailwind.config.ts` (no scattered hex)
- **Prisma** + **PostgreSQL** (Supabase; DB + Storage only, no Supabase Auth)
- **Zustand** (+ persist) for the cart
- **jose** + **bcryptjs** for admin auth (planned, Phase 5)
- Deploy target: self-hosted OCI ARM VPS — PM2 + Caddy (Phase 7)

## Key decisions

- **Routes in Portuguese** matching site copy: `/`, `/colecao`, `/produto/[slug]`,
  `/sob-medida`, `/area-da-nic` (admin). Real routes, not client state-switching.
- **Product detail = dedicated page** (`/produto/[slug]`) not a modal — better SEO
  & shareable links. Visual design adapted from the prototype's modal.
- **Money stored as integer centavos** (`priceCents`) to avoid float bugs.
- **Cart persisted to localStorage** (Zustand persist, key `nic-crochet-cart`) —
  fixes the prototype's refresh-loses-cart bug. Checkout = WhatsApp handoff.
- **Custom-order alert = WhatsApp link** (user choice) — no email service needed.
- **Admin auth = single env-configured account** (bcrypt hash + signed cookie),
  not NextAuth — right-sized for one artisan.
- **Graceful DB fallback**: `src/lib/products.ts` falls back to the static seed
  catalogue if the DB is unreachable, so the site renders before Supabase exists.
- **Fallback swatch colors** kept per product (`colorPrimary/Secondary`) so the
  handmade placeholder look survives until Nic uploads real photos.

## Phases

- [x] **Phase 1 — Foundation** ✅ (current)
  - Scaffold, Tailwind theme/tokens, Prisma schema, lib layer.
  - Shared chrome: scroll-aware Nav, mobile menu, Footer, Cart drawer.
  - Home page pixel-matched (hero, featured top-3, atelier strip, testimonials,
    custom CTA) + scroll-reveal/parallax motion.
  - Product detail page. Stubs for colecao/sob-medida/area-da-nic.
  - **Verified**: `next build` passes; visual check of every home section matches
    the design; add-to-cart + drawer + localStorage persistence all working.
- [x] **Phase 2 — Shop/Coleção** ✅
  - `/colecao` server component reads `?q`, `?cat`, `?sort` URL params.
  - Pure `filterSortProducts` in `src/lib/shop.ts`; debounced client `SearchInput`
    drives the `q` param (shareable/SEO URLs). Sort + category chips are `<Link>`s
    that preserve current params. Count + no-results ("Limpar busca") states.
  - **Verified**: category filter, sort, debounced search, param preservation and
    no-results all working in-browser; pixel-matched to prototype shop view.
- [ ] **Phase 3 — Custom order wizard** — 4-step form → persists `CustomOrderRequest`
      + WhatsApp notify.
- [ ] **Phase 4 — Admin auth** — bcrypt login, signed JWT cookie, middleware guard.
- [ ] **Phase 5 — Admin product CRUD** — 4-step create/edit wizard, delete,
      status toggle, dashboard list.
- [ ] **Phase 6 — Photo upload** — drag/drop → Supabase Storage, live preview.
- [ ] **Phase 7 — Deploy** — PM2 + Caddy on OCI VPS, env vars, `sharp`, build seq.

## Project layout

```
src/
  app/
    layout.tsx            # fonts (Cormorant/Mulish), Nav+Footer+CartDrawer+Reveal
    page.tsx              # Home (composes home/* sections)
    globals.css           # Tailwind layers + reveal/scrollbar base
    produto/[slug]/       # product detail page
    colecao/ sob-medida/ area-da-nic/   # stubs (Phases 2/3/4)
  components/
    Nav.tsx Logo.tsx Footer.tsx Reveal.tsx ComingSoon.tsx
    home/                 # Hero, FeaturedSection, AtelierStrip, Reviews, CustomCta
    product/              # ProductCard, ProductMedia, AddToCartButton
    cart/                 # cart-store.ts (zustand), CartDrawer.tsx
  lib/
    prisma.ts supabase.ts config.ts format.ts types.ts products.ts
  data/ seed-products.ts  # 8 prototype products (seed + fallback)
prisma/ schema.prisma seed.ts
scripts/ hash-password.ts
```

## Files created (Phase 1)

Config: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`,
`postcss.config.mjs`, `.gitignore`, `.env` / `.env.example`, `.claude/launch.json`.
Prisma: `prisma/schema.prisma`, `prisma/seed.ts`.
Docs: `SETUP.md`, this file.
Plus all `src/**` listed above.

## Design tokens (from prototype)

`sand #F6F2E9` · `cream #FBF8F1` · `ink #3B3A2E` · `sage #8B9A60` /
`sage.deep #6E7C48` / `sage.light #AEB985` / `sage.pale #C9D3A4`. Fonts:
`Cormorant Garamond` (serif/italic headings), `Mulish` (body/UI). Full map in
`tailwind.config.ts`.

## Next step

**Phase 2 complete.** Next: wire the live Supabase DB (fill real `.env`, run
`npm run db:push && npm run db:seed`) to replace the seed fallback, then start
Phase 3 (custom-order wizard). GitHub: `derekzinnn/Nic-Crochet` (branch `main`).
