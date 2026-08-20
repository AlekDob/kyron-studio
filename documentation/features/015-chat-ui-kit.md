---
type: feature
project: kyron-studio
created: 2026-08-19
last_verified: 2026-08-20
tags: [ui, chat, blobatar, agenti, design-system]
---

# 015 — Kit chat condiviso: avatar blobatar, composer unico

## Cosa

Le sei chat agente dello Studio (Onboarding, Portali, Dati, Controlli,
Anteprima, Agevolazioni) condividono ora tre pezzi invece di copiarsi il
markup. Stile preso dalla chat di Virgilio
(`apps/client/src/modules/_shared/ModuleAgentChat.tsx`), avatar presi da
`studio-futuro` (`StudioBlobatar`).

Prima: la risposta dell'agente era testo nudo senza avatar ne' nome, e il
composer era lo stesso blocco di markup ripetuto sei volte con differenze
casuali (una chat aveva la freccia in SVG scritto a mano, un'altra il
`focus-within`).

## I tre pezzi

| File | Ruolo |
|---|---|
| `src/components/chat/ChatAvatar.tsx` | avatar blobatar dell'agente |
| `src/components/ui/ChatBubble.tsx` | riga messaggio (avatar + nome + testo) |
| `src/components/chat/ChatComposer.tsx` | campo di scrittura + invio |

### ChatAvatar

Pacchetto `blobatar` (v2, zero dipendenze). La forma e' deterministica dal
nome: "Portali" avra' sempre la stessa faccia.

- **hue libera**: e' quella che da' a ogni agente un colore diverso. Portali
  ciano, Controlli rosa, Editor Dati lilla, Onboarding verde oliva, Review
  Editor verde acqua, Agevolazioni corallo.
- **tone bloccato a 0.45**: senza lock alcuni nomi escono quasi neri
  (verificato: "Portali" dava `#213d41`) e l'avatar non si legge. A 0.45 sono
  tutti pastelli pieni con la stessa luminosita', come le card di
  `studio-futuro`.
- **statico, non animato**: `animate` costringe blobatar a SVG inline (~12 nodi
  DOM per messaggio) per un respiro che in una lista di chat non si guarda.
  Per accenderlo basta passare `animate="hover"` + `import "blobatar/motion.css"`.

### ChatBubble

- `role="user"`: bolla a destra, come prima.
- `role="assistant"`: nessuna bolla. Avatar 36px + nome 11px + testo. Il nome
  arriva dalla prop `agent` ed e' anche il seed dell'avatar, quindi nome e
  faccia non possono divergere.
- Stato "thinking": tre sfere del brand (stessa gradiente di `StudioMark`) che respirano in sequenza, animate in CSS (`.chat-thinking-dot` in `globals.css`). Provata e scartata la libreria `thinking-orbs`: canvas su una UI tutta CSS, stonava col resto del sito.

### ChatComposer

Card e non pillola (`rounded-[20px]`, `shadow-card`, `focus-within` sul bordo),
freccia `ArrowUp` di lucide, input 15px. Prop `hint` per la riga di disclaimer
sotto il campo (la usa solo Onboarding).

## Nomi agente

`Onboarding Scuole`, `Portali`, `Editor Dati`, `Controlli`, `Review Editor`,
`Agevolazioni`. Cambiare una di queste stringhe **cambia anche l'avatar**: e' il
seed.

## Non fatto

- Empty state alla Virgilio (titolo grande + chip suggerimenti): le chat
  aprono con un messaggio di saluto dell'agente, sostituirlo e' una scelta di
  contenuto per ognuna delle sei.
- Espressioni blobatar (`blobatar/expression`): l'agente potrebbe fare la
  faccia contenta a tool riuscito. Serve `animate` per il morph.
- Timestamp accanto al nome: i turni in memoria non hanno un orario.
