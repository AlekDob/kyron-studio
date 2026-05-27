---
type: feature
project: kyron-studio
created: 2026-05-27
last_verified: 2026-05-27
tags: [portals, onboarding, crud, logo-upload, workstream-04]
---

# 007 — Modulo Portali

## Cosa

Modulo unificato "Portali" nella sidebar. Split-pane: chat agente a sinistra,
pannello contestuale a destra (lista portali / scheda live onboarding / dettaglio).

| Route | Scopo |
|---|---|
| `/portals` | Workspace split-pane (chat + side panel) |
| `/portals?detail=<slug>` | Apre workspace con dettaglio nel side panel |
| `/portals/[slug]` | Redirect 307 → `/portals?detail=<slug>` (deep link compat) |

## Capacita' agente

| Azione | Tool | Note |
|---|---|---|
| Creare portale | `save_pending_school` | Onboarding conversazionale 8 step |
| Elencare portali | `list_portals` | Mostra nel side panel |
| Dettaglio portale | `get_portal({query})` | Fuzzy match su slug **o** nome (case-insensitive) |
| Modificare portale | `update_portal` | Campi singoli (nome, sito, indirizzo, stato), null = invariato |
| Eliminare portale | `delete_portal` | Richiede conferma scritta del nome |
| Upload logo | `render_logo_uploader` | Componente generativo con upload diretto |
| Catalogo (onboarding) | `render_product_picker` | Generative UI, prodotti da Saleor live |
| Kit (onboarding) | `render_bundle_builder` | Loop esplicito, N kit senza limiti |
| Aggiungi kit a portale esistente | `add_bundle_to_portal` | Persiste la submission BundleBuilder su un portale gia' salvato |
| Cambia catalogo portale | `update_catalog` | Sostituisce intera lista visibleSlugs |
| Modifica bundle | `update_bundle` | nome / prezzo / componenti (null = invariato) |
| Rimuovi bundle | `remove_bundle` | Cancella un singolo kit |

Tutti i tool di lookup (`get_portal`, `update_*`, `delete_*`, `add_bundle_to_portal`)
risolvono il portale via `resolvePortal(query)` in `studio-server`: tentano lo
slug esatto, poi fanno fuzzy match normalizzato (slug + nome). Su match multipli
ritornano la lista candidati invece di "non trovato".

## Side panel editabile (UX ibrida)

Il pannello destro non e' solo read-only: la maggior parte dei campi e' editabile inline.
L'agente resta per onboarding e operazioni "intelligenti", la UI per micro-fix rapidi.

| Sezione | Operazioni inline | Endpoint |
|---|---|---|
| Informazioni | nome / sito / cod. MIUR | PUT `/api/portals/[slug]` |
| Indirizzo | via / CAP / citta' / provincia | PUT `/api/portals/[slug]` |
| Spedizione | toggle `shipToSchool` | PUT `/api/portals/[slug]` |
| Catalogo | rimuovi chip / Aggiungi prodotto (dropdown Saleor) | PUT `/api/portals/[slug]/catalog` |
| Bundle | nome / prezzo / aggiungi-rimuovi componenti | PUT `/api/portals/[slug]/bundles/[bundleSlug]` |
| Bundle | rimuovi kit (cestino, doppio click conferma) | DELETE `/api/portals/[slug]/bundles/[bundleSlug]` |

**Componenti inline**: `InlineText` (click → input → Enter/✓ salva, Esc annulla),
`InlinePrice` (parsing virgola/punto), `CatalogEditor`, `BundleCard` con dropdown
lazy-loaded da `/api/portals/_catalog` (Saleor passthrough).

**Refresh post-edit**: `PortalsWorkspace.handleRefreshDetail()` viene passato come
`onChanged` al PortalDetail. Dopo ogni mutation refetcha sia il portale aperto
sia la lista (le card si aggiornano in tempo reale).

## Persistenza

File `.md` con YAML frontmatter in directory configurabile:
- **Dev locale**: `Kyron/media/pending-schools-export/`
- **Prod Docker**: `/data/portals/` (env `PENDING_SCHOOLS_EXPORT_DIR`)
- **Coolify**: serve volume mount `/data/portals` su host persistente

## Architettura dati

```
studio (Next.js)                   studio-server (Hono)
    |                                  |
    |  GET /api/v1/portals             | listPortals() — fs.readdir
    |  GET /api/v1/portals/:slug       | getPortal() — fs.readFile
    |  PUT /api/v1/portals/:slug       | updatePortal() — read+merge+write
    |  DELETE /api/v1/portals/:slug    | deletePortal() — fs.unlink
    |  POST /api/v1/portals/:slug/logo | savePortalLogo() — file upload
```

## Side panel (3 modalita')

