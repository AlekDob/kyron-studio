---
type: feature
project: studio
created: 2026-06-14
status: shipped
tags: [orders, ordini, commerciali, portali, saleor]
---

# Feature 010 — Modulo Ordini

> **Update 2026-08-31 — Nico resta qui, il catalogo passa a Teo**
>
> Il modulo Catalogo e' diventato **Prodotti** con un agente suo, **Teo**
> (feature 018): Nico tiene ordini + comunicazioni DDT e nient'altro. In sidebar
> Ordini e Prodotti sono le due voci in cima (`pinned`), con la nota "Nico" e
> "Teo" accanto alla label.

> **Update 2026-08-28 (3) — ricerca e filtri lato server, guidati da Nico**
> I filtri non stanno piu' in memoria nel pannello: sono un **motore di query
> generico** in studio-server (`src/core/query/spec.ts`) — condizioni JSON validate
> zod (`all` = AND, `any` = OR, `sort`), valutate su una **mappa campi** per dominio
> (`src/features/orders/query-fields.ts`, `ORDER_FIELDS`: numero, cliente, totale,
> data, portale, agente, `metodoPagamento`, `prodotti` = SKU+nomi righe, ecc.).
> Aggiungere Prodotti domani = scrivere una seconda `FieldMap`, il motore e' gia' li'.
>
> - `GET /api/v1/orders` accetta `portal`, `agent`, `status`, `q` **e** `spec` (query
>   JSON urlencoded, 400 se malformata) e risponde anche con `buckets` (conteggio +
>   euro per stato, calcolati su tutto tranne lo stato), `portals` e `agents`.
> - `list_orders` di Nico prende `from`, `to`, `spec`: compone lui la query ("sopra
>   600 euro non confermati di r.russo", "con un iPad pagati con Carta del Docente").
>   La spec attiva viaggia nel `[Contesto UI: ...]`, cosi' raffina invece di ricominciare.
> - **Una sola `statusBucketOf`** (era in tre copie: route, tool, pannello — quando
>   divergevano i conteggi in chat non tornavano coi KPI in pagina).
> - Frontend: ogni filtro sta **nell'URL**, `OrdersView` non filtra piu' niente.
>   Filtro complesso = link condivisibile, indietro/avanti del browser funzionano.
>   Ricerca con debounce 300ms. Testata: le `StatTile` della dashboard in taglia `sm`
>   (`OrdersTiles.tsx`), le tre di stato cliccabili come filtro.
> - Cache di processo 60s su `fetchOrdersForRange` (invalidata dalle scritture):
>   senza, ogni tocco di filtro riscaricava l'intero range da Saleor.

> **Update 2026-09-05 — metodo di pagamento in lista** (FUT-110, chiesto da Miolli).
> Nella riga della lista ordini, dopo scuola e agente, compare **Bonifico / Carta
> docente / Stripe**: la contabilizzazione si fa scorrendo la lista, senza aprire il
> singolo ordine. Nessun dato nuovo dal server — `paymentMethod` c'era gia';
> l'etichetta sta in `orders/format.ts` (`paymentMethodLabel`). Metodo vuoto con
> riferimento Stripe = "Stripe"; vuoto e senza psp = niente etichetta (non
> inventiamo).

> **Update 2026-08-28 (2) — scheda a tab, icone di vetro, note scritte da Nico**
> (stesso branch). La scheda e' divisa in **Cliente / Pagamento / Prodotti / Note**;
> lo **stato lavorazione** resta fuori dai tab, e' l'azione piu' frequente. Le due
> colonne con container query spariscono: i tab fanno lo stesso lavoro con meno codice.
> `ORDER_TABS` sta in `orders-filter.ts` e non nel componente, perche' lo schema della
> ricevuta lo importa e non deve tirarsi dietro il grafo client.
> **Icone**: `orders/detail-section.tsx` — pastiglia di vetro colorata (`color-mix`
> sulla tinta + `backdrop-blur` + molla framer-motion al hover), una tinta per
> argomento: indaco cliente, verde soldi, ambra prodotti, viola note. Stesso
> componente in testata di sezione e dentro i tab.
> **Il tab lo cambia anche l'agente**: vive in `OrdersWorkspace`, scende a
> `OrdersView` → `OrderDetail`/`OrderDrawer`. `get_order` accetta `tab` e lo mette nel
> descriptor `_ui`, `applyReceipt` lo applica.
> **Nuovo tool `add_order_note`** (studio-server, `commesso/order-tools.ts`): ACCODA
> una riga a `kyron_note`, mai sovrascrive — il campo e' condiviso con l'operatore e
> finisce nelle FootNotes dell'export Danea. Non manda niente al cliente. La ricevuta
> ha `refresh: true`, se no il pannello mostrerebbe la nota di prima.

> **Update 2026-08-28 — dettaglio al centro, Nico su mobile, prova shadcn** (branch
> `feat/orders-detail-center`, non pushato). Con la chat dell'agente fissa a destra il
> drawer laterale la copriva: l'ordine aperto ora prende la **colonna centrale** al posto
> della lista (barra "indietro" + `Esc`), cosi' Nico vede l'ordine mentre ci lavora.
> Nuovo `orders/OrderDetail.tsx` = corpo scorporato da `OrderDrawer.tsx` (che resta il solo
> guscio bottom-sheet su mobile); due colonne via **container query** (`@container` +
> `@3xl:`) e non breakpoint di finestra, perche' la larghezza cambia col resize della chat.
> **Mobile**: `shell/MobileChatOverlay` monta la faccia di Nico in basso a destra sotto i
> 1024px → bottom sheet con lo stesso `AgentChannel` (nuovo prop `hideHeader`, se no due
> testate). La **ricevuta in chat e' diventata un bottone**: riapplica filtro/scheda e
> chiude la sheet (`orders/orders-panel-context.ts` + `useCloseMobileChat`); la logica di
> applicazione e' estratta in `applyReceipt()`, condivisa con l'evento agente.
> **Prova shadcn + Animate UI solo qui**: `components.json` scritto a mano (mai
> `shadcn init` — su Tailwind v4 appende il suo set OKLCH + blocco `.dark`), blocco
> `@theme inline` in `globals.css` che mappa i nomi shadcn sui nostri token, componenti in
> `src/components/shadcn/`. Animate UI riportata a `framer-motion` (gia' installato) invece
> di `motion`, per non avere due copie in bundle. Applicato: `Section` del dettaglio come
> `Card`, righe lista che entrano a scalare (`Slides`). Non toccati `Pill` e il `Section`
> condiviso di `drawer-primitives` (li usano anche Portali e Catalogo).

> **Update 2026-07-27 — link al modulo Agevolazioni**: nel drawer, sezione
> **IVA agevolata** (`VatReliefSection`), nuovo link "Valuta documenti con
> l'agente" → `/vat-relief?case=<numero>`. Apre il nuovo modulo Agevolazioni
> (feature 012) con l'ordine gia' in contesto, per caricare e far controllare
> dall'agente i documenti 104 ricevuti via email prima di decidere qui.

> **Update 2026-07-23 — allinea importo pagamento (ibrido reale/annotazione)**: nel
> drawer, sezione **Pagamento**, campo **"Allinea importo"** per allineare il totale
> dell'ordine a Danea (caso reale: cliente ordina a IVA 22% e l'ordine viene poi rifatto
> a mano a IVA 4%, importo minore). Comportamento **ibrido** in base allo stato ordine
> (riusa `editModeFor`): **UNCONFIRMED** → cambio **REALE** del totale via `readjustTotal`
> (money-path, `order-edit.ts`); **confermato** → **annotazione** metadata pubblico
> `kyron_payment_amount_override` (Saleor non lascia toccare il totale reale — stesso
> vincolo del cambio colore), mostrata in Studio col totale reale sotto; **spedito/annullato**
> → 409. Backend: `setOrderTotal` + `PATCH /api/v1/orders/payment-total` +
> `paymentAmountOverride` in `OrderSummary`/`mapOrder`. Frontend: `PaymentTotalSection`
> (pattern `VatOverrideSection`) + `OrderRow.paymentAmountOverride` + override ottimistico.
> **NB**: l'export Danea NON legge ancora `kyron_payment_amount_override` (aggancio in un
> secondo giro sull'ecommerce). Cross-cutting: `decision-019`.

> **Update 2026-07-21 (fix post-deploy)**: due bug trovati subito dopo il go-live
> in prod, entrambi già corretti e ri-deployati. **(1) Nota/IVA "sparivano" alla
> riapertura del drawer** — `NoteSection`/`VatOverrideSection` salvavano su Saleor
> ma non propagavano il valore all'override ottimistico di `OrdersView`, quindi
> riaprendo il drawer si rileggeva il valore vecchio (serviva un reload pagina).
> Fix: `onNoteSaved`/`onVatSaved` risalgono a `OrdersView` e aggiornano l'override
> subito. **(2) Pulsante "Residuo bonifico incassato" non compariva sugli ordini
> misti reali** — era gatato su `residualMethod === "bank-transfer"`, un metadata
> che molti ordini misti non hanno valorizzato; il saldo restava bloccato su "da
> pagare" senza azione disponibile (segnalato dal cliente). Fix: il pulsante ora
> compare ogni volta che, dopo "Carta del docente acquisita", l'ordine non è
> saldato e il residuo non è su carta (quello va già su Stripe) — non dipende più
> da quel metadata specifico. Stessa logica nel badge "Acconto"/"Residuo da
> incassare" di `StatusBadges`.

> **Update 2026-07-21**: tre estensioni richieste dal cliente (uso reale backoffice).
> **(A) Pagamento misto Carta del Docente + bonifico** (punti "acquisizione parziale"
> + "ricezione BB dopo carta docente"): il BFF ora legge i metadata residuo
> (`teacherCardResidualMethod`/`teacherCardResidualAmount`, già scritti dallo
> storefront) → nuovo campo `OrderRow.residual*`. Modello a **due tranche**: l'azione
> "Carta del docente acquisita" salda l'ordine solo se il buono copre tutto o il
> residuo è su carta (già su Stripe); se il residuo è bonifico l'ordine resta
> **"Acconto"** (badge) con nuova azione **"Residuo bonifico incassato"** (endpoint
> `POST /api/v1/orders/teacher-card-residual-paid`) che marca pagato solo a saldo.
> **(B) Campo Note**: textarea nel drawer → `PATCH /api/v1/orders/note` (metadata
> `kyron_note`), riportata nelle FootNotes dell'export Danea. **(C) Modifiche ordine
> (ibrido)**: sezione **IVA (Danea)** con override aliquota (`PATCH /orders/vat-override`
> → metadata `kyron_vat_override`, letto da `resolveVat` ecommerce; l'IVA non esiste
> su Saleor) + **editing reale righe** (qty/colore) SOLO su ordini `UNCONFIRMED` via
> `EditableLines` → `POST /api/v1/orders/line` (money-path, re-adjust totale). Drawer
> refactor per file corti: blocchi in `OrderBlocks.tsx`, primitive in
> `drawer-primitives.tsx`. Cross-cutting: `decision-019` + gotcha editing UNCONFIRMED.

> **Update 2026-07-22 — cambio colore anche su ordini pagati (annotazione)**: su un
> ordine confermato ma non spedito (es. #301 pagato/da evadere) la tendina colore
> ricompare in modalità **annotazione**: la scelta NON riscrive la riga Saleor (bloccata
> sui confermati) ma salva `kyron_line_colors` (metadata pubblico, `{sku,product,from,to}`)
> via `POST /api/v1/orders/line-color`. `EditableLines` sceglie la modalità dal BFF:
> `edit` (UNCONFIRMED, modifica reale) / `annotate` (confermato non spedito, **solo
> colore**) / `locked` (spedito/consegnato/annullato). Il cambio (acquistato → richiesto)
> è mostrato in Studio, nell'**area ordini del cliente** (storefront `OrderDetail`) e
> nelle FootNotes Danea. Cross-repo: studio-server + studio + ecommerce/storefront.

> **Update 2026-06-20**: fix link Stripe sbagliato nel drawer. Un checkout può
> generare più PaymentIntent (re-init Stripe su remount) e il primo resta orfano
> "Incomplete" su Stripe; il drawer mostrava quello invece del PI realmente
> incassato → l'ordine sembrava non pagato. Ora il BFF (`pickStripeRef` in
> studio-server `core/saleor/orders.ts`) sceglie la transazione con
> `chargedAmount > 0`. Vedi
> `../../../documentation/gotchas/gotcha-stripe-duplicate-payment-intent-orphan.md`.

> **Update 2026-06-17**: il drawer mostra **Studente** + **Classe** (da
> `billingAddress.metadata`, ecommerce feature 028) nella sezione Cliente. Nuovo
> blocco/azione **"Bonifico pagato"** per i `paymentMethod=bank-transfer`: marca
> l'ordine pagato in Saleor (`orderMarkAsPaid` → `FULLY_CHARGED`, coerente con
> badge/Danea/report) + metadata `bankTransferPaidAt` + email "bonifico ricevuto"
> al cliente. Badge "Bonifico da incassare" finché non pagato. Backend:
> studio-server `POST /api/v1/orders/bank-transfer-paid` + `core/saleor/orders.markOrderAsPaid`.


