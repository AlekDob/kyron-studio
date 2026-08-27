---
type: feature
project: kyron-studio
created: 2026-07-27
last_verified: 2026-08-27
tags: [controlli, price-guard, agente, sola-lettura, report-email]
---

# 011 — Modulo Controlli (Price Guard)

## Cosa

> **2026-08-27 — l'agente Bruno non esiste piu'.** I due tool `run_all_checks` e
> `check_portal` sono passati a **Nico (Catalogo)**, il modulo `/checks` e la
> rotta `/agents/price-guard` sono stati rimossi. Motivo: chi cambia i prezzi
> ora controlla nello stesso thread, senza cambiare canale e rispiegare il
> contesto. Il giudizio resta codice deterministico (`runPriceGuard`), quindi
> Nico non puo' ammorbidire il verdetto piu' di quanto potesse Bruno. Il
> **report email giornaliero e gli endpoint admin restano identici**: sono le
> altre due porte sullo stesso motore.

Report email giornaliero + tool di controllo dentro Nico (Catalogo). Verifica
prezzi e sconti dei portali scuola su Saleor produzione con **sei regole**
indipendenti e spiega le anomalie in italiano semplice, sia in chat (a
richiesta) sia via mail (automatico). Nessuna modifica: sia l'agente sia lo
scheduler leggono un risultato gia' calcolato deterministicamente
(`runPriceGuard`) — l'AI non calcola mai un importo, lo racconta.

Nasce come follow-up dell'incident doppio-sconto kit del 23/07 (vedi
`kit-voucher-double-discount` nel brain): la guardia di riconciliazione
`somma scontati − voucher == finalPriceEur` che era rimasta come TODO.

## Perche'

Prima di questo modulo il controllo prezzi/sconti richiedeva query manuali o
uno script one-shot. Serviva un modo per i colleghi non tecnici di chiedere
"controlla tutti i portali" o "controlla massari" e ricevere una risposta
leggibile, senza rischiare che l'AI tocchi i dati.

## Architettura

Stesso protocollo SSE + generative UI (`_ui` descriptor) degli altri agenti
Studio (decision-015). L'agente ha **solo tool di lettura**: chiama il motore
deterministico esistente e riporta il risultato, non calcola nulla lui stesso.
Lo stesso motore alimenta anche il report email (nessuna logica duplicata).

```
studio (chat)              studio-server (agente)         motore (registro regole)
    |                           |                            |
    | "controlla tutti"         |                            |
    ├── SSE ────────────────────► run_all_checks             |
    |                           ├──────────────────────────► runPriceGuard()
    |                           ◄────────── anomalie ─────────┤
    |   _ui: AnomalyReport      |                            |
    ◄───────────────────────────┤                            |

scheduler 08:45 Europe/Rome ──────────────────────────────► runPriceGuard()
    (opt-in PRICE_GUARD_ENABLED)                             │
                                                     mail SOLO se anomalie > 0
```

### Registro di regole (estensibile)

`check.ts` non e' una funzione monolitica: e' un **runner** che carica il
contesto per portale una volta (bundle Payload + prezzi Saleor sul channel
scuola + voucher) e lo passa a `rules.ts`, un registro di funzioni pure
indipendenti `(ctx) => Anomaly[]`. Aggiungere un nuovo tipo di controllo costa
una funzione + una riga nel registro `RULES`, senza toccare il resto. Filtro
attivabile via env `PRICE_GUARD_RULES` (CSV di id) o passato dall'agente.

