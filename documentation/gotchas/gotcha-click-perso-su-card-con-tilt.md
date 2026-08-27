---
type: gotcha
project: kyron-studio
created: 2026-08-27
last_verified: 2026-08-27
tags: [frontend, framer-motion, click, popover, dashboard]
---
# Il click si perde sui bottoni dentro una card con tilt/hover

**Sintomo**: un bottone dentro una tile del cruscotto (`StatTile`, ex
`GradientTile` di global-games) non risponde al click da desktop. Da mobile lo
stesso bottone funziona. Nessun errore in console, l'handler non parte.

**Causa**: la tile ha `whileHover={{ y: -8, scale: 1.02 }}` (transizione 500ms) e
un tilt 3D a molla su `rotateX/rotateY` guidato da `pointermove`. Su desktop il
pannello e' quindi **in movimento** mentre premi: `mousedown` cade sul bottone,
`mouseup` 100ms dopo cade su un altro nodo, e per specifica il browser manda il
`click` all'**antenato comune** dei due — non al bottone. Piu' il bottone e'
piccolo e in basso (dove la rotazione sposta di piu'), piu' e' facile perderlo.
Su mobile non c'e' hover e non c'e' pointermove prima del tap: bersaglio fermo,
tap ok. Da qui il "da mobile funzionava", che sembra un problema di hydration e
non lo e'.

**Fix** (`src/components/ui/Popover.tsx`): aprire su `onPointerDown` invece di
`onClick`. Un solo evento = immune al bersaglio in movimento. Accortezze:

- l'overlay di chiusura ascolta `pointerdown`, ma ignora il gesto che ha
  aperto (`hold` fino a `pointerup`). Altrimenti Chrome desktop ritargetta
  il pointer sull'overlay (z-full sopra il trigger) e il popover flickera:
  apre e chiude nello stesso click. Safari iOS non ritargetta, quindi da
  mobile "funzionava";
- `onClick` filtrato con `e.detail === 0` per la tastiera: Enter/Spazio non
  emettono `pointerdown`.

**Regola**: dentro un contenitore che si muove al hover, i controlli si attivano
su `pointerdown`. Vale per qualunque bottone dentro `StatTile`/`GlassCard`.

Il popover si chiude anche su `scroll` in capture. Su Chrome quello include lo
`scrollLeft` del marquee agenti (60 fps). Da desktop il menu flickera: apre e
chiude al frame dopo. Safari iOS non propaga quello scroll a `window`, quindi
da iPhone "funzionava". Il close ignora gli scroll il cui target non contiene
il trigger.
