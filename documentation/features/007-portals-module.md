---
type: feature
project: kyron-studio
created: 2026-05-27
last_verified: 2026-06-22
tags: [portals, onboarding, crud, logo-upload, workstream-04, requested-by, capacita, varianti, outside-bundle, duplicate]
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
| Catalogo (onboarding) | `render_product_picker` | Generative UI, prodotti da Saleor live; i prodotti con varianti `capacita` (iPad) appaiono come righe-taglio 128/256/512 selezionabili e scontabili singolarmente |
| Kit (onboarding) | `render_bundle_builder` | Loop esplicito, N kit senza limiti; per i tagli iPad il componente usa `by-attribute` colore (colore scelto al checkout) |
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

## Duplica portale (2026-06-22)

Molte scuole hanno **catalogo e kit identici**: cambia solo l'identita' (nome,
indirizzo, cod. meccanografico, logo). Il bottone **Duplica** (icona `Copy`) su
ogni card della lista crea una nuova **Bozza** clonando la struttura e resettando
l'identita'. Niente piu' ricostruzione a mano dell'onboarding conversazionale.

| Campo | Azione nella copia |
|---|---|
| `catalog` (visibleSlugs, visibleVariants, hiddenSlugs, productDiscounts, flag outsideBundle) | **copiato** verbatim |
| `bundles[]` (slug, name, finalPriceEur, components) | **copiato** verbatim (drop `id` Payload via `writableBundle`) |
| `shipToSchool`, `shippingMethodLabel`, `shippingPriceEur` | **copiati** |
| `slug`, `nome` | **nuovi** (dal popup; slug validato kebab-case + univoco) |
| `branding.nome` | = nuovo nome; `branding.logo` → **reset** (re-upload) |
| `codiceMeccanografico` → `"TBD"`, `sitoUfficiale` → `""` | **reset** |
| `schoolAddress` | **placeholder** (`streetAddress1/city/countryArea="TBD"`, `postalCode="00000"`, `country="IT"`) → reinserimento obbligatorio, evita spedizioni al vecchio indirizzo |
| `status` → `"draft"`, `collectedBy` → `"manual"`, `requestedBy` → utente loggato | **reset/nuovi** |
| `channelId`, `saleorVoucherIds` | **non copiati** — rigenerati all'enable |

**Sicurezza**: la copia non tocca Saleor/Stripe. Channel, voucher, promotion e
Stripe config si generano solo quando si clicca "Abilita" (endpoint `enable`),
coerente col gotcha "channelId diverge staging/prod". Finche' resta Bozza non
compare su `kyronedu.it/shop`.

