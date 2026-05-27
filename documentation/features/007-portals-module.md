---
type: feature
project: kyron-studio
created: 2026-05-27
last_verified: 2026-05-27
tags: [portals, onboarding, dashboard, workstream-04]
---

# 007 — Modulo Portali

## Cosa

Modulo unificato "Portali" nella sidebar (ex "Onboarding scuole" + "Portali scuole").
Due route:

| Route | Scopo |
|---|---|
| `/portals` | Dashboard con griglia card dei portali scuola configurati |
| `/portals/new` | Chat agentica per raccogliere dati di un nuovo portale |

## Perche'

Il modulo "Onboarding scuole" era solo la chat. Mancava una vista d'insieme dei
portali gia' configurati — stato, citta', catalogo, kit. "Portali" unifica
creazione e gestione in un unico punto.

## Architettura dati

I portali sono file `.md` con YAML frontmatter in
`Kyron/media/pending-schools-export/`. L'agente onboarding li scrive via
`markdown-writer.ts` (studio-server). La dashboard li legge via API:

```
studio (Next.js)                   studio-server (Hono)
    │                                  │
    │  GET /api/v1/portals             │
    ├──────────────────────────────────►│
    │                                  │ fs.readdir() + parseFrontmatter()
    │  PortalSummary[]                 │
    ◄──────────────────────────────────┤
    │                                  │
    │ PortalsDashboard (card grid)     │
```

## File chiave

**studio-server:**
- `src/features/portals/route.ts` — `GET /` (lista) e `GET /:slug` (dettaglio)
- `src/features/portals/reader.ts` — `listPortals()`, `getPortal()`, parser frontmatter

**studio:**
- `src/app/(authed)/portals/page.tsx` — dashboard server component
- `src/app/(authed)/portals/new/page.tsx` — chat onboarding (ex `/schools/onboarding`)
- `src/components/PortalsDashboard.tsx` — griglia card + empty state + CTA
- `src/components/shell/modules.ts` — modulo "Portali" (id: `portals`, href: `/portals`)
- `src/lib/gateway.ts` — `listPortals()` client BFF

## Card portale

Ogni card mostra:
- Nome scuola + slug
- Stato: Bozza / Da rivedere / Approvato / Live (con Pill colorata)
- Citta' + provincia
- Conteggio prodotti e kit
- Data raccolta + origine (Agente / Manuale)

## Status portale

| Valore | Label | Significato |
|--------|-------|-------------|
| `draft` | Bozza | Appena raccolto dall'agente, non ancora revisionato |
| `review` | Da rivedere | Alek deve controllare i dati |
| `approved` | Approvato | Pronto per onboarding su Saleor |
| `onboarded` | Live | Portale attivo su storefront |

Lo status e' scritto nel frontmatter del `.md`. Oggi l'agente scrive sempre
`status: "draft"`. La transizione avviene manualmente (edit del file) — in
futuro, azioni nella dashboard.

## Test manuale

```bash
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev
cd ~/Desktop/Dev/Personal/Kyron/studio && STUDIO_DEV_USER=tua@email npm run dev
# http://localhost:3010/portals → dashboard
# http://localhost:3010/portals/new → chat onboarding
```