| Mode | Trigger | Contenuto |
|---|---|---|
| `list` | Default | Elenco portali + ricerca |
| `creating` | Agente inizia onboarding | LivePortalCard skeleton→dati |
| `detail` | `get_portal` tool o click lista | Dettaglio completo portale |

**Layout flip**: in mode `list`/`creating` il grid e' `[1fr_420px]` (chat ampia).
In mode `detail` diventa `[360px_1fr]` (chat stretta, dettaglio ampio).

**PortalsList**: le card sono `<button>` con `onSelect(slug)` — nessuna navigazione
page-level, il dettaglio apre nel side panel via `fetchPortalDetail()`.

## Proxy routes Next.js

`gateway.ts` usa `cookies()` da `next/headers` (server-only). I client component
non possono chiamarlo direttamente. Proxy routes BFF:
- `GET /api/portals` → `listPortals()`
- `GET /api/portals/[slug]` → `getPortal(slug)`
- `PUT /api/portals/[slug]` → `updatePortal(slug, patch)`
- `PUT /api/portals/[slug]/catalog` → `updatePortalCatalog(slug, visibleSlugs)`
- `PUT /api/portals/[slug]/bundles/[bundleSlug]` → `updateBundle(slug, bundleSlug, patch)`
- `DELETE /api/portals/[slug]/bundles/[bundleSlug]` → `removeBundle(slug, bundleSlug)`
- `GET /api/portals/_catalog` → `listSaleorCatalog()` (passthrough catalogo Saleor live)

## Performance streaming

Ogni delta SSE causava re-render completo inclusa colonna destra. Fix:
- Delta handler usa `requestAnimationFrame` throttle (max 60fps)
- `SidePanel` wrappato in `React.memo` con handler `useCallback`

## Lista aggiornamento live

`initialPortals` e' SSR-only; dopo salvataggio agente il pannello lista tornava
vuoto. Fix: stato `portals` client-side + `useEffect` su `draft.saved` che chiama
`/api/portals` e aggiorna lo stato senza page reload.

## Deep link / navigazione diretta

`/portals/[slug]` redirige a `/portals?detail=<slug>`. Il workspace legge
`searchParams.detail` (prop `initialDetailSlug`) e fa `fetchPortalDetail` al
mount per aprire subito il side panel nel mode `detail`. Permette bookmark,
link diretto, e redirect da route obsolete senza perdere il contesto workspace.

## File chiave

**studio-server:**
- `src/features/portals/route.ts` — CRUD routes + logo upload + catalog/bundles + `_catalog` Saleor passthrough
- `src/features/portals/reader.ts` — `listPortals()`, `getPortal()`, `resolvePortal(query)` (fuzzy)
- `src/features/portals/writer.ts` — `updatePortal()`, `updatePortalCatalog()`, `addBundleToPortal()`, `updateBundleInPortal()`, `removeBundleFromPortal()`, `deletePortal()`, `savePortalLogo()`
  - `savePortalLogo` usa `fs.access()` check: durante onboarding il `.md` non esiste ancora
- `src/features/onboard-school/agent.ts` — tutti i tool (12 totali, incl. add/update/remove bundle + update_catalog)
- `src/features/onboard-school/prompt.ts` — system prompt 5 capacita' (incl. FLUSSO AGGIUNGI KIT)

**studio:**
- `src/app/(authed)/portals/page.tsx` — workspace server component (legge `searchParams.detail`)
- `src/app/(authed)/portals/[slug]/page.tsx` — redirect → `/portals?detail=<slug>`
- `src/app/api/portals/route.ts` — proxy GET /api/portals
- `src/app/api/portals/[slug]/route.ts` — proxy GET + PUT /api/portals/:slug
- `src/app/api/portals/[slug]/catalog/route.ts` — proxy PUT catalog
- `src/app/api/portals/[slug]/bundles/[bundleSlug]/route.ts` — proxy PUT + DELETE bundle
- `src/app/api/portals/_catalog/route.ts` — proxy GET Saleor catalog
- `src/components/portals/PortalsWorkspace.tsx` — split-pane + 3-mode panel + memo + `handleRefreshDetail` on mutation
- `src/components/portals/PortalDetail.tsx` — **editor inline** (InlineText, InlinePrice, CatalogEditor, BundleCard)
- `src/components/portals/PortalsChat.tsx` — chat con rAF throttle + draft extraction
- `src/components/portals/LivePortalCard.tsx` — skeleton→data card
- `src/components/portals/PortalsList.tsx` — lista compatta con search (button, no anchor)
- `src/components/chat/generative/LogoUploader.tsx` — upload file generativo
- `src/lib/gateway.ts` — client BFF

## Test manuale

```bash
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev
cd ~/Desktop/Dev/Personal/Kyron/studio && STUDIO_DEV_USER=tua@email npm run dev
# http://localhost:3010/portals → workspace
```