Modulo `/orders` che elenca tutti gli ordini dei portali scuola, filtrabili per
**data**, **portale** e **agente commerciale**. Per ogni ordine: portale (link allo
shop), agente, codice meccanografico, cliente, totale, **stato** pagamento/evasione,
e righe prodotto espandibili. Obiettivo: i commerciali vedono la situazione ordini
in autonomia. Backend: studio-server feature 008 (`GET /api/v1/orders`).

## Accesso

Tutti gli utenti Studio loggati (admin + editor). Nessun ruolo "commerciale": c'è un
filtro **agente** che ognuno usa per restringere ai propri portali. Non più read-only:
stato lavorazione, incasso pagamenti (bonifico / carta docente / residuo), note, IVA
Danea e — su ordini `UNCONFIRMED` — editing righe (qty/colore).

## File

| File | Ruolo |
|---|---|
| `src/app/(authed)/orders/page.tsx` | Server Component: auth, legge **tutti** i filtri dai searchParams → `listOrders(...)` |
| `src/app/(authed)/orders/loading.tsx` | Skeleton |
| `src/app/(authed)/orders/actions.ts` | Server action: stato, carta docente, bonifico, **residuo**, **note**, **IVA**, **edit riga** (via BFF) |
| `src/components/orders/OrdersView.tsx` | Client: sort **desc**, **grouping per giorno**, override ottimistici, stato drawer (non filtra) |
| `src/components/orders/OrdersTiles.tsx` | Le 5 tile in testata: `StatTile` della dashboard, taglia `sm`, le 3 di stato cliccabili |
| `src/lib/query-spec.ts` | Mirror client dello schema query (solo trasporto + chip leggibili) |
| `src/components/orders/OrdersFilters.tsx` | Preset periodo, date, select portale/agente — tutto → URL |
| `src/components/orders/OrdersList.tsx` | Gruppi giorno (header data + conteggio) |
| `src/components/orders/OrderListRow.tsx` | Riga ordine cliccabile responsive → apre drawer |
| `src/components/orders/OrderDrawer.tsx` | Drawer dettaglio (shell + composizione sezioni): **dx desktop / bottom sheet mobile** |
| `src/components/orders/OrderBlocks.tsx` | Blocchi azione: stato, Carta del Docente (+residuo), Bonifico, Note, IVA, **allinea importo** (`PaymentTotalSection`, ibrido reale/annotazione) |
| `src/components/orders/drawer-primitives.tsx` | Primitive condivise: `Section`, `InfoRow`, `ActionButton`, `FeedbackNote` |
| `src/components/orders/EditableLines.tsx` | Editing righe: 3 modalità `edit`/`annotate`/`locked` (Parte C2 + cambio colore annotato su ordini confermati, decision-019) |
| `src/components/orders/OrderLines.tsx` | Righe prodotto read-only (cod + descr × qty + €) + note cambio colore — condiviso |
| `src/components/orders/ColorChangeNote.tsx` | Annotazione cambio colore (acquistato → richiesto), riusata read-only + annotate |
| `src/components/orders/StatusBadges.tsx` | Pill stato pagamento+evasione (+ "Acconto"/"Residuo") + link portale |
| `src/components/orders/OrdersEmptyState.tsx` | Stati errore / nessun ordine |
| `src/components/orders/format.ts` | Formatter EUR/data/ora + grouping giorno (`dayKey`/`dayLabel`) + stato Saleor → label IT |
| `src/lib/gateway.ts` | `listOrders()` + tipi `OrderRow`/`OrdersResponse` |
| `src/components/shell/modules.ts` | Entry modulo "Ordini" (icona ShoppingBag, live) |

