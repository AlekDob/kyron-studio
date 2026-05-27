---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-26
tags: [chat, generative-ui, onboarding, ai, ai-sdk, workstream-04]
---

# 006 — Generative UI nella chat onboarding

## Cosa

L'agente di onboarding scuole sostituisce 2 step Q&A testuali con componenti
React interattivi inline nella chat:
- **Step 6 (catalogo)**: tool `render_product_picker` → `ProductPicker` con
  multi-select + fuzzy search
- **Step 7 (bundle/kit)**: tool `render_bundle_builder` → `BundleBuilder` che
  riceve gli slug raccolti nello step 6 e fa comporre il kit (nome, prezzo,
  componenti) in un'unica UI

L'agente deduce inoltre il **CAP** dalla citta'+provincia (training knowledge)
invece di chiederlo all'utente, presentando l'indirizzo completo per conferma.

Phase 1 PoC + Phase 2 parziale di WS04.

## Perche'

Il Q&A puramente testuale per il catalogo prodotti era inefficiente: l'agente
elencava 5+ prodotti con descrizioni e prezzi a parole, l'utente doveva
ricordarseli e rispondere "prendo zaino blu, astuccio rosso, ...". Un picker
visuale riduce errori di trascrizione, accelera lo step e fa percepire il
sistema come uno strumento reale, non un chatbot.

## Architettura (decision-015)

**Protocollo**: custom component registry + descriptor `_ui` nel `toolResult`
SSE. Scartata `streamUI` (RSC) perche' studio-server e' Hono senza RSC runtime.

```
studio-server (agent)              studio (client)
    │                                  │
    │  tool: render_product_picker     │
    │  result: { _ui: {                │
    │    component: "ProductPicker",   │
    │    props: { products, multi },   │
    │    id: "pick_..."                │
    │  } }                             │
    ├──── SSE toolResult ──────────────►
    │                                  │ chat-runtime parsa _ui
    │                                  │ GenerativeRenderer
    │                                  │ → registry[ProductPicker]
    │                                  │ → componente client React
    │                                  │
    │                                  │ user seleziona, click conferma
    │   user message JSON              │
    │   {kind: "generative_submission",│
    │    component: "ProductPicker",   │
    │    data: { selectedSlugs: [...] }│
    ◄────── POST /api/agent/ ──────────┤
    │                                  │
    │  agent legge, continua flusso    │
```

## File chiave

**studio-server:**
- `src/features/onboard-school/agent.ts` — tool `render_product_picker` e `render_bundle_builder` + `maxSteps: 8`
- `src/features/onboard-school/demo-catalog.ts` — 6 prodotti hardcoded (sostituire con Saleor in fase 2)
- `src/features/onboard-school/route.ts` — SSE emette ora anche `tool-call` e `tool-result` (con payload `result`)
- `src/features/onboard-school/prompt.ts` — step 4 (CAP dedotto), step 6 (picker), step 7 (bundle builder)

**studio:**
- `src/lib/chat-runtime.ts` — evento `tool-result` ora porta `result?: unknown`
- `src/components/chat/generative/types.ts` — Zod schema + `extractGenerativeDescriptor()`
- `src/components/chat/generative/registry.tsx` — registry lazy + `<GenerativeRenderer>` (ProductPicker + BundleBuilder)
- `src/components/chat/generative/ProductPicker.tsx` — picker con fuzzy search multi-token
- `src/components/chat/generative/BundleBuilder.tsx` — composer kit con nome+prezzo+componenti, calcolo somma e sconto live
- `src/components/OnboardingChat.tsx` — gestisce `ui` block per ogni turn, freeze on submit, manda messaggio strutturato, riepilogo umano in user bubble

## Componenti

### ProductPicker

Props: `products`, `multi`, `readOnly`, `disabled`, `initialSelection`, `onSubmit`.

