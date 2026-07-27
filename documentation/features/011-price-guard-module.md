---
type: feature
project: kyron-studio
created: 2026-07-27
last_verified: 2026-07-27
tags: [controlli, price-guard, agente, sola-lettura]
---

# 011 — Modulo Controlli (Price Guard)

## Cosa

Modulo `/checks` ("Controlli" in sidebar). Chat agente in sola lettura che
verifica prezzi e sconti dei portali scuola su Saleor produzione e spiega le
anomalie in italiano semplice. Nessuna modifica: l'AI legge un risultato gia'
calcolato deterministicamente (`runPriceGuard`) e lo racconta.

## Perche'

Prima di questo modulo il controllo prezzi/sconti richiedeva query manuali o
uno script one-shot. Serviva un modo per i colleghi non tecnici di chiedere
"controlla tutti i portali" o "controlla massari" e ricevere una risposta
leggibile, senza rischiare che l'AI tocchi i dati.

## Architettura

Stesso protocollo SSE + generative UI (`_ui` descriptor) degli altri agenti
Studio (decision-015). L'agente ha **solo tool di lettura**: chiama il motore
deterministico esistente e riporta il risultato, non calcola nulla lui stesso.

```
studio (chat)              studio-server (agente)         motore
    |                           |                            |
    | "controlla tutti"         |                            |
    ├── SSE ────────────────────► run_all_checks             |
    |                           ├──────────────────────────► runPriceGuard()
    |                           ◄────────── anomalie ─────────┤
    |   _ui: AnomalyReport      |                            |
    ◄───────────────────────────┤                            |
```

## File chiave

**studio-server:**
- `src/features/price-guard/agent.ts` — agente SSE, tool `run_all_checks` (tutti i portali) e `check_portal` (fuzzy match su un portale)
- `src/features/price-guard/agent-route.ts` — `POST /agents/price-guard`, protetta da `studioAuthMiddleware`
- `src/features/price-guard/check.ts` — `runPriceGuard()`, il motore deterministico che calcola le anomalie
- `src/features/price-guard/rules.ts` — regole di anomalia (es. voucher negativo, sconto incoerente)
- `src/features/price-guard/reads.ts` — letture Saleor per il check
- `src/features/price-guard/render.ts` / `route.ts` / `report.ts` — rendering, route REST, report email

**studio:**
- `src/app/(authed)/checks/page.tsx` — pagina modulo
- `src/components/checks/ChecksWorkspace.tsx` — split-pane: chat a sinistra, ultimo report anomalie a destra
- `src/components/checks/ChecksChat.tsx` — chat SSE, sola lettura (readOnly su tutti i componenti generativi)
- `src/components/chat/generative/AnomalyReport.tsx` — componente generativo che renderizza l'elenco anomalie

## Pattern

- Sola lettura: nessun tool dell'agente scrive su Saleor/Payload.
- Split-pane identico a Portali/Ordini: chat + pannello contestuale, qui il
  pannello mostra sempre l'ultimo report ricevuto in sessione (non persistito).
- Il pannello destro si aggiorna leggendo `result.anomalies` dal tool result,
  non dal descriptor `_ui` (quello serve solo per il rendering in chat).

## Nota storica

Il modulo era gia' completo e funzionante ma non era mai stato committato: e'
entrato in produzione il 2026-07-27 insieme al modulo Agevolazioni (feature
012), che dipende dagli stessi file di registry (`registry.tsx`, `modules.ts`)
gia' modificati per Controlli. Vedi diary 2026-07-27.

## Test manuale

```bash
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev
cd ~/Desktop/Dev/Personal/Kyron/studio && STUDIO_DEV_USER=tua@email npm run dev
# http://localhost:3010/checks → chiedi "controlla tutti i portali"
```
