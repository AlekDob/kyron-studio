# Studio — CLAUDE.md

Hub admin Kyron a `studio.kyronedu.it`. Sotto-progetto di `/Kyron`, registrato in
`Kyron/documentation/code-map.md`.

## Stack

- Next.js 16 + React 19 + TS strict
- Tailwind v4 CSS-first (token in `src/app/globals.css`, no `tailwind.config.ts`)
- AI SDK + assistant-ui per la chat di onboarding (proxy SSE verso `studio-server`)
- Auth Payload via cookie `.kyronedu.it`
- UI: design system port da Virgilio (copy-paste, vedi feature 001)

## Stato corrente

**Shell completo Virgilio-style live** (2026-05-26):

- Sidebar laterale 248px con 7 moduli (Inbox, **Portali**, **Dati**, Anteprima, Brain, Log, Impostazioni)
- Dashboard `/` con ricerca live + griglia agenti/strumenti
- Command palette `Cmd+K` (cmdk)
- Theme toggle light/dark (persistenza localStorage)
- Pagina `/settings` con tabs Virgilio-style (Connessioni, Modelli AI, Tema live)
- Modulo **Portali** (`/portals`): dashboard griglia card con stato, citta', prodotti, kit
- Pagina `/portals/new` con chat agentica onboarding (ex `/schools/onboarding`)

**Agentic data layer live** (workstream 02 phase 1-3 done, 2026-05-26):
- Modulo "Dati" — lista collection con count, lista record, form edit generico
- Split-pane: form a sinistra + chat agente "Editor Dati" a destra (5 tool su gateway BFF)
- Agente naviga automaticamente al detail su `get_record`, refresha al tool-result mutating
- Form: type detection esteso (localized IT/EN, relations come chip readonly, json solo fallback)
- Skeleton loading transitions, auto-scroll chat, dev-cookie auto-signing
- Lista record con search (`?q=`) + paginazione prev/next (limit 25)

**Studio standalone live** (workstream 03 phase 1-7 done, 2026-05-27):
- Login OTP proprio (`/login`) — no piu' dipendenza dal cms
- Modulo "Anteprima": iframe `staging.kyronedu.it` con handshake postMessage cms-side
- Selezione/hover live → outline disegnato lato studio, chip pendingTarget nel composer chat
- Agente Review Editor con `propose_annotation` reso come `ProposalCard` inline (Conferma/Modifica/Annulla)
- Bundle annotazioni: top-3 inline + drawer "Vedi tutte" responsive (slide-from-right desktop, bottom sheet mobile) con drawer dettaglio annidato
- Phase 6: toggle select/browse + DOM context strutturato (outline tree + images) nell'evento selezione → agente riceve struttura sezione; drawer 540px polished; dev cookie middleware Edge-compatible
- Phase 7: conferma proposta sync (no round-trip agente, ack locale); annotazione manuale via `ManualAnnotationForm` (kind + testo + hint immagine + nota) accessibile dalla `SelectionChip`
- Output finale: `.md` via `/api/review/send` (Resend) ad Alek — agente non scrive mai su Payload
- Redirect 308 da `/studio/*` su cms → `studio.kyronedu.it`
- Vedi feature 005-preview-review-editor per dettagli Phase 5/5b/6

