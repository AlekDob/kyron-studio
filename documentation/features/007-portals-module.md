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
| `/portals/[slug]` | Pagina dettaglio standalone |

## Capacita' agente

| Azione | Tool | Note |
|---|---|---|
| Creare portale | `save_pending_school` | Onboarding conversazionale 8 step |
| Elencare portali | `list_portals` | Mostra nel side panel |
| Dettaglio portale | `get_portal` | Naviga al side panel detail |
| Modificare portale | `update_portal` | Campi singoli, null = invariato |
| Eliminare portale | `delete_portal` | Richiede conferma scritta del nome |
| Upload logo | `render_logo_uploader` | Componente generativo con upload diretto |
| Catalogo | `render_product_picker` | Generative UI, prodotti da Saleor live |
| Kit/bundle | `render_bundle_builder` | Loop esplicito, N kit senza limiti |

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

## Performance streaming

Ogni delta SSE causava re-render completo inclusa colonna destra. Fix:
- Delta handler usa `requestAnimationFrame` throttle (max 60fps)
- `SidePanel` wrappato in `React.memo` con handler `useCallback`

## Lista aggiornamento live

`initialPortals` e' SSR-only; dopo salvataggio agente il pannello lista tornava
vuoto. Fix: stato `portals` client-side + `useEffect` su `draft.saved` che chiama
`/api/portals` e aggiorna lo stato senza page reload.

## File chiave

**studio-server:**
- `src/features/portals/route.ts` — CRUD routes + logo upload
- `src/features/portals/reader.ts` — `listPortals()`, `getPortal()`
- `src/features/portals/writer.ts` — `updatePortal()`, `deletePortal()`, `savePortalLogo()`
  - `savePortalLogo` usa `fs.access()` check: durante onboarding il `.md` non esiste ancora
- `src/features/onboard-school/agent.ts` — tutti i tool
- `src/features/onboard-school/prompt.ts` — system prompt 4 capacita'

**studio:**
- `src/app/(authed)/portals/page.tsx` — workspace server component
- `src/app/api/portals/route.ts` — proxy GET /api/portals
- `src/app/api/portals/[slug]/route.ts` — proxy GET /api/portals/:slug
- `src/components/portals/PortalsWorkspace.tsx` — split-pane + 3-mode panel + memo
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
