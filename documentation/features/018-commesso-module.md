---
type: feature
project: studio
created: 2026-08-26
last_verified: 2026-08-27
tags: [agent, catalogo, saleor, prodotti, prezzi, danea, money-path, generative-ui]
---

# Feature 018 — Nico · Catalogo (prodotti, giacenze, prezzi)

## Perche'

Kevin e Robbie vendono, ma per inserire o correggere un prodotto dovevano
chiedere ad Alek: il catalogo si caricava con uno script CLI da 1586 righe
(`ecommerce/seed/import-danea.ts`) che gira solo sul suo Mac. Un cambio prezzo
era un ticket.

`/catalogo` e' il modulo che gli da' autonomia: pannello catalogo a sinistra,
drawer col dettaglio, chat con Nico a destra. Nico legge, crea, modifica,
aggiorna giacenze e prezzi su Saleor **produzione**.

## Il vincolo che guida tutto: il money-path

Scrivere in prod senza gate di approvazione umana e' una scelta esplicita di
Alek. La protezione sta nel codice, non in un click:

- **Due passaggi obbligatori.** `plan_prices` calcola e mostra
  (`PricePlanCard`), `apply_price_plan` scrive e vuole `confirm: true`. Nico
  non puo' cambiare un prezzo in un turno solo.
- **R1 — guardia kit.** Il voucher di un kit scuola e' un importo FISSO in euro
  (decision-011): prezzo pagato = somma componenti sul canale − voucher. Se
  cambia un componente e il voucher resta fermo, il kit si vende al prezzo
  sbagliato **in silenzio**. E' costato ~734 EUR su 25 ordini. Quindi:
  componente di kit senza nuovo voucher nel piano = **piano rifiutato**, non un
  warning.
- **R2 — canale sempre esplicito.** Nessun tool scrive "il prezzo del prodotto".
  Sui canali con promo in percentuale scrivere la base la fa ricalcolare
  all'incontrario (804,82 invece di 799). Se l'utente non nomina il canale,
  Nico chiede.
- **Drift detection al posto dell'approvazione.** `apply_price_plan` ricalcola
  il piano e rilegge ogni prezzo prima di scrivere: se qualcosa si e' mosso da
  quando il piano e' stato mostrato, non scrive **niente**.
- **R3 — un prodotto nuovo nasce non pubblicato** e senza prezzo. La
  pubblicazione e' una chiamata separata.
- **Un solo punto di scrittura prezzo**: `price-writes.ts` →
  `productVariantChannelListingUpdate`.
- **Audit**: una riga `console.info("[commesso] {...}")` per scrittura. I log
  del container sono l'unico posto durevole (il filesystem si azzera a ogni
  redeploy).
- **Niente `delete_product`.** Si de-pubblica dal canale: gli ordini vecchi
  restano attaccati al prodotto.

Il verificatore post-scrittura ora e' **dentro Nico** (dal 27/08/2026: l'agente
Bruno e' stato fuso qui, vedi feature 011). Il motore resta lo stesso codice
deterministico di prima (`price-guard/check.ts`), Nico lo chiama e basta: dopo
`apply_price_plan` il prompt gli impone `check_portal` sul portale toccato,
senza aspettare che l'utente lo chieda.

## Gotcha: la ricerca di Saleor non funziona su questa installazione

Il `filter: { search }` di Saleor si appoggia a una colonna di ricerca del database
che su questa installazione e' vuota: `search: "iPad"` tornava zero risultati con
`Apple iPad A16` in catalogo, mentre `where: { name: { eq } }` lo trovava.
Per questo `listProducts` scarica la pagina di catalogo e filtra in memoria
(`matchesSearch`: nome, slug, categoria, SKU delle varianti).
Ceiling: vale finche' il catalogo sta sotto le 200 righe. Oltre, va ripopolato
il search vector di Saleor.

## I tool

| Tool | Cosa fa | `_ui` |
|---|---|---|
| `list_products({ search, target })` | catalogo, anche non pubblicato | no (muove il pannello via `onEvent`) |
| `get_product({ slug })` | dettaglio + varianti + prezzi per canale | no (apre il drawer) |
| `get_catalog_meta()` | canali, categorie, tipi prodotto, magazzini reali | no |
| `create_product` / `update_product` / `update_variant` / `set_stock` / `add_product_image` | scritture catalogo, **mai prezzi** | no |
| `publish_product({ channelSlug })` | pubblicazione esplicita (R3) | no |
| `plan_prices` | calcola il piano, non scrive | `PricePlanCard` |
| `apply_price_plan({ confirm })` | ricalcola, rilegge, scrive | no |
| `render_danea_uploader` | riquadro di caricamento file | `DaneaUploader` |
| `plan_danea_import` | diff nuovi / prezzi cambiati / invariati | `DaneaImportPlan` |
| `apply_danea_import({ confirm, mappings })` | crea solo le cose nuove | no |
| `run_all_checks()` | Price Guard su tutti i portali, sola lettura | `AnomalyReport` |
| `check_portal({ query })` | Price Guard su un portale (fuzzy match) | `AnomalyReport` |