Features:
- Multi-select (o single se `multi: false`)
- Fuzzy search multi-token: query splittata in token, ognuno deve matchare (substring case-insensitive) almeno uno tra `name`/`slug`/`category`. Es. "zaino blu" → matcha "Zaino Classic Blu"
- Conta `X su Y` selezionati
- Submission: `{ selectedSlugs: string[] }`

### BundleBuilder

Props: `products` (filtrati su availableSlugs lato server), `readOnly`, `disabled`, `initialName`, `initialPriceEur`, `initialComponents`, `onSubmit`.

Features:
- Input nome kit + input prezzo EUR (accetta "29,90" e "29.90")
- Checkbox per ogni prodotto disponibile
- Footer riepilogo: somma componenti, sconto kit (somma − prezzo finale), prezzo finale
- Validazione: bottone Salva attivo solo con nome non vuoto + prezzo numerico >=0 + >=1 componente
- Submission: `{ name: string, priceEur: number, components: string[] }`

## CAP dedotto

L'agente non chiede piu' il CAP. Step 4 del prompt:
1. Chiede via + citta' + provincia in una sola domanda
2. Deduce il CAP dalla citta' (training: Milano 20121, Roma 00184, Bari 70121, ecc.)
3. Presenta l'indirizzo completo per conferma ("Via X, 20121 Milano (MI). Confermi?")
4. Se l'utente corregge, accetta il valore corretto

Limite: per citta' piccole/ambigue l'agente fallback al CAP generico del
comune. In Phase 3 si potra' aggiungere un tool di lookup esterno (OpenStreetMap
Nominatim) per precisione su frazioni e civici.

## Stato di submission

Il componente generativo ha 3 stati:
1. **Attivo** — appena renderizzato, l'utente puo' selezionare/deselezionare
2. **Submitted** — confermato; il componente diventa `readOnly`, mostra la selezione finale
3. **Streaming** — disabilitato durante lo streaming del turno successivo

La submission e' persistita nel turn (`turns[i].ui.submission`) — re-render del
thread mostra il componente in stato finale (read-only con selezione). Phase 3
estendera' questo a persistenza server-side.

## Come si estende

Aggiungere un nuovo componente generativo (es. BundleBuilder):
1. Crea `studio/src/components/chat/generative/BundleBuilder.tsx`
2. Aggiungi entry in `registry.tsx`:
   ```ts
   const BundleBuilder = lazy(() => import("./BundleBuilder").then(...));
   const COMPONENT_REGISTRY = { ProductPicker, BundleBuilder };
   ```
3. Lato server: nuovo tool `render_bundle_builder` che ritorna
   `{ _ui: { component: "BundleBuilder", props: {...}, id: "..." } }`
4. Aggiorna il prompt per istruire l'agente a usarlo

Nessuna modifica al protocollo SSE, al runtime client, o agli altri componenti.

## Limiti attuali

- Catalogo hardcoded (`DEMO_CATALOG`, 6 prodotti). Phase 3: fetch reale da
  Saleor via gateway commerce (decision-014 phase 4)
- Nessuna persistenza server-side dei thread chat (re-render funziona solo
  in-session). Phase 4 affronta questo
- Mancano ancora `DiscountConfig` (slider sconto avanzato, oggi e' interno al
  BundleBuilder come differenza somma vs prezzo finale) e `Summary` (riepilogo
  finale pre-salvataggio PendingSchool)
- CAP dedotto via training LLM — affidabile su citta' principali, fragile su
  frazioni. Phase 3: tool lookup esterno (Nominatim OSM)
- Nessuna validazione Zod sulla `data` di submission lato server

## Test manuale

```bash
# Terminale 1
cd ~/Desktop/Dev/Personal/Kyron/studio-server && npm run dev

# Terminale 2
cd ~/Desktop/Dev/Personal/Kyron/studio
STUDIO_DEV_USER=tua@email npm run dev

# Vai a http://localhost:3010/schools/onboarding
# Rispondi alle domande fino allo step 6 (catalogo)
# L'agente deve emettere il tool render_product_picker
# Il picker appare inline, seleziona prodotti, conferma
# L'agente prosegue con i bundle (step 7)
```
