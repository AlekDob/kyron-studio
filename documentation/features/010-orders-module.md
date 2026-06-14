---
type: feature
project: studio
created: 2026-06-14
status: shipped
tags: [orders, ordini, commerciali, portali, saleor]
---

# Feature 010 — Modulo Ordini

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
- **Drawer dettaglio** (pattern animato di `AnnotationsDrawer`): scivola da sinistra su
  desktop, bottom sheet su mobile. Mostra cliente (nome/email/telefono/indirizzo),
  pagamento + **link diretto a Stripe** (`pspReference` → `dashboard.stripe.com/payments`),
  portale/agente/cod. mecc., righe prodotto.
- Riuso UI: `Card`, `Input`, `Pill` da `components/ui`. Niente emoji.

## Note

- Ordini su channel senza portale Payload (es. main shop `scuola-demo`) → agente/cod.
  meccanografico "—", link al main shop.
- Mostra anche eventuali ordini di test (vista operativa interna); toggle "nascondi test"
  è fuori scope v1.
