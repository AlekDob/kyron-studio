---
type: feature
project: kyron-studio
created: 2026-06-10
last_verified: 2026-06-12
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

## Lead KPI (2026-06-11)

| Cosa | Dettaglio |
|---|---|
| Eventi | `form_submitted {form}`, `newsletter_subscribed {list}`, `account_registered` |
| Sorgenti | cms: contatti, lavora-con-noi, richiesta-informazioni; storefront: contatti-shop, AuthForm register |
| Query | `leadsQuery` (terza HogQL, `[event, form, count]`, filtro `properties.$host` prod-only) |
| Payload | `overview.leads: { formSubmits, newsletterSubs, registrations, forms[] }` |
| UI | 3 card KPI extra in `KpiGrid` + `FormsBreakdown.tsx` (barre per-form, hidden a 0 dati) |
| Nota | Lead KPI globali: NON filtrati dal toggle Sito/Shop (query non raggruppata per app) |

Filtro produzione: tutte le query analytics richiedono `properties.$host IN
('kyronedu.it','www.kyronedu.it')` e l'init PostHog di cms/storefront e'
gateato su `location.hostname` (staging/locale non inviano eventi;
override smoke test `NEXT_PUBLIC_POSTHOG_DEBUG=true`).

## Mappa, citta', fonti (2026-06-12)

| Cosa | Dettaglio |
|---|---|
| Query | `geoQuery` ($geoip city/country/lat/lon, top 60) + `sourcesQuery` (utm_source > $referring_domain > $direct, top 20) |
| Mappa | `VisitorsMap.tsx`: basemap world-atlas offline + d3-geo Mercator, fitExtent sui dot con zoom clampato, dot r~sqrt(visitors) |
| Citta' | top-10 in `BarList`; GeoIP senza citta' = "Posizione non rilevata" (in lista, mai in mappa) |
| Fonti | `SourcesBreakdown.tsx`: raggruppamento client-side varianti social (m.facebook → Facebook) |
| Condiviso | `BarList.tsx` (barre label/valore) riusato da forms/fonti/citta' |
| Deps | d3-geo, topojson-client, world-atlas — solo chunk /analytics |
| NB | 6 query HogQL per fill cache: rate limit Query API ~120/h |

## Estensione 2026-06-12 — periodi, confronti, mappa, fonti, pagine, device, nav

**Status**: live su studio.kyronedu.it

| Cosa | Componente | Note |
|---|---|---|
| Periodi standard | `FilterBar.tsx` | Oggi/Ieri/Settimana/Mese + 7/30/90gg; chip scrollabili orizzontali su mobile (edge-to-edge, scrollbar nascosta) |
| Delta vs periodo prec. | `KpiGrid.tsx` | % verde/rosso per card, "nuovo" su base zero, seguono il filtro Sito/Shop (`overview.prev`) |
| Timeseries oraria | `TrafficChart.tsx` | Oggi/Ieri → bucket `toStartOfHour`, label "09h", zero-fill 24h client-side |
| Tooltip chart | `TrafficChart.tsx` | custom: Totale in testa, Sito sopra Shop (l'ordine recharts default segue il render) |
| Mappa visitatori | `VisitorsMap.tsx` + `useMapZoom.ts` | basemap world-atlas OFFLINE (d3-geo Mercator, fitExtent clampato), zoom wheel/pinch/pulsanti, pan drag, **dot cliccabili** (selezionato evidenziato + pannello dettagli, altri dimmed) |
| Citta' | `VisitorsMap.tsx` | top-10 in BarList; GeoIP senza citta' = "Posizione non rilevata" (in lista, MAI in mappa) |
| Fonti visite | `SourcesBreakdown.tsx` | full-width; raggruppa varianti social client-side (m.facebook → Facebook) |
| Pagine top | `PagesBreakdown.tsx` | top 15 per visitatori |
| Device | `DevicesPie.tsx` | donut recharts + legenda con quote % |
| Nav sezioni | `SectionNav.tsx` | chip sticky scrollabili, sezione attiva via IntersectionObserver, ancore `scroll-mt-12` |
| Ricerca origini | `TenantBreakdown.tsx` + `lib/fuzzy.ts` | fuzzy substring>sottosequenza su label+slug, zero dipendenze |
| Barre condivise | `BarList.tsx` | DRY tra forms/fonti/citta'/pagine |

### Gotcha nuovi

- **d3 + SSR hydration**: la trigonometria della proiezione differisce nell'ultima cifra float tra Node e browser → coordinate arrotondate a 2 decimali (`round2` + `geoPath.digits(2)`), altrimenti mismatch sui `cy` dei circle.
- **wheel zoom**: listener nativo `{passive:false}` via ref — React non garantisce `preventDefault` su onWheel (la pagina scrollerebbe).
- **Deploy in coppia**: il frontend assume `overview.prev/geo/sources/pages/devices` — deployare PRIMA studio-server, poi studio (il contrario = 500 "reading totals").

### Report email

Vedi `studio-server` feature 005 §Report: ogni giorno 09:00 Europe/Rome a info@kyronedu.it + gmail@alekdob.com, template skill `kyron-email`, logo inline cid.
