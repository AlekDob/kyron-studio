---
type: feature
project: studio
created: 2026-08-31
last_verified: 2026-08-31
tags: [clienti, agente, bea, ordini, email, query-spec, generative-ui, payload]
---

# Feature 021 — Modulo Clienti (Bea)

## Perche'

Ordini (Nico) e Prodotti (Teo) erano appena stati rifatti. Mancava il terzo lato
dello stesso lavoro: **il cliente**. Prima di questa feature un cliente esisteva
solo dentro un ordine — per sapere quante volte aveva comprato, su che portale,
quanto aveva speso o cosa gli avevamo scritto, bisognava aprire ordine per ordine.

## Cos'e' un cliente

**Chi ha ordinato.** Non c'e' nessuna anagrafica nuova: la lista si deriva dagli
ordini Saleor gia' in cache (`fetchOrdersForRange`), raggruppati per email in
minuscolo. Funziona anche per i checkout senza account, che sono la maggior parte.

L'**email e' l'identita'**: stesso indirizzo = stesso cliente, anche su portali
diversi. Non c'e' un id.

Finestra di default: **365 giorni** (Ordini usa 30). Un cliente si guarda sullo
storico, non su un mese.

## Backend — `studio-server/src/features/customers/`

| File | Ruolo |
|---|---|
| `derive.ts` | `buildCustomers(orders)`: raggruppa, somma il lordo, marca `isNew`/`isReturning`. Puro, niente I/O. |
| `derive.check.ts` | self-check runnable: stessa mail con maiuscole diverse = un cliente, le mail interne non entrano, il totale e' la somma dei lordi. |
| `query-fields.ts` | `CUSTOMER_FIELDS`: la **seconda `FieldMap`** del motore query generico (`core/query/spec.ts`), come previsto nella feature 010. |
| `service.ts` | l'unico posto che tocca la rete: ordini arricchiti, comunicazioni (Resend + `email-log`). |
| `store.ts` | note e segmenti su Payload (le uniche scritture del modulo). |
| `route.ts` | `/api/v1/customers` — vedi sotto. |
| `tools.ts` / `mail-tools.ts` / `store-tools.ts` | i tool di Bea: lettura, mail, note+segmenti. |
| `agent.ts` + `prompt.ts` + `agent-route.ts` | Bea su `/agents/customers`. |

Endpoint (`tenantMiddleware` + `studioAuthMiddleware`, non admin-only come Ordini):

```
GET    /api/v1/customers                → lista + buckets + portali/agenti disponibili
GET    /api/v1/customers/:email         → scheda: riga, ordini, comunicazioni, nota
PATCH  /api/v1/customers/note           → accoda una riga alla nota interna
GET    /api/v1/customers/segments       → segmenti salvati
POST   /api/v1/customers/segments       → salva/aggiorna (stesso slug = update)
DELETE /api/v1/customers/segments/:slug
```

Le rotte `note` e `segments` sono registrate **prima** di `/:email`: Hono prende
la prima che combacia, e `/:email` si mangerebbe anche "segments".

I KPI delle tile si contano **prima** del filtro gruppo: cliccando "Ricorrenti"
l'operatore deve continuare a vedere quanti sono i nuovi.

## Frontend — `/clienti`

Stessa impalcatura di Ordini e Prodotti, nessuna primitiva nuova: `sentence-chips`,
`orders-period`, `detail-section`, `drawer-primitives`, `format.ts`, `OrderListRow`,
`StatTile`/`TileRail`, `SkeletonRows` sono tutti riusati.

- L'URL e' l'unica verita' sui filtri; il server applica tutto, la pagina non
  filtra niente in memoria.
- Testata: 4 tile (Clienti · Speso totale · Nuovi · Ricorrenti — le ultime due
  filtrano) + la frase con i chip.
- Lista piatta, **senza raggruppamento per giorno**: un cliente non e' un evento
  datato.
- Scheda a 4 tab: Anagrafica · Ordini · Comunicazioni · Note. Si carica quando si
  apre (server action `fetchCustomerAction`), non insieme alla lista.
- Il tab Ordini mostra `OrderListRow` in sola lettura: la scheda ordine vera vive
  nel modulo Ordini.
- Mobile: `MobileChatOverlay` + `CustomerDrawer` (bottom sheet). Desktop: la
  scheda sostituisce la lista, la chat resta nell'`aside` da 420px.

Self-check: `npx tsx src/components/customers/customers-filter.check.ts`.

## Bea

Agente suo (`/agents/customers`), non un terzo scope di Nico: persona diversa,
tool diversi, e `commesso` era gia' un file da due mestieri.

- Lettura: `list_customers` (accetta `spec` o lo slug di un segmento),
  `get_customer` (accetta `tab`), `customer_orders`.
- Scrittura: `add_customer_note`, `save_segment`, `list_segments`.
- Mail: `plan_customer_mailing`, `send_customer_test_mail`, `send_customer_mailing`.

Ogni tool emette un descriptor `_ui` **`CustomersReceipt`**: il pannello applica
il filtro o apre la scheda da solo (decision-015), la chat resta di due righe.

## Le mail: motore condiviso con Nico

Il piano non era duplicare l'invio ma **sfilarlo** dal file DDT. Il motore vive ora
in `core/email/campaign.ts` + `campaign-template.ts`: lotti da 50, `claimSend` su
Payload **prima** di inviare, allowlist, kill switch, `markFailed`.

- Nico: destinatari dal file DDT caricato (`importId`).
- Bea: destinatari dalla lista clienti filtrata, o da un segmento salvato.

Env **riusate**: `DDT_MAIL_ENABLED` e `DDT_MAIL_ALLOW`. Un solo interruttore per
"mail di massa ai clienti veri" — un secondo env sarebbe un secondo posto da
ricordare quando serve fermare tutto. `campaignId` resta il namespace
anti-doppio-invio.

Due scostamenti dal piano iniziale, deliberati:
- niente factory `campaignMailTools(...)`: la parte condivisa e' il motore, Bea ha
  i suoi tool `*_customer_*` e i nomi dei tool di Nico non si toccano;
- la card di Bea non ha il bottone "Invia prova" (vuole un `importId`): la prova si
  chiede in chat con `send_customer_test_mail`.

## Note e segmenti (Payload)

studio-server non ha database e il filesystem si azzera a ogni redeploy: il posto
durevole e' Payload. Due collection **nuove** (`customer-notes`, `customer-segments`),
nessuna colonna aggiunta a tabelle esistenti — cosi' nessun endpoint esistente puo'
andare in 500 se la migration non gira (diary 2026-07-22).

La migration e' `cms/db/migrations/0004-customers.sql`, idempotente, applicata al
boot da `scripts/apply-schema.sh`: **serve un redeploy del CMS** perche' le tabelle
esistano in produzione.

La nota si **accoda**, mai sovrascritta (stessa regola di `add_order_note`): la
scrivono sia i colleghi che Bea.

## Gotcha

- `specChips` in `studio/src/lib/query-spec.ts` legge `all`/`any` che nello schema
  hanno un default, ma una spec puo' arrivare da una ricevuta o da un URL scritto
  a mano: li' si legge, non si valida — da qui le guardie `?? []` / `?.`.
- Un cliente puo' essere **sia nuovo che ricorrente**: le due tile non sommano al
  totale, ed e' voluto.
