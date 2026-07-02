# PageMind — Marketing Site

Static single-page marketing site for the **PageMind** Chrome extension.
Deployed to **[pagemind.adarshweb.in](https://pagemind.adarshweb.in)** on Vercel.

This is a sibling project to the extension (which lives in `../entrypoints/`)
and has its **own** `package.json` and Vite config. Do not install extension
dependencies here, and do not import from `../entrypoints/` or `../lib/`.

---

## Stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Framework    | React 18 + Vite 6 (TypeScript, strict mode)               |
| Styling      | Tailwind CSS v4 (via `@tailwindcss/vite`)                 |
| Animation    | Motion (`motion/react`) + GSAP (for the hero aurora)      |
| Icons        | `lucide-react`                                            |
| Fonts        | `@fontsource/space-grotesk`, `plus-jakarta-sans`, `jetbrains-mono` |
| Deploy       | Vercel — static SPA, `vercel.json` SPA rewrite configured |

> The **design tokens** (`--color-pm-*`, fonts, shadows, motion) are
> intentionally reused from the extension's `../assets/global.css` so the
> landing page and the extension look like the same product at different
> zoom levels — the "Midnight Signal" aesthetic.

---

## Local development

```bash
cd site
npm install
npm run dev
```

Vite serves the site at <http://localhost:5173>.

## Production build

```bash
cd site
npm install
npm run build
```

Output is written to `site/dist/`. You can preview it locally with:

```bash
npm run preview
```

The `build` script runs `tsc -b && vite build` — TypeScript must type-check
cleanly (`strict: true`, `noUnusedLocals`, `noUnusedParameters`,
`noUncheckedSideEffectImports`).

---

## Deploying to Vercel

### Option A — Vercel Dashboard (recommended for one-off)

1. Push `pagemind/` to a Git repository.
2. In Vercel, **Add New Project** → import the repo.
3. Set **Root Directory** to `site`.
4. Framework preset: **Vite** (auto-detected from `vercel.json`).
5. Click **Deploy**. The `rewrites` rule in `vercel.json` will turn this
   into a proper SPA (deep links like `/features` resolve to `index.html`).

### Option B — Vercel CLI

```bash
cd site
npm i -g vercel
vercel              # follow the prompts; accept the defaults
vercel --prod       # promote to production once you're happy
```

The `vercel.json` in this folder sets:

- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- `framework`: `vite`
- `rewrites`: `/(.*) → /index.html` (SPA fallback)

### Domain

Point `pagemind.adarshweb.in` (subdomain of `adarshweb.in`) at the Vercel
project via either a CNAME (`cname.vercel-dns.com`) or an ALIAS / A record
to Vercel's anycast IPs. In the Vercel dashboard: **Settings → Domains →
Add** `pagemind.adarshweb.in`.

---

## Project structure

```
site/
├── index.html             ← Vite entry HTML
├── package.json           ← Independent from the extension's package.json
├── vite.config.ts         ← React + Tailwind v4 plugin
├── tsconfig.json          ← Project references (app + node)
├── tsconfig.app.json      ← Strict TS for src/
├── tsconfig.node.json     ← TS for vite.config.ts
├── vercel.json            ← SPA rewrite + Vite framework preset
├── public/
│   ├── logo.png           ← Copied from ../public/logo.png
│   ├── icon-128.png       ← Copied from ../public/icon/128.png
│   └── favicon.png        ← Copied from ../public/icon/32.png
└── src/
    ├── main.tsx           ← React root
    ├── App.tsx            ← Composes all sections
    ├── index.css          ← Tailwind v4 + @theme tokens + global styles
    ├── lib/
    │   └── motion.ts      ← Shared framer-motion variants
    ├── hooks/
    │   └── useScrollProgress.ts  ← useScrollProgress + useMousePosition
    └── components/
        ├── AnimatedSection.tsx
        ├── Nav.tsx
        ├── Hero.tsx
        ├── Providers.tsx
        ├── Features.tsx
        ├── HowItWorks.tsx
        ├── Privacy.tsx
        ├── FinalCTA.tsx
        └── Footer.tsx
```

---

## Editing content

- **Copy:** All marketing copy lives in the section component files.
  Hero → `Hero.tsx`, Features → `Features.tsx`, etc.
- **Design tokens:** `src/index.css` (`@theme` block). The landing-page
  additions are clearly marked with `--color-landing-*`.
- **Logo / icon:** Drop a new `public/logo.png` and `public/icon-128.png`.
  For best perf, replace the 976 KB `logo.png` with an SVG version or
  re-exported, optimized PNG (see *open items* below).

---

## Chrome Web Store link

The "Add to Chrome" CTA currently points to `#` as a placeholder. Search
the codebase for `CHROME_STORE_URL` (defined in `Nav.tsx`, `Hero.tsx`,
`FinalCTA.tsx`, `Footer.tsx`) and replace it with the real store URL
once the listing is published.

---

## Open items (flagged during implementation)

- **Logo weight:** `public/logo.png` is **~976 KB** — acceptable for a
  marketing site (loaded once above the fold), but a re-exported PNG or
  SVG would be a meaningful win for slow connections. See the design
  doc, section 8.
- **OG image:** `og-image.png` is referenced in `index.html` for Open
  Graph / Twitter cards but not yet created. Generate a 1200×630 image
  (logo + headline on dark aurora background) before sharing the link
  on social media.
- **Side-panel screenshot:** The hero uses a CSS mock of the side panel
  (no real screenshot required). Once the extension ships a real
  side panel, replace the `<ProductMock />` component in `Hero.tsx`
  with a real screenshot.
- **OpenAI / DeepSeek wordmarks:** Rendered as styled text (wordmarks)
  for simplicity and to avoid brand-asset licensing concerns. Replace
  with official SVG logos from each brand's press kit if desired.
- **Reduced motion:** All animations collapse to ~0ms via a global CSS
  rule (`@media (prefers-reduced-motion: reduce)` in `index.css`).
  Individual Motion components also branch on `useReducedMotion()` so
  the layout never jumps.

---

## License

MIT — see the parent repository.
