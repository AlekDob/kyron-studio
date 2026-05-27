---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-26
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
