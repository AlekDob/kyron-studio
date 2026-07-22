---
type: feature
project: studio
created: 2026-06-14
status: shipped
tags: [orders, ordini, commerciali, portali, saleor]
---

# Feature 010 — Modulo Ordini

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
| `src/app/(authed)/orders/page.tsx` | Server Component: auth, default periodo 30g, `listOrders({from,to})` |
| `src/app/(authed)/orders/loading.tsx` | Skeleton |
| `src/app/(authed)/orders/actions.ts` | Server action: stato, carta docente, bonifico, **residuo**, **note**, **IVA**, **edit riga** (via BFF) |
| `src/components/orders/OrdersView.tsx` | Client: filtri portale/agente + **ricerca**, sort **desc**, **grouping per giorno**, stato drawer, KPI |
| `src/components/orders/OrdersFilters.tsx` | Date (→ URL, refetch) + select portale/agente (→ client state) |
| `src/components/orders/OrdersList.tsx` | Gruppi giorno (header data + conteggio) |
| `src/components/orders/OrderListRow.tsx` | Riga ordine cliccabile responsive → apre drawer |
| `src/components/orders/OrderDrawer.tsx` | Drawer dettaglio (shell + composizione sezioni): **dx desktop / bottom sheet mobile** |
| `src/components/orders/OrderBlocks.tsx` | Blocchi azione: stato, Carta del Docente (+residuo), Bonifico, Note, IVA |
| `src/components/orders/drawer-primitives.tsx` | Primitive condivise: `Section`, `InfoRow`, `ActionButton`, `FeedbackNote` |
| `src/components/orders/EditableLines.tsx` | Editing righe (qty/colore) per ordini `UNCONFIRMED` (Parte C2) |
| `src/components/orders/OrderLines.tsx` | Righe prodotto read-only (cod + descr × qty + €) — condiviso |
| `src/components/orders/StatusBadges.tsx` | Pill stato pagamento+evasione (+ "Acconto"/"Residuo") + link portale |
| `src/components/orders/OrdersEmptyState.tsx` | Stati errore / nessun ordine |
| `src/components/orders/format.ts` | Formatter EUR/data/ora + grouping giorno (`dayKey`/`dayLabel`) + stato Saleor → label IT |
| `src/lib/gateway.ts` | `listOrders()` + tipi `OrderRow`/`OrdersResponse` |
| `src/components/shell/modules.ts` | Entry modulo "Ordini" (icona ShoppingBag, live) |

## Pattern

- **Un solo fetch** al BFF per periodo (date nei searchParams → refetch server); portale,
  agente e **ricerca** filtrano **client-side** sul payload (zero refetch), come Analytics.
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
