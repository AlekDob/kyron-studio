---
type: feature
project: studio
created: 2026-08-26
last_verified: 2026-08-26
tags: [agent, commesso, saleor, prodotti, prezzi, danea, money-path, generative-ui]
---

# Feature 018 — Kevin · Commesso (catalogo prodotti)

## Perche'

Kevin e Robbie vendono, ma per inserire o correggere un prodotto dovevano
chiedere ad Alek: il catalogo si caricava con uno script CLI da 1586 righe
(`ecommerce/seed/import-danea.ts`) che gira solo sul suo Mac. Un cambio prezzo
era un ticket.

`/commesso` e' il modulo che gli da' autonomia: pannello catalogo a sinistra,
drawer col dettaglio, chat con Kevin a destra. Kevin legge, crea, modifica,
aggiorna giacenze e prezzi su Saleor **produzione**.

## Il vincolo che guida tutto: il money-path

Scrivere in prod senza gate di approvazione umana e' una scelta esplicita di
Alek. La protezione sta nel codice, non in un click:

- **Due passaggi obbligatori.** `plan_prices` calcola e mostra
  (`PricePlanCard`), `apply_price_plan` scrive e vuole `confirm: true`. Kevin
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
  Kevin chiede.
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

Il verificatore post-scrittura c'e' gia': Bruno (`price-guard`, feature 011) e'
sola lettura e deterministico. Dopo un cambio prezzo su un portale si gira
`run_all_checks`.

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
**saltati**: il nome commerciale lo propone Kevin e lo conferma l'utente, non si
inventa.

## Il collegamento agente ↔ UI

Due direzioni, nessun port nuovo:

1. **Tool result → UI**: `CommessoWorkspace.onEvent` fa switch su `ev.tool` —
   `list_products` ripopola il pannello e lo marca "selezione dell'agente",
   `get_product` apre il drawer, i tool di scrittura fanno un refetch.
2. **UI → agente**: prop `selectionContext` su `AgentChannel`, appesa al
   messaggio in **uscita** e non alla bolla:
   `[Contesto UI: prodotto selezionato — ...]`. Il prompt dice a Kevin di
   rispondere da li' senza rileggere. ~6 righe di diff su `AgentChannel`.

## File

| File | Ruolo |
|---|---|
| `studio-server/src/features/commesso/reads.ts` | letture admin API (non pubblicati, giacenze, prezzi per canale) |
| `studio-server/src/features/commesso/price-plan.ts` | **puro**: delta, guardia kit (R1), drift |
| `studio-server/src/features/commesso/bundle-usage.ts` | chi usa questo prodotto dentro un kit |
| `studio-server/src/features/commesso/price-writes.ts` | unico punto di scrittura prezzi + audit |
| `studio-server/src/features/commesso/writes.ts` | scritture catalogo (nessuna tocca un prezzo) |
| `studio-server/src/features/commesso/plan-service.ts` | glue letture + piano, usato da `plan_prices` e `apply_price_plan` |
| `studio-server/src/features/commesso/danea-*.ts` | parse, plan, uploads (TTL 1h), apply, service |
| `studio-server/src/features/commesso/{prompt,agent,route,rest}.ts` | prompt, 13 tool, SSE `/agents/commesso`, `/api/v1/products` |
| `studio/src/app/(authed)/commesso/page.tsx` | pagina a due pannelli |
| `studio/src/components/commesso/{CommessoWorkspace,ProductsPanel,ProductRow,ProductDrawer}.tsx` | pannello + drawer (cloni di Portali/Ordini) |
| `studio/src/components/chat/generative/{PricePlanCard,DaneaUploader,DaneaImportPlan}.tsx` | card generative |
| `studio/src/app/api/{agent/commesso,products,products/import}/route.ts` | proxy SSE + lista + upload multipart |

## Test

`studio-server/tests/features/commesso-price-plan.test.ts` (7) e
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
- **`requireAdmin` gatea tutta la chat `/commesso`**: da qui si scrivono prezzi
  di produzione. Se Kevin e Robbie non sono admin in Studio serve prima un ruolo
  intermedio — **da verificare al primo giro**.
- **Da verificare una volta**: `GrossPrice1` di Danea e' lordo o netto?
  Controllare **una** variante contro la config fiscale del canale prod.
  Sbagliarlo significa essere del 22% fuori su tutto il catalogo.

## Cosa resta fuori

- immagini prodotto automatiche (oggi `add_product_image` vuole un URL)
- attributi variante veri (capacita/colore finiscono nel nome della variante)
- cancellazione prodotti, per scelta
