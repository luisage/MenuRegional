# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js version warning

This project uses **Next.js 16.2.9** with React 19.2 — a recent major version with breaking changes from
the Next.js you likely know. Before writing or editing any App Router code (routing, data fetching, caching,
images, middleware, config), check `node_modules/next/dist/docs/` for the relevant guide. Key differences
to keep in mind:

- **`params` and `searchParams` are always Promises** — `await` them in `page.tsx`/`layout.tsx`/`route.ts`,
  including in `generateMetadata`, `opengraph-image`/`icon` generators, and `sitemap`. Synchronous access is
  fully removed (was deprecated-but-working in v15).
- **`middleware.ts` is renamed `proxy.ts`** with an exported `proxy()` function (not `middleware()`). The
  proxy runtime is always `nodejs` (no edge runtime).
- **Turbopack is the default** for both `next dev` and `next build` — no `--turbopack` flag needed. Custom
  webpack config will fail the build unless `--webpack` is passed.
- **`next lint` has been removed.** Linting is run via the ESLint CLI directly (see Commands below), using
  ESLint's flat config format (`eslint.config.mjs`).
- **`revalidateTag(tag)` now requires a second `cacheLife` profile argument** (e.g. `revalidateTag('posts', 'max')`).
  For instant read-your-writes, use the new `updateTag()` instead.
- Parallel route slots (`@slot`) require an explicit `default.js`/`default.tsx`.

## Prisma version warning

This project uses **Prisma 7.8** with the new `prisma-client` generator (not the old `prisma-client-js`) —
also a recent major version with breaking changes from the Prisma you likely know:

- The generated client is **ESM TypeScript source** written to `app/generated/prisma/` (gitignored —
  regenerate after schema changes with `npx prisma generate`, never edit it directly).
- The datasource URL is **not** set via `env("DATABASE_URL")` in `schema.prisma`. It's configured in
  `prisma.config.ts` (loaded via `dotenv/config`, reads `DATABASE_URL` from `.env`).
- Useful commands: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`.

## Commands

- `npm run dev` — start the dev server (Turbopack, outputs to `.next/dev`)
- `npm run build` — production build (Turbopack)
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`, extends `eslint-config-next`)

There is no test suite configured in this project (no test runner/script in `package.json`).

## Design & UX guidelines

- **Menú Regional is used on desktop, tablet, and mobile** — every section must be fully responsive
  (not just adapted as an afterthought). When implementing or reviewing any page section, verify the
  layout at desktop, tablet, and mobile widths.
- **Use the `ui-ux-pro-max` skill whenever designing or building UI** for this project (new sections,
  components, layout/styling changes, visual reviews/fixes).
- Sections are being built incrementally from design handoffs (high-fidelity HTML/CSS specs) provided
  by the user — recreate them pixel-faithfully using this project's Tailwind v4 + CSS Modules
  conventions (see Hero implementation below) rather than copying the handoff HTML/CSS verbatim.

## Architecture

This is a `create-next-app` project (App Router, TypeScript, Tailwind CSS v4) being built incrementally,
section by section:

- `app/layout.tsx` — root layout; loads **Playfair Display** (serif/display) and **Manrope** (sans/body)
  via `next/font/google`, exposed as CSS variables and applied to `<html>`/`<body>`.
- `app/globals.css` — Tailwind v4 entry point (`@import "tailwindcss"`). Defines the site's design tokens
  via `@theme inline`: brand colors (`espresso`, `wood`, `caramel`, `amber`, `gold`, `tomato`, `cream`,
  `sand`), font family mappings (`--font-sans` → Manrope, `--font-serif` → Playfair), and a custom `xs`
  (440px) breakpoint alongside Tailwind's defaults.
- `app/page.tsx` — home page; currently renders `<Hero />`.
- `app/components/Hero.tsx` + `Hero.module.css` — hero/landing section (full-viewport video background,
  nav with mobile hamburger menu, staggered entrance animations respecting `prefers-reduced-motion`).
  Pattern for new sections: a component in `app/components/`, paired with a CSS Module for
  gradients/animations/responsive rules that don't map cleanly to Tailwind utilities, using the
  `@theme` color/font tokens via `var(--color-*)` / `var(--font-*)`.
- `public/hero/` — static assets (poster image + background video) for the hero section.
- Path alias `@/*` maps to the project root (see `tsconfig.json`).

When adding features/routes, follow App Router conventions (`app/<route>/page.tsx`, `layout.tsx`,
`route.ts`, etc.) per the Next.js 16 docs referenced above.

### Database (`prisma/schema.prisma`)

PostgreSQL via Prisma (see Prisma version warning above). Spanish model/field names throughout —
match that convention for any new models/fields. Domain model:

- **Accounts**: `CuentaRestaurante` (restaurant-owner login, 1:1 with `Restaurante`) and
  `CuentaCliente` (customer login — orders require an account in the current schema).
- **Restaurant structure**: `Restaurante` → many `Sucursal` (branches). Each `Sucursal` has its own
  WhatsApp number (`telefonoWhatsApp`), hours, and delivery cost — orders are sent to the branch's
  number, not a single restaurant-wide number.
- **Menu**: `CategoriaComida` and `Platillo` belong to the `Restaurante` (shared across branches).
  `PlatilloSucursal` is a bridge table for per-branch availability/price overrides.
  `Ingrediente`/`PlatilloIngrediente` model removable ingredients per dish; `Extra` models paid add-ons.
- **Orders**: `Pedido` (linked to cliente + restaurante + sucursal, with `EstadoPedido`, `TipoEnvio`,
  `TipoPago` enums and a `whatsappEnviado` flag) → `DetallePedido` (line items) → `DetallePedidoExtra`.
  Order line items **snapshot** name/price at order time (so later menu edits don't change historical
  orders).
