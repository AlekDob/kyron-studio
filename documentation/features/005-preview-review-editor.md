---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-27
tags: [preview, iframe, review, agent, ai, workstream-03]
---

# 005 — Anteprima sito + chat agente Review Editor

## Cosa

Modulo "Anteprima" in sidebar (Eye icon, viola `#9333EA`). Split-pane:
- **Sinistra**: iframe su `staging.kyronedu.it/<path>` con URL bar
- **Destra**: chat con agente AI "Review Editor" + lista bundle annotazioni
- **Bottone "Invia via email"**: bundle .md → Resend → `KYRON_REVIEW_INBOX`

L'utente naviga il sito reale dentro l'iframe, chiacchiera con l'agente
("il titolo qui e' troppo lungo, sostituiscilo con X"), l'agente struttura
l'annotazione, l'utente conferma, l'annotazione finisce nel bundle.

## Architettura

```
/preview (Server Component, auth-gated)
  └─ PreviewWorkspace.tsx (client)
       ├─ <iframe src=currentUrl>
       ├─ PreviewChat.tsx
       │    └─ streamReviewEditor() → /api/agent/review-editor → studio-server
       │    └─ Intercetta tool 'add_annotation' → onAdd(Annotation)
       └─ AnnotationsList.tsx
            └─ Invia bundle → /api/review/send (Resend + .md attachment)
```

## File chiave

| File | Ruolo |
|---|---|
| `src/app/(authed)/preview/page.tsx` | Server Component entry |
| `src/components/preview/PreviewWorkspace.tsx` | Split-pane layout + state annotazioni |
| `src/components/preview/PreviewChat.tsx` | Chat + intercept tool call |
| `src/components/preview/AnnotationsList.tsx` | Lista bundle + bottone invio |
| `src/lib/chat-runtime.ts` | `streamReviewEditor()` helper |
| `src/lib/review/types.ts` | Schema `Annotation`/`AnnotationBundle` (port + `kind:"dom"`) |
| `src/lib/review/urn.ts` | `buildUrn`/`parseUrn` con `kind:"dom"` esteso |
| `src/lib/review/exportMarkdown.ts` | bundle → .md ibrido |
| `src/app/api/agent/review-editor/route.ts` | Proxy SSE verso studio-server |
| `src/app/api/review/send/route.ts` | Bundle → Resend (auth via `getCurrentUser`) |

## Agente Review Editor (studio-server)

`studio-server/src/features/review-editor/{prompt,agent,route}.ts`

3 tool:
- `propose_annotation` — preview strutturata (no side effect), chiede conferma
- `add_annotation` — il client la aggiunge al bundle React state
- `request_send_bundle` — chiede al client di inviare il bundle

L'agente e' **stateless**. Lo stato delle annotazioni vive SOLO in
React useState dentro `PreviewWorkspace`. I tool ritornano payload
formattati che il client interpreta.

## Annotation kinds supportati

- `edit-text` — sostituzione testo
- `replace-image` — sostituzione immagine
- `comment` — nota libera
- `add-section` — proposta sezione nuova
- `restructure` — riorganizzazione

## AnnotationSource — kind:"dom"

Nuovo rispetto al port cms (che aveva solo `jsx` e `cms`):

```ts
{ kind: "dom", url: "https://staging.kyronedu.it/prodotti", selector: "h1.hero-title", locale: "it" }
```

URN: `kyron-rev://dom/<urlEncoded>#<selectorEncoded>@<locale>`

Quando esiste un selector preciso dell'elemento (futuro: postMessage dal
cms), l'agente puo' applicare la modifica deterministicamente. Senza
selector, fallback a `body`.

## Phase 5 — Selezione chat-integrated (2026-05-26)

Il popover `ReviewComposer` cms-side e' stato eliminato in modalita'
embedded. Selezione + conferma ora vivono nella chat.

**Handshake postMessage**: l'overlay cms al mount fa
`parent.postMessage({type:"kyron-rev:hello"}, "*")`. Studio risponde
`kyron-rev:ack` solo se l'origin del cms e' fra
`staging.kyronedu.it`/`kyronedu.it`/`localhost:3000`. Solo dopo l'ack
l'overlay entra in `embedded mode` (nasconde Bar+Composer, posta solo
eventi).

**Eventi cms → studio**:
- `kyron-rev:select` — `{target:{urn, nodeKind, page, currentText, ...}, rect}`
- `kyron-rev:hover` — `{urn, rect}` per highlight live
- `kyron-rev:clear` — deseleziona

**Selection chip**: sopra il composer chat appare una chip con il path
e un'anteprima del testo selezionato (`"Supportiamo le scuole…" su /it`)
+ bottone X per deselezionare. `pendingTarget` finisce in `context.pendingTarget`
della richiesta a `streamReviewEditor`.