| Regola (id) | Anomalie che emette | Cosa controlla |
|---|---|---|
| `kit-reconciliation` | `kit-double-discount`, `kit-overcharge`, `voucher-missing`, `component-missing` | Per ogni kit: `somma(prezzi scontati componenti sul channel scuola) − voucher` deve == `finalPriceEur` mostrato. Se un componente non risolve (SKU errato/assente) si segnala SOLO `component-missing` e si salta la riconciliazione (altrimenti lo scarto e' inventato). |
| `discount-vanished` | `discount-vanished` | Un `productDiscount` Payload deve riflettersi nel prezzo Saleor del taglio — MA solo se il prodotto/taglio e' venduto **singolarmente** (`isSoldStandalone`: presente in `visibleSlugs`/`visibleVariants`). Un prodotto solo-in-kit o un taglio non piu' a catalogo non e' un'anomalia. |
| `channel-orphan` | `channel-orphan` | Channel Saleor non attivo o `allowUnpaidOrders=false` (ordini Bonifico/Carta Docente rischiano di non essere creati, come l'ordine orfano #102). |
| `stale-variant` | `stale-variant-buyable` | Una variante ha prezzo/listing attivo sul channel ma il suo taglio non e' in `visibleVariants`: acquistabile per errore. |

Portali esclusi dal giro (`PRICE_GUARD_EXCLUDE_PORTALS`, default
`carta-docente,scuola-demo`): sono canali del main shop con doc Payload
`onboarded` ma dove l'intero catalogo e' legittimamente in vendita — non sono
portali scuola con un catalogo ristretto.

## File chiave

**studio-server:**
- `src/features/price-guard/check.ts` — `runPriceGuard(opts)`, il runner: carica il contesto per portale, applica le regole abilitate, concatena le anomalie. `opts.ordersFrom` (default: ieri) per la finestra ordini colpiti.
- `src/features/price-guard/rules.ts` — le 4 regole del registro (tabella sopra)
- `src/features/price-guard/reads.ts` — letture Saleor per il check (`fetchProduct`, `readVoucherDiscount`, `readChannelSettings`, `findOrdersWithVoucher`). **Guardia read-only**: avvolge `adminRequest` e rifiuta a runtime qualsiasi query contenente `mutation`.
- `src/features/price-guard/render.ts` — HTML email: card per anomalia, riga `mostrato → reale` con badge scarto, riepilogo (anomalie/portali/ordini coinvolti/scarto totale €), chip ordini colpiti (numero+data+importo)
- `src/features/price-guard/report.ts` — `runAndNotify()`: mail SOLO se `anomalies.length > 0` (override `PRICE_GUARD_ALWAYS_SEND`); `armDailyPriceGuard()` scheduler 08:45 Europe/Rome opt-in `PRICE_GUARD_ENABLED`, prima di analytics (09:00) e ordini (09:30)
- `src/features/price-guard/route.ts` — `POST /api/v1/price-guard/run` (con mail, admin) e `/check` (dry, opzionale `portalSlug`)
- `src/features/commesso/agent.ts` — i tool `run_all_checks` e `check_portal` (fuzzy match via `resolvePortal`) vivono qui, dentro Nico. ~~`price-guard/agent.ts` + `agent-route.ts`~~ rimossi il 27/08/2026.
- `tests/features/price-guard-rules.test.ts` — matematica di riconciliazione: doppio sconto, overcharge, conti ok, voucher mancante, componente non risolto (regressione)

**studio:**
- ~~`src/app/(authed)/checks/`, `src/components/checks/`, `src/app/api/agent/price-guard/`~~ rimossi il 27/08/2026: il report anomalie appare nella chat di Nico via descriptor `_ui` `AnomalyReport` (il componente resta, e' nel registry).
- `src/components/chat/generative/AnomalyReport.tsx` — componente generativo che renderizza l'elenco anomalie raggruppate per tipo

## Pattern

- **Sola lettura, garantita anche a runtime**: nessun tool/regola scrive su
  Saleor/Payload; nessun import di `portals/writer` o `enable/enable`; la
  guardia in `reads.ts` fa fallire esplicitamente qualsiasi query con
  `mutation` nel testo, cosi' il vincolo resta valido anche per chi estende il
  modulo in futuro.
- **Config attuale, ordini di ieri**: il check valuta sempre la configurazione
  Saleor/Payload **adesso** (un kit e' rotto o non lo e', non ha senso
  guardarlo "di ieri"); la lista ordini colpiti nella mail invece e' filtrata
  al giorno prima (`romeYesterday`), coerente coi report ordini/analytics.
- Split-pane identico a Portali/Ordini: chat + pannello contestuale, qui il
  pannello mostra sempre l'ultimo report ricevuto in sessione (non persistito).
- Il pannello destro si aggiorna leggendo `result.anomalies` dal tool result,
  non dal descriptor `_ui` (quello serve solo per il rendering in chat).

## Verificato in prod (giro a secco, 2026-07-27)

Il motore e' stato eseguito sui dati reali di Saleor prod prima di armare la
mail — passaggio che ha ripagato: il primo giro dava **49 anomalie**, di cui
**28 falsi positivi** riconosciuti guardando i risultati (non da bug ovvi).
Corretti in due commit di fix (`2e406d5`, `fabf9ad`):

1. `discount-vanished` contava anche prodotti venduti SOLO dentro un kit
   (`hiddenSlugs`) o discount su tagli non piu' a catalogo — il loro prezzo
   unitario su Saleor e' irrilevante. Fix: `isSoldStandalone`. 16 → 1.
2. Kit con componenti non risolti (SKU errato) produceva riconciliazioni
   inventate (`scontati 0€ − voucher = negativo`). Fix: salta la
   riconciliazione se manca un componente, segnala solo `component-missing`.
3. `carta-docente`/`scuola-demo` (main shop) generavano `stale-variant-buyable`
   legittimi. Fix: esclusione via `PRICE_GUARD_EXCLUDE_PORTALS`.

Dopo i fix: **21 anomalie reali** confermate manualmente (7 kit `dantealighieri`
senza voucher, 5 channel `allowUnpaidOrders=false`, SKU errati su 2 portali,
1 sconto AppleCare disallineato, 4 varianti stale). Vedi diary 2026-07-27 per
il dettaglio portale-per-portale.

**Lezione**: per una regola di anomalia nuova, eseguire sempre un giro a secco
(`/check` dry) sui dati prod reali prima di armare `PRICE_GUARD_ENABLED` — il
rischio concreto sono i falsi positivi che rendono la mail inutile dopo pochi
giorni, non i bug di sintassi (quelli li becca tsc).

## Test manuale

```bash
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev
cd ~/Desktop/Dev/Personal/Kyron/studio && STUDIO_DEV_USER=tua@email npm run dev
# http://localhost:3010/catalogo → chiedi a Nico "controlla tutti i portali"
```

Dry-run diretto in prod (senza mail): `POST /api/v1/price-guard/check` con
`{"portalSlug": "massari"}` (admin). Con mail: `POST /api/v1/price-guard/run`.
