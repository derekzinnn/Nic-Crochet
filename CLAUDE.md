# Nic Crochet — Build Log & Architecture

Portfolio + storefront for **Nic Crochet**, a handmade crochet-bag business.
Recreates the approved Claude Design prototype (`Nic Crochet.dc.html`) pixel-for-
pixel on a production stack, and makes real the functionality the prototype faked.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v3** — design tokens in `tailwind.config.ts` (no scattered hex)
- **shadcn/ui** — Sonner toasts + Skeleton loaders (`src/components/ui`, `cn`)
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
- [x] **Phase 3 — Custom order wizard** ✅
  - `/sob-medida` 4-step client wizard (`CustomWizard.tsx`): tipo/tamanho chips →
    cores → prazo/detalhes → contato + live resumo, with progress bar.
  - Submit calls a server action (`sob-medida/actions.ts`) that persists
    `CustomOrderRequest`. **Graceful**: if the DB is unreachable it still succeeds
    and relies on the WhatsApp handoff (logged), so the customer is never blocked.
  - Success screen notifies Nic via a pre-filled `wa.me` link built from the
    request. Shared validation + message builder in `src/lib/custom-order.ts`.
  - **Verified**: all 4 steps, validation, submit, success + WhatsApp link in-browser.
- [x] **Phase 4 — Admin auth** ✅
  - `src/lib/session.ts` (edge-safe jose JWT sign/verify + cookie name) and
    `src/lib/auth.ts` (bcrypt `verifyCredentials`, create/destroy/get session).
  - `/area-da-nic` login (dark, pixel-matched) → `loginAction` server action
    (`useActionState`); success sets an httpOnly signed cookie → `/area-da-nic/painel`.
  - `src/middleware.ts` guards `/area-da-nic/painel/*`; dashboard shell lists
    products with status badges + logout. Single env-configured admin.
  - **Gotcha fixed**: `@next/env` expands `$`, corrupting bcrypt hashes — the
    `ADMIN_PASSWORD_HASH` `$`s must be escaped as `\$` in `.env` (the `admin:hash`
    script now prints a ready-to-paste escaped line).
  - **Verified**: guard redirect, wrong-password error, real login, protected
    dashboard, and logout all working in-browser.
- [x] **Phase 5 — Admin product CRUD** ✅
  - Dashboard (`/area-da-nic/painel`) lists all bags with inline status `<select>`,
    Editar, Excluir (confirm), featured `★`, and a "+ Nova bolsa" button.
  - Shared 4-step `ProductWizard` (create + edit) with a live preview panel:
    básico (nome/categoria/preço/status/destaque) → aparência (cores/selo) →
    descrição/detalhes → revisão. `/painel/nova` + `/painel/[id]/editar`.
  - Auth-guarded server actions (`painel/actions.ts`): create/update/delete/
    setStatus/toggleFeatured — `requireAdmin`, unique slug, `revalidatePath`.
  - **Verified** end-to-end against the live DB: create (appears on storefront),
    edit (price persisted), status toggle (→SOLD), delete (removed from DB).
- [x] **Phase 6 — Photo upload** ✅
  - `POST /api/admin/upload` route handler: auth-guarded, validates image
    type/size (≤6 MB), uploads to the `product-photos` bucket, returns public URL.
  - `PhotoUploader` (drag/drop + file picker, multi-file, thumbnails with
    "Capa"/remove) drives `draft.photos` in the wizard's Aparência step; colors
    demoted to fallback. Storefront shows photos via `next/image` (remotePatterns
    set from `NEXT_PUBLIC_SUPABASE_URL`), swatch when none.
  - **Verified**: real upload to Supabase (public URL serves 200), 401 without
    auth, and `next/image` renders the uploaded photo on the product page.
- [ ] **Phase 7 — Deploy** — user self-hosts on OCI VPS with Docker (their own
      setup). We ship `sharp` (image opt) + `public/robots.txt`; no deploy files
      committed per user request. Build seq: `npm ci && npm run build && npm start`.
- [x] **Phase 8 — UX & data refinements** ✅ (post-Phase-6, per user feedback)
  - **shadcn/ui**: Sonner `<Toaster/>` in the layout + toasts on create/edit/
    delete/status; `Skeleton` + `loading.tsx` for colecao/produto/painel.
  - **Supplier colors**: removed the free hex pickers. `src/lib/yarn-colors.ts`
    is the editable palette (placeholder ~14 tons); a bag now **multi-selects**
    available colors from it. Product detail shows "Disponível nas cores".
    Schema: `colorPrimary/colorSecondary` → `colors String[]`; the placeholder
    swatch is derived from the selected palette colors.
  - **iPhone photos**: cards, product detail and wizard preview use **3:4**
    (portrait) so iPhone shots fit with no crop.
  - **Verified**: build clean; palette select, toasts, 3:4, available-colors,
    create/edit/delete against live DB all working in-browser.

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

**Phases 1–6 complete; live Supabase DB + Storage wired.** The whole app is
functional: storefront, cart, custom orders, admin auth, product CRUD, and real
photo uploads. Before launch: set a real admin password (`npm run admin:hash`)
and swap any remaining placeholder contact values. Next & final: Phase 7 —
deploy to the OCI VPS (PM2 + Caddy, prod env, `sharp`). GitHub:
`derekzinnn/Nic-Crochet` (`main`).
