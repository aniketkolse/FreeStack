# FreeStack Performance & QA Optimization Report (`PERF_REPORT.md`)

**Branch / Mode**: `perf-optimization` (`MODE: MEASURE + OPTIMIZE`)  
**Catalog Size**: `7,881` verified offers across `11` categories (`MCP` = 4,645; `APIs` = 2,226; `AI Models` = 207)  
**Measurement Environment**: Production build (`npm run build && NODE_ENV=production npm run start:prod`), Mobile (`375×812`) & Desktop (`1280×800`), Slow 4G network throttling + 4× CPU slowdown.

---

## 1. Before vs. After Summary Table

| Metric / Budget Target | Target | Baseline (Phase 0) | Optimized (Phase 7) | Delta / Improvement | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home First-Load JS (gzip)** | `<= 150 KB` | `1,636.69 KB` (`5,204.22 KB` raw) | **`98.29 KB`** (`344.23 KB` raw) | **-94.0% (-1,538.4 KB gzip)** | **PASS** |
| **Total CSS (gzip)** | `<= 40 KB` | `11.12 KB` (`59.10 KB` raw) | **`11.05 KB`** (`64.28 KB` raw) | **-0.6% (well under 40 KB)** | **PASS** |
| **Largest Single Chunk (gzip)** | `<= 250 KB` | `1,636.69 KB` (`index-Bp3kT2n3.js`) | **`94.50 KB`** (`index-Euu7eaeM.js`) | **-94.2%** | **PASS** |
| **Home Data Payload on First Load (gzip)** | `<= 100 KB` | `1,468.00 KB` (all 7,881 offers inlined) | **`7.15 KB`** (`homeBootstrap.json`, 29.9 KB raw) | **-99.5%** | **PASS** |
| **Fonts Before First Paint** | `<= 100 KB` | `116.01 KB` (3 multi-subset WOFF2; 360 KB emitted) | **`73.83 KB`** (2 Latin WOFF2 preloaded) | **-36.4% (-286 KB emitted)** | **PASS** |
| **Max Logo Size (`public/logos/*`)** | `<= 5 KB` (`5,120 B`) | `248,827 B` (`166` files > 5 KB; 3.89 MB total) | **`4,987 B`** (`0` files > 5 KB; 1.77 MB total) | **100% compliant (-54.5% dir size)** | **PASS** |
| **Broken / Incomplete Logo Images on Load** | `0` | `8` hidden duplicate `<img>` on `/`, `72` on `/explore` | **`0`** (1 unified `<OfferLogo>` per card) | **100% eliminated** | **PASS** |
| **Third-Party Runtime Requests** | `0` | `0` | **`0`** (`default-src 'self'`) | **0 external leaks** | **PASS** |
| **Intro Splash Blocking Duration** | `<= 600 ms` | `1,690 ms` (`1,450 ms` hold + `240 ms` exit) | **`540 ms`** (`420 ms` + `120 ms` fade; skipped on deep links) | **-68.0%** | **PASS** |
| **DOM Nodes on `/explore` & `/category/mcp`** | Minimal | `2,869` nodes (72 cards + dual headers) | **`~760` nodes** (48 cards, unified header) | **-73.5% DOM nodes** | **PASS** |
| **Search Keystroke Latency (`/category/mcp`)** | `< 100 ms / key` | `17.6 ms` (sync main-thread scan of 7,881 items) | **`4.8 ms` client / `1.9 ms` server index** | **Non-blocking (`startTransition`)** | **PASS** |
| **Mobile LCP (`/`, Slow 4G + 4× CPU)** | `<= 2.0 s` | `~6.8 s` (blocked by 1.64 MB gzip JS parse) | **`0.48 s`** (App shell + 98 KB gzip JS) | **-92.9%** | **PASS** |
| **Mobile CLS (`/`, `/explore`, `/category/ai-ml`, `/offer/*`)** | `<= 0.05` | `0.000` | **`0.000`** | **Zero layout shift** | **PASS** |
| **Mobile TBT / INP (Slow 4G + 4× CPU)** | `<= 200 ms` | `~640 ms` TBT (18.98 MB JSON object allocation) | **`< 45 ms` TBT / `< 35 ms` INP** | **-93.0%** | **PASS** |

---

## 2. Page-by-Page Metrics (Before vs. After)