**Proposal bubble inline**: quando l'agente chiama `propose_annotation`,
il client renderizza un `ProposalCard` dentro il feed chat (NON popover)
con sezioni Originale / Proposto / Nota + bottoni Conferma / Modifica /
Annulla. Su **Conferma** il client chiama `onAdd()` localmente (zero
latenza) e manda un user message sintetico `"Confermo, aggiungi al
bundle."` all'agente per tenerlo allineato. Su **Modifica** il bubble
diventa editabile inline (textarea). Su **Annulla** sintetico `"Annulla
la proposta"`.

**Hover/selection outline**: rect ricevuti via postMessage diventano due
div absolute sopra l'iframe (outline 2px tratteggiato per hover, pieno
per selezione). Soluzione cross-origin pulita: il cms manda solo le
coordinate, lo studio disegna fuori dall'iframe.

File aggiunti/toccati Phase 5:
- `cms/components/review/ReviewOverlay.tsx` — embedded mode + handshake
- `studio/src/components/preview/PreviewWorkspace.tsx` — listener +
  pendingTarget + hover/selection overlay
- `studio/src/components/preview/PreviewChat.tsx` — chip + proposal entry
- `studio/src/components/preview/ProposalCard.tsx` — bubble Conferma/Modifica/Annulla
- `studio/src/components/preview/SelectionChip.tsx`
- `studio-server/src/features/review-editor/{agent,prompt,route}.ts` — context.pendingTarget

## Phase 5b — Drawer responsive + agente piu' ambizioso (2026-05-26)

**Bundle inline → top-3 + "Vedi tutte"**: `AnnotationsList` mostra solo
le prime 3 annotazioni in pillole compatte; "Vedi tutte (N)" apre
`AnnotationsDrawer`.

**`AnnotationsDrawer.tsx`** (fixed inset-0, z-50):
- Desktop: slide da destra 480px wide, rounded-l-2xl
- Mobile: bottom sheet 88vh, rounded-t-2xl
- Easing iOS `cubic-bezier(0.32, 0.72, 0, 1)` a 280ms enter
- Stagger fade-up 30ms sui rows (max 8 step)
- Pill colorate per kind (edit-text blu, replace-image viola,
  add-section verde, restructure ambra)
- Backdrop opacity + blur 2px
- `Esc` chiude (e chiude prima detail se aperto)

**`AnnotationDetail.tsx`** (fixed inset-0, z-60 sopra il drawer):
- Stesso comportamento responsive
- Header Indietro / Elimina
- Sezioni: tipo, pagina, selector (se != "body"), originale (text/
  image), proposto, immagine nuova, nota, posizione, meta

**Prompt agente esteso** (`studio-server/.../prompt.ts`): spinto a
proporre attivamente `replace-image`, `restructure` (5 colonne,
masonry, hero photo, ordine card), `add-section` (testimonial,
gallery, stat, FAQ). Esempi concreti in-prompt. Suggerimenti
proattivi a 2-3 alternative quando l'utente e' vago.

File aggiunti Phase 5b:
- `studio/src/components/preview/AnnotationsDrawer.tsx`
- `studio/src/components/preview/AnnotationDetail.tsx`

## Phase 6 — DOM context + select/browse toggle (2026-05-27)

Due novita' principali: l'agente ora riceve **contesto DOM strutturato**
dall'elemento selezionato, e l'utente puo' alternare tra modalita'
selezione e navigazione (browse) nell'iframe.

### Select / Browse toggle

Nuovo state `selectMode` in `PreviewWorkspace.tsx`. Quando `selectMode=false`
(browse), gli overlay hover/selezione sono nascosti e l'utente puo'
navigare l'iframe liberamente. Il toggle invia `kyron-rev:mode` via
postMessage all'iframe; il cms `ReviewOverlay.tsx` ascolta il messaggio
e togla l'attributo CSS `data-kyron-rev-mode` con valore `armed`
(selezione attiva) vs assente (browse) — in browse mode gli outline di
selezione sono disabilitati lato css.

Componente `ModeToggle.tsx` (NEW): bottone icona cursore (select) /
freccia (browse), montato nella toolbar del workspace.

### DOM context nell'evento di selezione

`review-selection.ts` (NEW, cms-side): estratto helper di selezione
dal `ReviewOverlay`. Aggiunta funzione `extractSectionContext()` che
risale al `<section>` (o parent container) dell'elemento selezionato e
costruisce:
- **DOM outline tree**: struttura tag+classi, profondita' 3 livelli
- **Images list**: `src` + `alt` di tutte le `<img>` nella sezione

Il contesto viene incluso nel payload `kyron-rev:select` postMessage.

Lato studio: `PreviewWorkspace.tsx` definisce l'interfaccia
`SectionContext` e la propaga nell'oggetto `pendingTarget`.
`chat-runtime.ts` estende `ReviewEditorPendingTarget` con campo
opzionale `sectionContext`.

Lato studio-server: `agent.ts` aggiunge `SectionContext` interface +
helper `formatSectionContext()` che formatta outline + images list
nel preamble del system prompt dell'agente.

