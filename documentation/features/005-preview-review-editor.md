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

## Limiti MVP

- **Cross-origin iframe**: `studio.kyronedu.it` vs `staging.kyronedu.it`
  → no postMessage, no selector live, no inject script. L'agente lavora
  con currentUrl + path dal context. Per il selector overlay vero serve
  cooperazione cms-side.
- **Annotazioni client-side only**: se ricarichi /preview perdi il bundle.
  Roadmap: persistenza in cookie/Supabase.

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