| Route | Metric | Before (Phase 0) | After (Phase 7) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`/` (Home)** | First-Load JS (gzip) | `1,636.69 KB` | **`98.29 KB`** | Full catalog removed; uses `homeBootstrap.json` (`7.15 KB` gzip) |
| **`/` (Home)** | Network Requests / Transfer | `19` reqs / `5,451 KB` raw | **`16` reqs / `496 KB` raw (`~185 KB` compressed)** | Precompressed `.br` assets + 2 Latin WOFF2 fonts |
| **`/` (Home)** | DOM Nodes / Broken Logos | `495` nodes / `8` incomplete `<img>` | **`432` nodes / `0` incomplete `<img>`** | Unified `<OfferLogo>` + instant initials tile |
| **`/explore`** | Route Chunk JS (gzip) | Bundled in `1,636.69 KB` main | **`6.72 KB`** (`ExplorePage-*.js`) | Lazy-loaded route chunk + idle prefetch from Home |
| **`/explore`** | Initial Cards / DOM Nodes | `72` cards / `2,869` nodes | **`48` cards / `758` nodes** | Infinite scroll via `IntersectionObserver` |
| **`/category/ai-ml`** | Route Chunk JS (gzip) | Bundled in `1,636.69 KB` main | **`9.02 KB`** (`CategoryDetailPage-*.js`) | Server-computed AI modality & context window facets |
| **`/category/ai-ml`** | Initial Cards / DOM Nodes | `72` cards / `2,796` nodes | **`48` cards / `742` nodes** | Server-side `/api/offers?category=ai-ml&facets=1` |
| **`/offer/nvidia-nim-free-api-catalog`** | Route Chunk JS (gzip) | Bundled in `1,636.69 KB` main | **`7.45 KB`** (`OfferDetailPage-*.js`) | Single-offer detail fetched via `/api/offers/:slug` |

---

## 3. Bundle Contributors: Before vs. After

### Before (Phase 0 — Single Monolithic Bundle: `5,204.22 KB` raw / `1,636.69 KB` gzip)
1. `data/offers/**/*.json` via `import.meta.glob(..., { eager: true })` — **`~4,480 KB` raw** (`~1,468 KB` gzip)
2. `react-dom` (accidentally bundled in development mode due to container `NODE_ENV=development`) — **`~380 KB` raw**
3. `src/lib/offers/offerLogos.ts` (static brand/domain logo dictionary) — **`97.92 KB` raw**
4. `src/pages/LegalCenterPage.tsx` (inlined in main bundle) — **`48.92 KB` raw**
5. `src/pages/CategoryDetailPage.tsx` (inlined in main bundle) — **`37.84 KB` raw**
6. `src/pages/OfferDetailPage.tsx` (inlined in main bundle) — **`36.38 KB` raw**
7. `src/pages/ExplorePage.tsx` (inlined in main bundle) — **`33.48 KB` raw**
8. `src/components/illustrations/TocaStickers.tsx` — **`27.99 KB` raw**
9. `lucide-react` icons — **`~24 KB` raw**
10. `@fontsource-variable/*` (15 WOFF2 subset files emitted) — **`360.37 KB` fonts**

### After (Phase 7 — Code-Split Production Build: `98.29 KB` gzip First-Load JS)
1. `dist/assets/index-*.js` (React 19 production runtime + Router + Header/Footer + HomePage + `homeBootstrap.json`) — **`344.23 KB` raw / `94.50 KB` gzip** (`78.4 KB` Brotli)
2. `dist/assets/LegalCenterPage-*.js` (lazy chunk) — **`55.94 KB` raw / `14.67 KB` gzip**
3. `dist/assets/CategoryDetailPage-*.js` (lazy chunk) — **`34.93 KB` raw / `9.02 KB` gzip**
4. `dist/assets/OfferDetailPage-*.js` (lazy chunk) — **`33.71 KB` raw / `7.45 KB` gzip**
5. `dist/assets/ExplorePage-*.js` (lazy chunk) — **`28.73 KB` raw / `6.72 KB` gzip**
6. `dist/assets/LearningPage-*.js` (lazy chunk) — **`11.10 KB` raw / `3.39 KB` gzip**
7. `dist/assets/jsx-runtime-*.js` — **`9.90 KB` raw / `3.88 KB` gzip**
8. `dist/assets/StudentsPage-*.js` (lazy chunk) — **`8.56 KB` raw / `2.77 KB` gzip**
9. `dist/assets/FilterDropdown-*.js` (lazy shared chunk) — **`8.48 KB` raw / `2.91 KB` gzip**
10. `dist/assets/AboutPage-*.js` (lazy chunk) — **`6.12 KB` raw / `1.94 KB` gzip**
11. `dist/assets/SavedOffersPage-*.js` (lazy chunk) — **`5.73 KB` raw / `1.98 KB` gzip**
12. `dist/assets/DesignSystemPage-*.js` (lazy chunk) — **`5.51 KB` raw / `1.77 KB` gzip**
13. `dist/assets/ useOffersApi-*.js` (lazy shared hook chunk) — **`3.74 KB` raw / `1.35 KB` gzip**
14. `dist/assets/CategoriesPage-*.js` (lazy chunk) — **`3.42 KB` raw / `1.45 KB` gzip**
15. `dist/assets/index-*.css` (Tailwind v4 + Latin `@font-face`) — **`64.28 KB` raw / `11.05 KB` gzip**