**Ruoli & gestione utenti live** (feature 008, 2026-06-08):
- Allowlist + ruoli (admin/editor) su collection Payload `studio-users` (non piu' env var)
- Impostazioni → Organizzazione (admin-only): invita/cambia ruolo/disattiva/rimuovi utenti
- Sezioni admin-only: Connessioni, Modelli AI, MCP, Organizzazione (editor vedono solo Tema)
- Authz reale lato studio-server (`requireAdmin`), anti-lockout, fallback bootstrap `KYRON_ADMIN_EMAILS`

**Da fare** (placeholder "presto"):
- Route reali per Inbox, Portali, Brain, Log
- Sezioni settings: Profilo, MCP Servers
- Logo Kyron definitivo (oggi placeholder testuale "K + Studio")

Vedi `documentation/features/` per dettagli.

## Come far partire

```bash
# Terminale 1 — backend
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev

# Terminale 2 — frontend
cd ~/Desktop/Dev/Personal/Kyron/studio
STUDIO_DEV_USER=tua@email npm run dev    # bypass auth in dev
# http://localhost:3010
```

## Deploy (produzione)

Live su `https://studio.kyronedu.it` (Coolify + Hetzner CCX23).

- **Repo GitHub**: `AlekDob/kyron-studio` (frontend), `AlekDob/kyron-studio-server` (backend)
- **Workflow**: push su `main` → GitHub App `coolify-kyron` triggera il build Docker + deploy
- **Fallback manuale**: `POST http://178.105.157.128:8000/api/v1/deploy?uuid=<app-uuid>` con Bearer token Coolify
- **App UUIDs**: studio = `qp5tw0o90drest5wnnof8647`, studio-server = `x5bzjhuxbl4ab4j5tnkbckq0`
- Dettagli env vars e setup: `Kyron/documentation/inbox/2026-05-26-coolify-deploy-studio.md`

## Knowledge base

- `documentation/features/001-shell-sidebar-dashboard.md` — sidebar + dashboard + command palette
- `documentation/features/002-settings-tabs-layout.md` — settings tabs layout
- `documentation/features/003-dati-module.md` — modulo Dati + chat agente Editor Dati
- `documentation/features/004-login-standalone.md` — OTP login (workstream 03)
- `documentation/features/005-preview-review-editor.md` — Anteprima iframe + agente Review Editor (workstream 03)
- `documentation/features/006-generative-ui-chat.md` — Generative UI in chat onboarding (workstream 04, PoC ProductPicker)
- `documentation/features/007-portals-module.md` — Modulo Portali: dashboard + onboarding unificati
- `documentation/features/008-organization-users.md` — Utenti & ruoli (admin/editor), tab Organizzazione, collection `studio-users`
- `documentation/features/009-analytics-module.md` — Modulo Analytics: KPI + chart Recharts + breakdown dinamica per tenant da PostHog (decision-017, BFF studio-server feature 005)
- Cross-progetto: `Kyron/documentation/workstreams/03-studio-standalone.md` — login OTP, preview iframe, review system
- `documentation/diary/` — changelog locale
- Cross-progetto: `Kyron/documentation/workstreams/01-studio-shell-port.md`
- Cross-progetto: `Kyron/documentation/workstreams/02-studio-agentic-data-layer.md`
- Cross-progetto: `Kyron/documentation/decisions/decision-014-studio-bff-gateway.md`
- Origine form: `Kyron/cms/documentation/features/029-studio-dashboard.md` (rev 1-5)

## Convenzioni (ereditate da Kyron group)

- **20-line** functions max
- **300-line** files max
- **Domain-driven** (organizzazione per feature, non per tech)
- **Naming**: `verbNoun`, `PascalCase`, `UPPER_SNAKE`
- **No `any`**
- **No emoji** nel frontend/UI
- Tutti i file UI portati da Virgilio hanno header `// Source: Virgilio @virgilio/ui ...`
  per tracciabilita' verso il futuro estrazione del core agnostico.

## Decisioni di riferimento

- `Kyron/documentation/decisions/decision-012-studio-admin-hub.md` — Studio come hub
  agentico, **coesiste** con `kyronedu.it/studio` (feature 029, dashboard editoriale Roberto).
- `Kyron/documentation/decisions/decision-013-studio-server-as-horizontal-product.md`
  — studio-server come prodotto orizzontale
- **Strategia riuso UI Virgilio** (2026-05-26, diary): copy-paste con header
  `// Source: ...` invece di workspace pnpm. Trigger di estrazione del core
  agnostico (`Personal/studio/packages/core-ui`) e' "2+ clienti reali che
  riusano lo stesso shell" — non soddisfatto oggi.

## Sibling

- `/Kyron/studio-server` — backend agentico (tenant-aware via `X-Tenant`)
- `/Kyron/cms` — Payload CMS (auth + collection `PendingSchools`)
- `/Kyron/ecommerce` — Saleor + storefront (consuma il `.md` esportato da Payload)
