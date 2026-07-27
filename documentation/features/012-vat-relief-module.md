---
type: feature
project: kyron-studio
created: 2026-07-27
last_verified: 2026-07-27
tags: [agevolazioni, iva-104, agente, generative-ui, documenti, decision-019]
---

# 012 — Modulo Agevolazioni (validazione documenti 104)

## Cosa

Modulo `/vat-relief` ("Agevolazioni" in sidebar). Chat agente + pannello
contestuale (stessa forma di Portali/Controlli). Il collega carica i documenti
104 ricevuti via email dal cliente (checkout feature 002/030,
`kyron_vat_agevolata_status=requested`); l'agente li legge, verifica la
checklist L.104 e confronta intestatario/prodotti con l'ordine, poi propone
approva/rifiuta — la decisione resta sempre umana.

## Perche'

Dal 24/07 il checkout accetta richieste di IVA agevolata al 4% (L.104): il
cliente carica i documenti, arrivano via email al team (nessuno storage,
scelta esplicita — dati sanitari, GDPR art. 9), e un collega deve validarli a
mano dal drawer Ordini. Il drawer aveva solo i bottoni approva/rifiuta, non i
documenti: la valutazione richiedeva aprire mail e PDF a parte. Questo modulo
mette il controllo in un posto solo, con un secondo paio di occhi automatico.

## Decisioni

| Punto | Scelta | Perche' |
|---|---|---|
| Archivio documenti | **Nessuno**: analisi in memoria (TTL 30 min), su Saleor solo esito + nota sintetica | Dati sanitari (GDPR art. 9); i media Payload oggi hanno URL pubblici, archiviarli richiederebbe access control nuovo |
| Ingresso pratiche | **Upload libero, nessuna coda** | Si entra caricando i documenti in chat (citando il numero d'ordine se c'e'), o dal link "Valuta documenti" nel drawer Ordini. Se in uso reale manca un promemoria, la coda si aggiunge dopo: `vatReliefStatus` e' gia' nel BFF |
| Approvazione | **L'agente propone, l'umano clicca** | Money-path — riusa gli endpoint gia' in produzione (`PATCH /orders/vat-agevolata`, `PATCH /orders/payment-total`). Coerente con la scelta post-incident doppio-sconto del 2026-07-23 |
| Checklist L.104 | Bozza nel prompt, **da validare col commercialista** | L'agente non deve inventare requisiti fiscali |

## Architettura

Stesso protocollo SSE + generative UI descriptor `_ui` (decision-015).
Nessun tool scrive su Saleor: l'unica azione che tocca i soldi (`propose_decision`
→ bottoni Approva/Rifiuta) e' un click umano sugli endpoint gia' esistenti.

```
studio (chat)                 studio-server (agente)            Saleor
    |                              |                               |
    | "controllo ordine 319"       |                               |
    ├── SSE ───────────────────────► get_order(319) ───────────────► fetchOrderByNumber
    |   _ui: VatReliefCase         |                               |
    ◄──────────────────────────────┤                               |
    | upload PDF/JPG               |                               |
    ├── POST /api/vat-relief/upload► putUpload() (store RAM, TTL)  |
    | conferma submission          |                               |
    ├── SSE ───────────────────────► analyze_documents ──► generateObject (vision)
    |   _ui: DocCheckReport        |                               |
    ◄──────────────────────────────┤                               |
    |                              ├── propose_decision            |
    |   _ui: VatReliefDecision     |                               |
    ◄──────────────────────────────┤                               |
    | click Approva/Rifiuta        |                               |
    ├── validateVatReliefAction ───┼───────────────────────────────► PATCH vat-agevolata
```

## File chiave

**studio-server** (`src/features/vat-relief/`):
- `uploads.ts` — store **in memoria** con TTL 30 min (`putUpload`/`getUploads`/`dropUploads`), whitelist PDF/JPG/PNG/WebP, max 10MB/file, max 8 file. Nessuna scrittura su disco, nessun log del contenuto
- `analyze.ts` — `analyzeDocs()`: `generateObject` con schema Zod dell'esito (`ok`/`incompleto`/`errato`, documenti rilevati, problemi con gravita, confronto con l'ordine). Guard esplicito: se il modello routato non ha visione (`VISION_BLOCKLIST`), errore chiaro invece di un esito inventato
- `prompt.ts` — `CHECKLIST_104` (bozza requisiti L.104, da validare col commercialista) + `AGENT_SYSTEM_PROMPT` (regole: mai approvare/rifiutare da solo, mai dettagli clinici)
- `agent.ts` — tool `render_doc_uploader`, `get_order`, `analyze_documents`, `propose_decision`
- `route.ts` — `POST /agents/vat-relief` (SSE) + `POST /api/v1/vat-relief/upload` (multipart)
- `src/core/saleor/orders.ts` — `fetchOrderByNumber()` aggiunta per la lookup per numero (prima esisteva solo fetch per range di date)