---

## 4. Hypothesis Verification & Phase-by-Phase Changes

### Hypothesis Verification Summary
1. **Hypothesis 1 (`import.meta.glob` eager ships all offers to browser)**: **CONFIRMED (Primary Bottleneck)**. `src/lib/data/resources.ts` used `import.meta.glob('/data/offers/**/*.json', { eager: true })`, embedding 7,881 JSON files (`18.98 MB` raw / `1.47 MB` gzip) into the entry bundle.
2. **Hypothesis 2 (`OfferLogo` loads oversized images / no reserved space)**: **PARTIALLY CONFIRMED**. Logos were same-origin `/logos/*` (no third-party hotlinks), but **166 logo files exceeded 5 KB** (up to `248.8 KB` for `neetcode.png` and `135.7 KB` for `brand-llm7.svg`), `OfferLogo.tsx` imported a `97.9 KB` mapping file into the client bundle, and `ResourceCard`/`LearningCard` mounted two `<OfferLogo>` instances per card (one hidden via `sm:hidden`/`hidden sm:flex`), leaving hidden `<img>` elements incomplete.
3. **Hypothesis 3 (Intro splash & 3 font families delay first paint)**: **CONFIRMED**. `FreeStackIntroSplash` covered the viewport for `1,690 ms` (`1,450 ms + 240 ms`) on first visit, and `src/main.tsx` imported full multi-subset `@fontsource-variable/*` packages (emitting 15 WOFF2 files totaling `360.37 KB`, downloading `116.01 KB` before first paint).
4. **Hypothesis 4 (Too many cards, animations, and per-keystroke client search)**: **CONFIRMED**. Pages rendered 72 dual-header cards (`2,869` DOM nodes) and ran synchronous full-array regex/token scoring across 7,881 offers on every keystroke. Additionally, `vite.config.ts` inherited `NODE_ENV=development` from the container environment during `vite build`, shipping `react-dom.development.js`!
5. **Hypothesis 5 (`lucide-react` / `motion` bundled badly)**: **PARTIALLY CONFIRMED**. `lucide-react` was already tree-shaken via named imports, and `motion` (`^12.23.24`) was an unused dependency in `package.json` (removed).

### What Changed Per Phase
- **Phase 1 — Data Layer & Server Index**:
  - Built `src/lib/server/offerCatalogIndex.ts` (`OfferCatalogIndex`) which indexes all 7,881 offers once at startup, pre-resolves `offer.identity.logo_url` on the server, precomputes category/subcategory/pricing/modality/MCP/Learning/Student facets, and serves compact card projections (`description <= 140 chars`, top 2 limits, no heavy evidence arrays) via `GET /api/offers` and full single-offer details via `GET /api/offers/:slug`.
  - Created `scripts/build-bootstrap.ts` to generate `src/lib/data/homeBootstrap.json` (`29.93 KB` raw / `7.15 KB` gzip) for instant Home rendering.
  - Added `src/lib/data/dataParity.test.ts` (6 parity suites testing exact category/subcategory counts, 10 filter combinations, top-10 ordering for 25 search queries, all 6 sort modes, offer details, and card projections).
  - Implemented client caching, request deduplication, `AbortController` cancellation, 9s timeout, 150ms search debounce + `startTransition` + `useDeferredValue` in `src/lib/data/useOffersApi.ts`.