## Pattern

- **Filtri nell'URL, filtraggio sul server** (dal 2026-08-28): periodo, portale, agente,
  stato, ricerca e `spec` vanno nei searchParams e li applica il BFF col motore di query.
  Il client non filtra: cache 60s lato server perche' ogni cambio filtro e' un refetch.
- **Ordine desc per data**, **raggruppato per giorno** (Oggi/Ieri/data, fuso Europe/Rome).
- **Ricerca** per n° ordine, dati cliente (nome/email/telefono) o transazione Stripe.
- **Drawer dettaglio** (pattern animato di `AnnotationsDrawer`): scivola da **destra** su
  desktop (full-height, gap 16px), **bottom sheet** su mobile. Sezioni: **Stato lavorazione**
  (selettore), Cliente (nome/email/telefono/indirizzo), **Dati fiscali** (CF/P.IVA/SDI/azienda,
  solo se presenti), Pagamento + **link diretto a Stripe**, Portale (agente/cod. mecc.), Prodotti.
- **Stato lavorazione** (Nuovo/In preparazione/Spedito/Consegnato/Annullato): server action
  `updateOrderStatusAction` → `PATCH /api/v1/orders/status` (BFF). Update ottimistico via
  override locale; su "Spedito" feedback se è partita la mail al cliente (gata allowlist lato BFF).
