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
| `src/components/orders/OrdersView.tsx` | Client: stato filtri portale/agente, KPI, deriva opzioni, render table/card |
| `src/components/orders/OrdersFilters.tsx` | Date (→ URL, refetch) + select portale/agente (→ client state) |
| `src/components/orders/OrdersTable.tsx` | Tabella desktop, righe espandibili |
| `src/components/orders/OrderCard.tsx` | Card mobile (`lg:hidden`), tap espande |
| `src/components/orders/OrderLines.tsx` | Righe prodotto (cod + descr × qty + €) — condiviso |
| `src/components/orders/StatusBadges.tsx` | Pill stato pagamento+evasione + link portale — condiviso |
| `src/components/orders/OrdersEmptyState.tsx` | Stati errore / nessun ordine |
| `src/components/orders/format.ts` | Formatter EUR/data + mapping stato Saleor → label IT (unico punto) |
| `src/lib/gateway.ts` | `listOrders()` + tipi `OrderRow`/`OrdersResponse` |
| `src/components/shell/modules.ts` | Entry modulo "Ordini" (icona ShoppingBag, live) |

## Pattern

- **Un solo fetch** al BFF per periodo (date nei searchParams → refetch server); portale e
  agente filtrano **client-side** sul payload (zero refetch), come Analytics (feature 009).
- Riuso UI: `Card`, `Select`, `Input`, `Pill` da `components/ui`. Niente emoji.
- Stato Saleor → label IT: `FULLY_CHARGED`→"Pagato", `UNFULFILLED`→"Da evadere", ecc.

## Note

- Ordini su channel senza portale Payload (es. main shop `scuola-demo`) → agente/cod.
  meccanografico "—", link al main shop.
- Mostra anche eventuali ordini di test (vista operativa interna); toggle "nascondi test"
  è fuori scope v1.
