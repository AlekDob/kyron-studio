---
type: feature
project: kyron-studio
created: 2026-06-10
last_verified: 2026-06-10
tags: [analytics, posthog, recharts, mobile]
---
# 009 — Modulo Analytics

**Status**: implemented (locale, da deployare)
**Decision**: `Kyron/documentation/decisions/decision-017-analytics-posthog.md`
**Backend**: studio-server feature 005 (`/api/v1/analytics/overview`)

## Cosa

| Aspetto | Implementazione |
|---|---|
| Route | `src/app/(authed)/analytics/page.tsx` (Server Component) + `loading.tsx` skeleton |
| Registry | entry `analytics` in `src/components/shell/modules.ts` (tool, live, icon ChartNoAxesColumn) |
| Fetch | `src/lib/analytics.ts` → `gatewayFetch` (export aggiunto in `lib/gateway.ts`) — un solo fetch per pagina |
| Filtri | `FilterBar.tsx` — pill `<Link>` su searchParams `?range=7d|30d|90d&app=all|cms|storefront`; il filtro app e' applicato sul payload, zero fetch extra |
| KPI | `KpiGrid.tsx` — Visitatori, Pageview, Carrelli, Checkout, Ordini, Ricavi (`grid-cols-2 md:3 lg:6`) |
| Chart | `TrafficChart.tsx` — **unico leaf client**, Recharts 3 AreaChart visitatori/giorno (serie Sito vs Shop), colori da CSS vars (dark gratis), height 220 mobile / 280 desktop |
| Breakdown | `TenantBreakdown.tsx` — tabella desktop / stack Card mobile (`lg:hidden`), Pill warning "non onboardata" per slug PostHog senza portale |
| Stati | `EmptyState.tsx` — not-configured / query-error / no-data; banner stale se il BFF serve cache scaduta |
| Formati | `format.ts` — Intl it-IT (int, EUR, %) |

## Dipendenza nuova

`recharts@^3` — scelta vs Tremor (assume Tailwind config-file, noi siamo v4 CSS-first) e visx (troppo hand-rolling). Confinata al chunk `/analytics`.

## Dinamicita' tenant

Nessun elenco hardcoded: le righe arrivano dal BFF che unisce GROUP BY `school_slug` PostHog + `listPortals()` Payload. Un nuovo shop appare da solo (con nome se onboardato, con slug + badge se no).

## Gotcha Recharts 3 + Next

- **`ResponsiveContainer` senza `initialDimension` resta a width/height -1** dopo l'hydration (warn in console, chart invisibile). Fix: `initialDimension={{ width: 600, height: 220 }}`.
- **Timeseries zero-filled lato client** (`eachDay` in TrafficChart): PostHog non ritorna i giorni senza eventi e con 1 solo giorno di dati l'AreaChart non disegna nulla. Il pivot riempie tutto il periodo `from→to` con zeri.

## Verifica (2026-06-10, locale, dati PostHog reali)

- Tile in dashboard + sidebar, pagina su :3010 con `STUDIO_DEV_USER`
- KPI popolati (eventi smoke test), chart con spike visitatori 10/06, tabella Sito + Shop principale
- EmptyState "non configurata" con server senza POSTHOG_API_KEY (503)
- Mobile 375px: FilterBar wrap, card breakdown, KPI 2 colonne; dark theme via toggle ok
- Cache BFF: seconda richiesta 15ms, stesso `generatedAt`
- Typecheck verde