**studio:**
- `src/app/(authed)/vat-relief/page.tsx` — pagina, legge `?case=<numero>` per il deep link da Ordini
- `src/components/vat-relief/VatReliefWorkspace.tsx` — split-pane, pannello destro vuoto finche' non c'e' una pratica
- `src/components/vat-relief/VatReliefChat.tsx` — chat con componenti generativi interattivi (submission → messaggio strutturato all'agente, pattern onboarding portali)
- `src/components/vat-relief/VatReliefCase.tsx` — scheda ordine nel pannello destro (cliente, prodotti, importi, stato IVA agevolata)
- `src/components/chat/generative/DocUploader.tsx` — upload multi-file, non archivia nulla lato client, manda solo gli id
- `src/components/chat/generative/DocCheckReport.tsx` — esito: pill ok/incompleto/errato + problemi + documenti letti + confronto ordine
- `src/components/chat/generative/VatReliefDecision.tsx` — bottoni Approva/Rifiuta, riusa `validateVatReliefAction`/`updateOrderPaymentTotalAction` (drawer Ordini, feature 010)
- `src/app/api/agent/vat-relief/route.ts` — proxy SSE
- `src/app/api/vat-relief/upload/route.ts` — proxy multipart (i file non toccano il disco Next, passano dritti allo store in memoria del server)
- `src/components/orders/OrderBlocks.tsx` — link "Valuta documenti con l'agente" in `VatReliefSection` → `/vat-relief?case=<numero>`

## Spike PDF (verifica preliminare)

Prima di scrivere `analyze.ts` e' stato verificato che `@ai-sdk/openai` 1.3 +
`ai` 4.x supportano un `file` part `application/pdf`: test diretto sulla key
di servizio in produzione (mai in locale, quota esaurita), `gpt-4o` ha letto
correttamente un PDF di prova estraendone i campi. Il mapping SDK → OpenAI
(`{filename, file_data: "data:application/pdf;base64,..."}"`) e' verificato in
`node_modules/@ai-sdk/openai`. Nessuna dipendenza nuova.

## Limiti attuali

- **Nessuna coda**: senza upload proattivo, l'unico promemoria di una pratica in
  attesa resta la mail "Richiesta IVA agevolata da validare" + il badge nel
  drawer Ordini (feature 010). Se serve, `listVatReliefQueue()` si aggiunge
  senza toccare backend gia' scritto (`vatReliefStatus` e' gia' nel BFF).
- **Checklist L.104 non validata legalmente**: bozza operativa in `prompt.ts`,
  da far confermare al commercialista prima di considerarla affidabile con
  clienti reali.
- **Routing modelli**: `ModelRoutingSection` (Impostazioni) governa solo il
  modulo onboarding-school; il modulo Agevolazioni usa sempre l'env-fallback
  di `resolveModel()` (`gpt-4o`, vision-capable). Se in futuro serve
  selezionabile da UI, va esteso quel pannello.
- **Ingresso conversazionale "a vuoto"**: la schermata iniziale invita a
  caricare documenti ma non mostra l'uploader finche' non si scrive un primo
  messaggio (l'agente lo emette come tool result). Rilevato in test manuale
  post-go-live (2026-07-27) — fix pianificato: uploader gia' presente nel
  primo turno + bottone upload sempre disponibile accanto al campo di testo.

## Test manuale

```bash
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev
cd ~/Desktop/Dev/Personal/Kyron/studio && STUDIO_DEV_USER=tua@email npm run dev
# http://localhost:3010/vat-relief
# scrivi "controlla i documenti dell'ordine <numero>", carica un PDF/foto,
# verifica l'esito e (se approvi) la conferma importo 4%
```

## Go-live

In produzione su `studio.kyronedu.it` dal 2026-07-27 (commit su studio-server
+ studio, redeploy manuale via API Coolify). Annuncio interno via mail
"Panzerottino" (aragosta fotorealistica, volto Roberto Russo) —
`ecommerce/documentation/emails/2026-07-27-panzerottino-modulo-agevolazioni/`.