## Import Danea (fase 2)

Dal CLI da 1586 righe sono state estratte ~250 righe: parser XML,
`groupByAggregator` (aggregatore = `<CustomField1>`), `parseVariantAttrs`,
`slugify`, `COLOR_NORMALIZE`. Buttati: Playwright (350 righe di scraping
apple.com — browser headless dentro una richiesta HTTP), ImageMagick (binario
assente sul server), la tabella `CATALOG` scritta a mano (230 righe di titoli:
ora e' il lavoro dell'agente), `wipeProducts` e il codice Promotion.
`ecommerce/seed/import-danea.ts` **non e' stato toccato**: resta lo strumento
per il full re-import con le immagini.

La regola che decide l'import: **un prezzo nuovo si scrive subito** (una
variante che nasce ora non e' dentro nessun kit), **un prezzo che cambia no** —
quello passa da `plan_prices`, che sa dei voucher (R1). `apply_danea_import`
crea prodotti e varianti nuove col loro prezzo, non pubblicate, e riporta i
prezzi diversi senza toccarli.

I gruppi senza mapping (nome, slug, categoria, tipo prodotto) vengono
**saltati**: il nome commerciale lo propone Nico e lo conferma l'utente, non si
inventa.

## Il collegamento agente ↔ UI

Due direzioni, nessun port nuovo:

1. **Tool result → UI**: `CatalogoWorkspace.onEvent` fa switch su `ev.tool` —
   `list_products` ripopola il pannello e lo marca "selezione dell'agente",
   `get_product` apre il drawer, i tool di scrittura fanno un refetch.
2. **UI → agente**: prop `selectionContext` su `AgentChannel`, appesa al
   messaggio in **uscita** e non alla bolla:
   `[Contesto UI: prodotto selezionato — ...]`. Il prompt dice a Nico di
   rispondere da li' senza rileggere. ~6 righe di diff su `AgentChannel`.

## File

| File | Ruolo |
|---|---|
| `studio-server/src/features/catalogo/reads.ts` | letture admin API (non pubblicati, giacenze, prezzi per canale) |
| `studio-server/src/features/catalogo/price-plan.ts` | **puro**: delta, guardia kit (R1), drift |
| `studio-server/src/features/catalogo/bundle-usage.ts` | chi usa questo prodotto dentro un kit |
| `studio-server/src/features/catalogo/price-writes.ts` | unico punto di scrittura prezzi + audit |
| `studio-server/src/features/catalogo/writes.ts` | scritture catalogo (nessuna tocca un prezzo) |
| `studio-server/src/features/catalogo/plan-service.ts` | glue letture + piano, usato da `plan_prices` e `apply_price_plan` |
| `studio-server/src/features/catalogo/danea-*.ts` | parse, plan, uploads (TTL 1h), apply, service |
| `studio-server/src/features/catalogo/{prompt,agent,route,rest}.ts` | prompt, 13 tool, SSE `/agents/catalogo`, `/api/v1/products` |
| `studio/src/app/(authed)/catalogo/page.tsx` | pagina a due pannelli |
| `studio/src/components/catalogo/{CatalogoWorkspace,ProductsPanel,ProductRow,ProductDrawer}.tsx` | pannello + drawer (cloni di Portali/Ordini) |
| `studio/src/components/chat/generative/{PricePlanCard,DaneaUploader,DaneaImportPlan}.tsx` | card generative |
| `studio/src/app/api/{agent/catalogo,products,products/import}/route.ts` | proxy SSE + lista + upload multipart |

## Test

`studio-server/tests/features/catalogo-price-plan.test.ts` (7) e
`commesso-danea.test.ts` (7). Coprono: delta, warning oltre il 30%, SKU
sconosciuto, prezzo non valido, drift → zero scritture, no-op escluso,
**componente di kit senza voucher → errore**; parsing prezzi con decimali,
raggruppamento per `CustomField1`, warning sottocategorie mescolate, totali del
diff, righe a prezzo zero saltate.

## Gotcha

- **`productVariantCreate` vuole `attributes: []`** anche se non ne servono.
- **Le mutation di listing vogliono l'ID del canale, non lo slug** →
  `resolveChannelId`.
- **`description` Saleor e' un JSONString EditorJS**: in lettura estraiamo i
  paragrafi, in scrittura si ricostruisce il documento.