**Flusso UI**: click Duplica → `DuplicatePortalModal` (nome + slug, slug derivato
dal nome finche' non toccato) → POST → la Bozza appare in lista e si apre subito
il dettaglio per gli aggiustamenti inline. Slug gia' esistente → 400, il modal
resta aperto col messaggio. `duplicatePortal(sourceSlug, {newSlug, newNome})` in
`writer.ts` legge la sorgente via `getPortal()` e fa `gateway.create()`.

Endpoint: `POST /api/portals/[slug]/duplicate` (proxy) → studio-server
`POST /api/v1/portals/:slug/duplicate` (`requestedBy = c.get("studioUser").email`).

**Gotcha campi indirizzo `required` (fix 2026-06-25)**: la collection
`pending-schools` ha 5 campi `schoolAddress` obbligatori (`streetAddress1`,
`postalCode`, `city`, `countryArea`, `country`) e **nessun draft versioning** →
Payload valida i `required` anche per una Bozza. La prima versione di
`buildClonedDoc` svuotava l'indirizzo (`{country:"IT"}`) → `gateway.create`
falliva con `ValidationError` rigirato come **400** ("Duplicazione fallita.
Riprova."), bloccando *ogni* duplicazione. Fix: `ADDRESS_PLACEHOLDER` con `"TBD"`
(stessa convenzione di `codiceMeccanografico`). Test di regressione:
`tests/features/portals-duplicate.test.ts`.

**Go-live**: in produzione su `studio.kyronedu.it` dal 2026-06-22 (commit `feat(portals): duplica portale` su studio + studio-server, redeploy Coolify manuale via API — l'autodeploy webhook non e' attivo). Annuncio interno al team via mail "da Panzerottino" (`documentation/emails/2026-06-22-duplica-portale-panzerottino/`).

## Go-live su Saleor (enable) — target best-effort (2026-06-29)

`enablePortal(slug, ["staging","prod"])` (studio-server `enable/enable.ts`)
applica gli step Saleor sui target **in ordine, staging per primo**. Dal
2026-06-29 i target **non-prod sono best-effort**: un fallimento su staging
finisce in `report.targetErrors` (riportato all'utente dall'agente) ma **non
blocca** la pubblicazione su prod; **solo un errore su prod è fatale**. Coerente
con "staging è solo smoke test" (cloni DB separati, channelId divergenti).

**Perché**: staging e prod sono DB Saleor separati, un bump prezzi su prod non
tocca staging. Prima del fix un listino vecchio su staging faceva `throw` in
`resolveBundleSaving` (kit con `saving = sum(componenti) − prezzoKit <= 0`) e,
girando staging per primo, uccideva l'intera pubblicazione prima di arrivare a
prod. Il voucher del kit è FIXED: il prezzo MOSTRATO del kit deve sempre stare
SOTTO la somma dei componenti, altrimenti il voucher sarebbe negativo (blocco
legittimo). Vedi memory `portal-enable-staging-price-drift` + diary umbrella
`2026-06-29`.

## Persistenza

Collection Payload `pending-schools` (vedi `cms/payload/collections/PendingSchools.ts`),
accessibile via gateway BFF studio-server (decision-014, decision-016).
Persistenza nativa Postgres del cms — sopravvive ai redeploy di studio-server.
Logo file su Payload Media collection (`/api/media`).

Fonte di verita' unica. L'hook `cms/payload/hooks/exportPendingSchoolMarkdown.ts`
resta in vita ma e' solo **artefatto export downstream** quando un portale
passa a `status === "approved"` (consumato da `ecommerce/seed/onboard-school.ts`).

## Tagli (capacita') + vendita fuori bundle

I prodotti Saleor con attributo variante `capacita` (oggi iPad: 128/256/512, prezzi
389/519/769, uniformi per colore) vengono espansi dal gateway
(`studio-server/core/saleor/client.ts`) in **una riga per taglio**. Chiave-riga
composita `id = slug#capacitySlug` (es. `ipada16#128gb`); il colore resta scelta del
cliente al checkout.

| Concetto | Modello dati | Dove |
|---|---|---|
| Taglio pubblicato a catalogo | `catalog.visibleVariants: [{productSlug, attribute:"capacita", value}]` | solo le SKU del taglio ricevono il channel listing nel seed (es. Orsoline solo 128GB) |
| Sconto per-taglio | `catalog.productDiscounts[].capacity` | `eur` = prezzo finale sulle SKU del taglio; `percent` = Promotion CATALOGUE `variantPredicate` (seed) |
| Taglio nel kit | bundle component `selection: by-attribute` colore + `valueFilter:{capacita}` | il cliente sceglie il colore al checkout |
| Vendibile fuori dal bundle (informativo) | `catalog.heroOutsideBundle` / `catalog.accessoriesOutsideBundle` (bool) | raccolto in onboarding, propagato in mail/descriptor; nessuna logica di vendita (gestita dal seed) |
| Visualizzazione pannello | `reader.ts` PortalDetail espone visibleVariants + productDiscounts.capacity + flag; `PortalDetail.tsx` sezioni readonly "Tagli pubblicati", "Sconti", "Vendita fuori dal bundle"; `productCount` = visibleSlugs + visibleVariants | il gateway DEVE esporre i campi, altrimenti il pannello non li mostra (bug 2026-06-09) |
| Logo | upload → Payload Media → `branding.logo` (id); `reader.ts` espone `branding.logoUrl` assoluto (origin payloadApiUrl + media.url, depth:1); `PortalDetail.tsx` sezione "Logo" `<img>` | il file va comunque salvato in `storefront/public/tenants/<slug>/logo.png` per il seed |
| Logo in mail | `cms/notifyPortalCreated.ts` risolve il media e lo **allega** (base64 da volume `media/` o fetch URL) + inline `<img>` + nota path | solo su `create` (hook afterChange) |

La selezione catalogo e gli sconti sono iniettati **deterministicamente** dalla submission
ProductPicker (`extractPickerSelection` in `agent.ts`), non dall'LLM. Submission:
`{selections:[{slug,capacitySlug?}], productDiscounts:[{slug,capacitySlug?,kind,value}]}`;
BundleBuilder: `{name, priceEur, components:[{slug,capacitySlug?}]}`.

Campi additivi su Payload (`visibleVariants` json, 2 checkbox outsideBundle) →
richiede `PAYLOAD_PUSH=true` in dev e rigenerazione `db/schema.sql` per prod.

## Agente richiedente (`requestedBy`)

Ogni onboarding registra **quale utente Studio loggato** lo ha avviato (campo `requestedBy`,
email). Catena: la route `/agents/onboard-school` di studio-server e' protetta da
`studioAuthMiddleware` (cookie `kyron-rev`) → `c.get("studioUser").email` →
`runOnboardSchoolAgent({ userEmail })` → tool `save_pending_school` →
`writePendingSchoolMarkdown(doc, userEmail)` → campo `requestedBy` su `pending-schools`.

| Punto | Comportamento |
|---|---|
| Auth | onboarding **richiede login** (401 senza cookie valido), coerente con data-editor/review-editor |
| Lista | `PortalsList` mostra l'email (icona `User`) sotto i meta città/prodotti/kit, solo se valorizzato |
| Dettaglio | `PortalDetail` → riga "Richiesto da" nella card INFORMAZIONI |
| Mail | feature cms-032: subject + body della mail Resend includono `requestedBy` |
| Display | email completa (es. `a.ravelli@kyronedu.it`), nessuna mappatura nome |

Campo additivo/nullable su Payload → richiede `PAYLOAD_PUSH=true` in dev e rigenerazione
`db/schema.sql` per prod (vedi GOTCHA "Schema DB in produzione" in `cms/CLAUDE.md`).

## Architettura dati

```
studio (Next.js)                   studio-server (Hono)              cms Payload
    |                                  |                                |
    |  GET /api/v1/portals             | listPortals() ────────────────> GET /api/pending-schools
    |  GET /api/v1/portals/:slug       | getPortal()   ────────────────> GET /api/pending-schools?where[slug][equals]
    |  PUT /api/v1/portals/:slug       | updatePortal() ───────────────> PATCH /api/pending-schools/:id
    |  DELETE /api/v1/portals/:slug    | deletePortal() ───────────────> DELETE /api/pending-schools/:id
    |  POST /api/v1/portals/:slug/logo | savePortalLogo() ─────────────> POST /api/media (multipart) + PATCH branding.logo
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
- `src/features/portals/gateway.ts` — helper `getPortalsGateway()` lazy singleton sul Payload gateway (decision-016)
- `src/features/portals/route.ts` — CRUD routes + logo upload + catalog/bundles + `_catalog` Saleor passthrough
- `src/features/portals/reader.ts` — `listPortals()`, `getPortal()`, `findPortalDoc()`, `resolvePortal(query)` (fuzzy in-memory) sopra Payload REST
- `src/features/portals/writer.ts` — `updatePortal()`, `updatePortalCatalog()`, `addBundleToPortal()`, `updateBundleInPortal()`, `removeBundleFromPortal()`, `duplicatePortal()`, `deletePortal()` (PATCH/DELETE/create Payload)
- `src/features/portals/logo.ts` — `savePortalLogo()`: multipart POST a `/api/media` + PATCH `branding.logo` con Media ID
- `src/features/onboard-school/markdown-writer.ts` — `writePendingSchoolMarkdown()` -> create/update su `pending-schools` (nome del file storico, semantica Payload)
- `src/features/onboard-school/agent.ts` — tutti i tool (12 totali, incl. add/update/remove bundle + update_catalog)
- `src/features/onboard-school/prompt.ts` — system prompt 5 capacita' (incl. FLUSSO AGGIUNGI KIT)
- `scripts/migrate-portals-md-to-payload.ts` — migrazione one-shot dei `.md` residui dev verso Payload

**studio:**
- `src/app/(authed)/portals/page.tsx` — workspace server component (legge `searchParams.detail`)
- `src/app/(authed)/portals/[slug]/page.tsx` — redirect → `/portals?detail=<slug>`
- `src/app/api/portals/route.ts` — proxy GET /api/portals
- `src/app/api/portals/[slug]/route.ts` — proxy GET + PUT /api/portals/:slug
- `src/app/api/portals/[slug]/catalog/route.ts` — proxy PUT catalog
- `src/app/api/portals/[slug]/bundles/[bundleSlug]/route.ts` — proxy PUT + DELETE bundle
- `src/app/api/portals/[slug]/duplicate/route.ts` — proxy POST duplica portale (2026-06-22)
- `src/app/api/portals/_catalog/route.ts` — proxy GET Saleor catalog
- `src/components/portals/PortalsWorkspace.tsx` — split-pane + 3-mode panel + memo + `handleRefreshDetail` on mutation + `handleDuplicatePortal`
- `src/components/portals/DuplicatePortalModal.tsx` — popup duplica (nome + slug, slugify live) (2026-06-22)
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
