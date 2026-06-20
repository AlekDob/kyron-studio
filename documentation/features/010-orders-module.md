---
type: feature
project: studio
created: 2026-06-14
status: shipped
tags: [orders, ordini, commerciali, portali, saleor]
---

# Feature 010 — Modulo Ordini

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
filtro **agente** che ognuno usa per restringere ai propri portali. Read-only.

## File

| File | Ruolo |
|---|---|
| `src/app/(authed)/orders/page.tsx` | Server Component: auth, default periodo 30g, `listOrders({from,to})` |
| `src/app/(authed)/orders/loading.tsx` | Skeleton |
| `src/app/(authed)/orders/actions.ts` | Server action `updateOrderStatusAction` (PATCH stato via BFF) |
| `src/components/orders/OrdersView.tsx` | Client: filtri portale/agente + **ricerca**, sort **desc**, **grouping per giorno**, stato drawer, KPI |
| `src/components/orders/OrdersFilters.tsx` | Date (→ URL, refetch) + select portale/agente (→ client state) |
| `src/components/orders/OrdersList.tsx` | Gruppi giorno (header data + conteggio) |
| `src/components/orders/OrderListRow.tsx` | Riga ordine cliccabile responsive → apre drawer |
| `src/components/orders/OrderDrawer.tsx` | Drawer dettaglio: **sx desktop / bottom sheet mobile**, cliente + Stripe + portale + prodotti |
| `src/components/orders/OrderLines.tsx` | Righe prodotto (cod + descr × qty + €) — condiviso |
| `src/components/orders/StatusBadges.tsx` | Pill stato pagamento+evasione + link portale — condiviso |
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