- **`requireAdmin` gatea tutta la chat `/catalogo`**: da qui si scrivono prezzi
  di produzione. Se Kevin e Robbie non sono admin in Studio serve prima un ruolo
  intermedio — **da verificare al primo giro**.
- **Da verificare una volta**: `GrossPrice1` di Danea e' lordo o netto?
  Controllare **una** variante contro la config fiscale del canale prod.
  Sbagliarlo significa essere del 22% fuori su tutto il catalogo.

## Il pannello (FUT-82, 2026-08-27)

La lista mostra anteprima thumbnail, prezzo di riferimento (main shop, altrimenti
il minimo), dove e' pubblicato col **nome della scuola** e quanto ha venduto.
Ordine: pubblicati prima, piu' venduti sopra, poi alfabetico. Ricerca fuzzy
client-side (`lib/fuzzy.ts`) su nome, SKU e categoria. Skeleton al caricamento,
stagger `.studio-row-in` sulle prime 8 righe, lastra di vetro (`.catalog-glass`,
blur su `::before` — sul nodo diventerebbe containing block del drawer `fixed`).

Il **magazzino non e' in lista**: a chi guarda il catalogo dice poco. Al suo
posto le vendite, che vengono da `commesso/sales.ts`: query ordini leggera
(`status`, `userEmail`, `channel.slug`, `lines{productSku quantity}`), aggregata
per SKU con totale + per canale, senza annullati e senza le email di test
(`ORDERS_REPORT_EXCLUDE_EMAILS`), cache in memoria 15 minuti.
Ceiling: cache non condivisa tra istanze e persa al redeploy — e' un contatore,
non soldi.

I **nomi dei portali** arrivano da Payload (`listPortals().nome`, stesso join del
modulo Ordini), col nome canale Saleor come fallback per il main shop e i portali
pilot senza doc Payload.

Un endpoint solo: `GET /api/v1/products/insights` → `{ channels, sales }`,
relayato da `studio/src/app/api/products/insights/route.ts`. E' contorno: se
cade, il pannello resta in piedi con gli slug e le vendite a zero.

Nel drawer "Pubblicato su" e' una lista ordinata per vendite (nome scuola,
prezzo su quel portale — "da X" se le varianti hanno prezzi diversi — pezzi
venduti) con ricerca fuzzy da 6 portali in su. I prezzi per canale non si
ripetono dentro il blocco variante.

File nuovi: `studio-server/src/features/commesso/sales.ts`,
`studio/src/components/catalogo/{catalog-view.ts,ProductThumbnail.tsx,PortalPrices.tsx}`.

## Cosa resta fuori

- immagini prodotto automatiche (oggi `add_product_image` vuole un URL)
- attributi variante veri (capacita/colore finiscono nel nome della variante)
- cancellazione prodotti, per scelta

## La chat non elenca i prodotti (FUT-82, 2026-08-27)

Nico rispondeva a "cerca iPad" con una lista markdown di 12 prodotti, ognuno con
un'immagine a piena larghezza. Non era CSS: `list_products` versava nel contesto
il `ProductRow` integrale, `imageUrl` compreso, e il modello lo ricopiava.

Tre difese, in ordine di peso:

1. `commesso/prompt.ts` — "REGOLA FERREA dopo list_products": il pannello si
   popola da solo, vietato enumerare, massimo 2 frasi, mai immagini markdown.
   Stessa formula di `vat-relief/prompt.ts` e `onboard-school/prompt.ts`.
2. `commesso/agent.ts` — `experimental_toToolResultContent` su `list_products` e
   `get_product`: al client va il result **intero** (il pannello ci prende le
   thumbnail via `CatalogoWorkspace.onEvent`), al modello una copia senza
   `imageUrl`, `description`, `id`. Se non ha l'URL non puo' incollarlo.
3. `studio`: `.chat-md img { max-height: 140px }` in `globals.css` — rete di
   sicurezza per tutte le chat, non solo per Nico. `MarkdownContent` di
   studio-core non fa override di `img` e non accetta prop `components`, quindi
   il wrapper `<div className="chat-md">` in `ChannelMessage.tsx` e' l'unico
   punto di aggancio.

I prezzi per variante non si elencano: nel drawer il "da X €" di un portale e'
un bottone che apre `VariantPricesPopover` (variante -> prezzo, da
`variantPricesOn`). Div assoluto e non `[popover]` nativo: il preflight Tailwind
azzera il `margin:auto` con cui il browser centra i popover nativi, e sarebbe
codice in piu' per la stessa cosa. In lista il prezzo diventa "da X €" quando le
varianti divergono (`listPriceLabel`), senza popover: un bottone dentro il
bottone della riga.