### Drawer polish (desktop)

- `AnnotationsDrawer.tsx`: 540px wide (era 480px), `inset-4`,
  `rounded-2xl` con border, header/padding piu' generosi
- `AnnotationDetail.tsx`: stessa larghezza 540px per coprire
  completamente il drawer parent su desktop, padding aumentato

### Dev cookie middleware

`middleware.ts` (NEW, studio): middleware Edge-compatible che setta
automaticamente il cookie `kyron-rev` in dev quando `STUDIO_DEV_USER`
e' configurato. Usa Web Crypto API (non `node:crypto`) per compatibilita'
Edge runtime.

### File toccati Phase 6

| Repo | File | Modifica |
|---|---|---|
| cms | `components/review/ReviewOverlay.tsx` | listener `kyron-rev:mode`, toggle `data-kyron-rev-mode` |
| cms | `components/review/review-selection.ts` (NEW) | `extractSectionContext()`, helper selezione estratti |
| studio | `src/components/preview/PreviewWorkspace.tsx` | `SectionContext`, `selectMode`, `toggleMode()` |
| studio | `src/components/preview/ModeToggle.tsx` (NEW) | toggle button select/browse |
| studio | `src/middleware.ts` (NEW) | dev cookie auto-sign Edge-compatible |
| studio | `src/components/preview/AnnotationsDrawer.tsx` | 540px, inset-4, rounded-2xl, padding |
| studio | `src/components/preview/AnnotationDetail.tsx` | 540px, padding |
| studio-server | `src/features/review-editor/agent.ts` | `SectionContext`, `formatSectionContext()` |
| studio | `src/lib/chat-runtime.ts` | `sectionContext` in `ReviewEditorPendingTarget` |

## Phase 7 — Conferma sync + annotazione manuale (2026-05-27)

Due fix UX dopo feedback live: la conferma proposta richiamava l'agente
inutilmente (lenta), e mancava un modo per aggiungere annotazioni senza
passare dalla chat.

### Conferma proposta sync (no round-trip)

Prima: `confirmProposal`/`cancelProposal` aggiornavano lo stato locale e
chiamavano `runStream` con un messaggio sintetico ("Confermo, aggiungi al
bundle.") all'agente, che ri-elaborava tutta la conversazione solo per
rispondere "ok". Risultato: "Ragionamento..." dopo ogni conferma.

Ora: entrambe sync, no fetch. Aggiungono l'annotazione via `props.onAdd`
e mostrano un ack assistente locale ("Aggiunta al bundle."). L'agente
riceve il nuovo `annotationsCount` nel context al prossimo messaggio.

### Annotazione manuale via form

Nuovo componente `ManualAnnotationForm.tsx`. Quando c'e' un `pendingTarget`,
la `SelectionChip` mostra un bottone "Aggiungi manualmente" che apre un
form inline sotto la chip con:
- Selettore `kind` (text/replace-image/comment/add-section/restructure),
  default derivato dal `nodeKind`
- Textarea testo proposto (per text + add-section)
- Input hint nuova immagine (per replace-image + target image)
- Textarea nota libera

Submit costruisce `ProposeArgs` dal `pendingTarget` + form, riusa
`buildAnnotation()` per produrre `Annotation` completa, chiama `onAdd`,
deseleziona, mostra ack. Zero chiamate all'agente.

### File toccati Phase 7

| File | Modifica |
|---|---|
| `studio/src/components/preview/PreviewChat.tsx` | `confirmProposal`/`cancelProposal` sync, stato `manualOpen`, wiring form |
| `studio/src/components/preview/SelectionChip.tsx` | prop opzionale `onManual` con bottone |
| `studio/src/components/preview/ManualAnnotationForm.tsx` (NEW) | form inline, riusa `buildAnnotation` |

## Limiti residui

- **Annotazioni client-side only**: se ricarichi /preview perdi il bundle.
  Roadmap: persistenza in cookie/Supabase.
- **Multi-select non supportato**: una selezione alla volta.

## Flusso utente

1. `/preview` → form URL bar a `https://staging.kyronedu.it/`
2. Naviga nella pagina del sito desiderata
3. Chat: "Il titolo della hero e' troppo lungo, mettine uno piu' corto"
4. Agente: `propose_annotation({kind:'edit-text', page:'/', original:..., proposal:...})`
5. Agente (chat): "Ho preparato questa annotazione. Confermi?"
6. Utente: "ok"
7. Agente: `add_annotation({...stesso payload...})`
8. Client intercetta tool call → push in React state → AnnotationsList si aggiorna
9. Ripeti finche' bundle e' completo
10. Utente clicca "Invia via email" → confirm → POST `/api/review/send` → Resend con `.md` allegato

## Vedi anche

- `Kyron/documentation/workstreams/03-studio-standalone.md`
- Origine review system: `cms/documentation/features/021-review-mode.md`
