---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-26
tags: [data-editor, gateway, payload, chat, agent, workstream-02]
---

# 003 — Modulo Dati con chat agente Editor Dati

## Cosa

Modulo "Dati" in sidebar Studio (icona Database, teal `#0E4F4E`). Lista
collection Payload con count reale + lista record + form edit generico. Colonna
destra split-pane con chat agente "Editor Dati" che opera sugli stessi
endpoint del gateway BFF — l'utente e l'AI lavorano sulla stessa fonte di
verita'.

## Stato

Phase 2 + Phase 3 del workstream 02 completate 2026-05-26. Live in dev su
`/dati`, `/dati/[slug]`, `/dati/[slug]/[id]`. Form generico (auto-detect type)
copre l'80% — Phase 2.5 form Kyron-branded (lexical→markdown, upload, variants)
rimandata.

## Architettura

```
Studio frontend                          studio-server BFF gateway
─────────────                            ────────────────────────
/dati/page.tsx          ─── HTTP ───▶   GET /api/v1/collections
/dati/[slug]/page.tsx   ─── HTTP ───▶   GET /api/v1/collections/:slug
/dati/[slug]/[id]/...   ─── HTTP ───▶   GET/PATCH/DELETE /:slug/:id
                                        │
DataChat (right column) ─── SSE  ───▶   POST /agents/data-editor
                                        │  └ tools: list_records,
                                        │    get_record, update_record,
                                        │    create_record, delete_record
                                        ▼
                                        Payload REST (Authorization:
                                          users API-Key {key})
```

Auth: cookie `kyron-rev` HMAC (in dev firmato al volo da `STUDIO_DEV_USER`).
Header `X-Tenant: kyron`.

## File chiave

| File | Ruolo |
|---|---|
| `src/lib/gateway.ts` | Client server-side verso studio-server; dev-cookie auto-signing |
| `src/app/dati/page.tsx` | Lista collection con count |
| `src/app/dati/[slug]/page.tsx` | Lista record con pickTitle/pickMeta + search (`?q=`) + paginazione prev/next (limit 25) |
| `src/app/dati/[slug]/[id]/page.tsx` | Form edit generico (string/text/number/date/boolean/localized/relation/json) |
| `src/app/dati/[slug]/[id]/actions.ts` | Server Actions save/destroy via gateway |
| `src/app/dati/[slug]/loading.tsx` | Skeleton transition lista |
| `src/app/dati/[slug]/[id]/loading.tsx` | Skeleton transition detail |
| `src/components/data/DataChat.tsx` | Chat client (riusa ChatBubble Virgilio-port) |
| `src/components/data/DataWorkspace.tsx` | Split-pane layout 1fr/420px lg+ |
| `src/app/api/agent/data-editor/route.ts` | Proxy SSE verso studio-server |
| `src/lib/chat-runtime.ts` | `streamAgent` + `streamDataEditor` con eventi delta/tool/tool-result |
| `src/components/shell/modules.ts` | Modulo "Dati" in sidebar |

## Form generico — type detection

Il form ispeziona ogni campo del doc Payload e sceglie l'editor:

| Shape | Tipo form | UI |
|---|---|---|
| `string` ISO date | `date` | `<input type="date">` |
| `string` >120 char | `text` | `<textarea rows=4>` |
| `string` | `string` | `<input type="text">` |
| `number` | `number` | `<input type="number">` |
| `boolean` | `boolean` | `<select>` true/false |
| `{ it, en }` (≤3 keys, locale only) | `localized` / `localized-text` | 2 input/textarea IT + EN affiancati |
| `{ id, name?, slug? }` | `relation` | Chip readonly `#id · label` |
| Array di relations | `relations` | Multi chip readonly |
| Altro | `json` | `<textarea>` JSON pretty-printed |

Relations sono readonly: modificarle dall'agente via `update_record { brand: 25 }`.

## Chat agente Editor Dati

`DataChat.tsx` (client, ⚠️ React 19):
- Greeting context-aware: cita slug + id se sei sul detail
- Eventi SSE: `delta` (text), `tool` (toolName + args), `tool-result`, `error`
- Status visuale durante tool call: `Sto chiamando \`tool_name\`…`
- **Auto-navigation**: se l'agente chiama `get_record` o `update_record` con
  un id diverso da quello corrente → `router.push(/dati/{slug}/{id})` + skeleton
- **Auto-refresh**: al tool-result di un tool mutating
  (`update_record`/`create_record`/`delete_record`) → `router.refresh()` immediato
  (no end-of-stream wait)

Layout: ogni messaggio wrappato in `<div class="flex justify-(start|end)">`
per garantire che user e assistant vadano su righe separate (i ChatBubble sono
inline-flex by default).

## Gotcha

- **Cookie kyron-rev su localhost**: il browser può avere un cookie stale da
  test precedenti (signed con secret diverso). In dev il proxy
  `/api/agent/data-editor` **sostituisce sempre** il cookie con uno firmato
  al volo da `STUDIO_DEV_USER` + `KYRON_REVIEW_SECRET`. Stessa logica in
  `lib/gateway.ts`.
- **Layout chat senza `min-h-0`**: senza questa classe sui parent flex
  l'`overflow-y-auto` cresce con il contenuto e l'input scompare sotto
  viewport. Pattern: `aside h-screen overflow-hidden > div h-full min-h-0
  flex-col > div flex-1 min-h-0 overflow-y-auto`.
- **Auto-scroll**: usare `el.scrollTop = el.scrollHeight` sul container
  interno, NON `scrollIntoView` (muoverebbe la pagina intera).

## Lista record — search + paginazione

Pagina `/dati/[slug]` accetta `?q=` e `?page=`:
- **Search**: form GET nativo (no client component). Delega al gateway che mappa
  `q` su campi per-collection (`SEARCH_FIELDS` in `studio-server`: bandi/eventi → titolo+slug,
  products/brands → name+slug, media → filename+alt, submissions → email+name).
- **Limit**: 25 record/pagina (era 50, ridotto per ridurre scroll).
- **Pagination**: nav prev/next con stati disabled quando fuori range. Nascosto
  se `totalPages === 1`.
- **buildHref helper**: omette `page=1` dalla querystring per URL puliti.
- **Reset**: link visibile solo con query attiva, riporta a `/dati/[slug]`.

Render 100% server-side (no `useState`/`useEffect`) — sfrutta `force-dynamic`
+ Server Component naturale di Next.js App Router.

## Test end-to-end verificati

- `/dati` → 8 collection con count reali (bandi 23, products 80, brands 32, …)
- `/dati/bandi` → 23 record listati (pagina 1/1, niente paginazione)
- `/dati/products?q=mond` → search → 1 record (Mondly by Pearson)
- `/dati/products` → 80 record, 4 pagine (limit 25), nav prev/next funzionante
- `/dati/bandi/24` → form pieno con tutti i campi del bando "Adempimenti
  delle scuole" + chat colonna dx
- Chat "Quanti bandi ci sono?" → `list_records` → "Ci sono un totale di 23 bandi."
- Chat "apri thinglink" → `list_records(q)` → `get_record` → navigazione automatica
  + skeleton al detail
- Chat "metti X come nome" → conferma → `update_record` → form si refresha
  con il nuovo valore

## Vedi anche

- `Kyron/documentation/workstreams/02-studio-agentic-data-layer.md`
- `Kyron/documentation/decisions/decision-014-studio-bff-gateway.md`
- `studio-server` feature 001 (BFF gateway) + 002 (data-editor agent)