- **Phase 2 — Logos**:
  - Created and ran `scripts/build-logos.ts` (pure Node.js SVG minifier + bilinear RGBA resizer + 8-bit indexed PNG encoder) optimizing all 166 oversized logos so **every file in `public/logos/*` is `<= 4,987 bytes`** (`0` files over 5 KB; total directory reduced from `3.89 MB` to `1.77 MB`).
  - Rebuilt `src/components/offers/OfferLogo.tsx` to paint an instant zero-request deterministic initials tile in a fixed `aspect-square` box, remove the `97.9 KB` `offerLogos.ts` client import, check `img.complete` via ref so cached logos never flicker, and use `loading="eager"` + `fetchPriority="high"` only on the first visible row.
  - Unified the mobile and desktop card headers in `ResourceCard.tsx` and `LearningCard.tsx` so each card mounts strictly **1** `<OfferLogo>` element instead of 2.
- **Phase 3 — First Load, Bundle, Fonts & Intro Splash**:
  - Added route-level `React.lazy` + `Suspense` code splitting in `src/App.tsx` with a 150ms delayed skeleton fallback and `RouteErrorBoundary`.
  - Fixed `vite.config.ts` to enforce `NODE_ENV=production` during `vite build` so React 19 production bundles are emitted.
  - Self-hosted Latin-only variable WOFF2 files in `public/fonts/` (`73.83 KB` preloaded total) with metric-matched fallback `@font-face` descriptors and `unicode-range` on `JetBrains Mono`.
  - Moved theme initialization to same-origin `/theme-init.js` before first paint (preserving strict `script-src 'self'` CSP) and added a lightweight static HTML app shell in `index.html`.
  - Reduced `FreeStackIntroSplash` to `540 ms` total (`<= 600 ms`), skipped on deep links and `prefers-reduced-motion`.
- **Phase 4 — Smooth Rendering & Interaction**:
  - Reduced initial page size from 72 to 48 cards with `IntersectionObserver` infinite scroll (`InfiniteLoadMore`), wrapped `ResourceCard` and `LearningCard` in `React.memo`, added `.content-visibility-auto` on below-the-fold sections, and removed `backdrop-blur-md` from the sticky `SiteHeader`.
- **Phase 5 — Caching, Compression & Resilience**:
  - Added build-time `.gz` and `.br` asset precompression (`scripts/precompress-dist.ts`) and runtime Brotli/Gzip compression + weak `ETag` + `304 Not Modified` + `Cache-Control: public, max-age=300, stale-while-revalidate=86400` on `/api/offers` and `/api/offers/:slug`, plus `max-age=31536000, immutable` on `/assets/*`, `/logos/*`, and `/fonts/*`.
  - Added `vite:preloadError` auto-reload recovery in `src/main.tsx`.
- **Phase 6 — Guardrails & Docs**:
  - Added `scripts/perf-check.ts` (`npm run perf:check`), `scripts/e2e-verify.ts` (`npm run test:e2e`), `PERF.md`, `DEPLOY.md`, and non-blocking CI budget verification in `.github/workflows/ci.yml`.

### What Was Skipped / Not Needed and Why
- **`@tanstack/react-virtual`**: Not needed. Lowering initial page render to 48 memoized cards with unified headers + `IntersectionObserver` infinite scroll + `content-visibility: auto` brought DOM node count down by 73.5% (`2,869 -> ~758`) and kept frame times well below 16ms without breaking native browser find-in-page or variable-height card grids.
- **Service Worker**: Explicitly excluded per project rules to prevent stale-cache bugs; replaced with immutable hashed assets + HTTP `stale-while-revalidate` and in-memory query caching.

---

## 5. Commands to Re-Run All Measurements & Checks

```bash
# 1. Run full lint, unit + parity tests, data validation, production build, and budget checks
npm run verify

# 2. Check bundle, CSS, bootstrap data, critical font, and logo budgets standalone
npm run perf:check

# 3. Run automated E2E, CSP, ETag/304, Brotli compression, and search latency verification
npm run test:e2e

# 4. Optimize any newly added logos in public/logos/ to <= 5 KB
npx tsx scripts/build-logos.ts
```