- Riuso UI: `Card`, `Input`, `Pill` da `components/ui`. Niente emoji.

## Mobile / responsive

- Filtri `grid-cols-1` su mobile (full-width a capo) → `sm:grid-cols-2 lg:grid-cols-4`.
- Date input con `appearance-none`+`min-w-0`: vedi `documentation/gotchas/gotcha-ios-date-input-too-wide.md`.
- Drawer bottom-sheet `100dvh`+safe-area (non `vh`) + animazione apertura doppio rAF:
  `documentation/gotchas/gotcha-ios-bottom-sheet-dvh-not-vh.md`.
- Righe lista con `min-w-0`/truncate sul nome portale (no scroll orizzontale).

## Note

- Ordini su channel senza portale Payload (es. main shop `scuola-demo`) → agente/cod.
  meccanografico "—", link al main shop.
- **Ordini di test esclusi** lato BFF (`ORDERS_REPORT_EXCLUDE_EMAILS`, default alek/gmail).
- Ricerca Stripe = PaymentIntent `pi_` (non PaymentMethod `pm_`, non salvato da Saleor).

## Aggiornamento 2026-08-31 — la seconda `FieldMap`

Il motore query generico (`core/query/spec.ts`) ha ora il secondo consumatore
previsto: `CUSTOMER_FIELDS` del modulo Clienti (feature 021). `ORDER_FIELDS` non
cambia; cambia solo `specChips` in `studio/src/lib/query-spec.ts`, che ora tollera
una spec senza `all`/`any` (arriva anche da un URL scritto a mano).
