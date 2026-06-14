---
type: gotcha
project: studio
created: 2026-06-14
last_verified: 2026-06-14
tags: [ios, safari, drawer, bottom-sheet, vh, dvh, notch, animation, css]
---

# Bottom-sheet su iOS: usare `dvh` + safe-area, non `vh` (header sotto la notch)

## Sintomo
Un drawer/bottom-sheet `position: fixed; inset-x-0; bottom-0; max-h-[88vh]` su **iPhone**
sale troppo in alto e l'**header viene tagliato dalla barra di stato/notch** (l'eyebrow e la
prima riga finiscono sotto il notch). Su Chrome desktop sembra ok.

## Causa
`vh` su iOS Safari si riferisce al **layout viewport** (include l'area dietro la
barra/toolbar), non al viewport **visibile**. Combinato con `position: fixed` (che usa il
layout viewport), `88vh` in pixel risulta più alto dell'88% del visibile → la sheet supera
l'area utile e il suo bordo superiore va sotto il notch.

## Fix
1. **`dvh`** (dynamic viewport height) invece di `vh`: segue il viewport visibile reale.
2. Lasciare un **gap garantito** in cima sottraendo safe-area + un margine:
```
max-h-[calc(100dvh-env(safe-area-inset-top)-3rem)]
```
Così il bordo superiore della sheet è sempre ≥ (safe-area + 3rem) sotto il top visibile →
l'header resta libero. Verificato in preview: gap superiore ~50px, header completo.

## Animazione di ENTRATA (non solo uscita)
Montare a riposo e far partire la transizione al frame dopo, con **doppio
`requestAnimationFrame`** (un solo `setTimeout(...,10)` non è affidabile su iOS):
```tsx
useEffect(() => { if (!render) return;
  const r1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setShow(true)); });
  return () => { cancelAnimationFrame(r1); cancelAnimationFrame(raf2); };
}, [render]);
```
Se si monta direttamente con lo stato "aperto", il browser non registra il cambio di
transform e l'apertura non anima (anima solo la chiusura).

Riferimento: `src/components/orders/OrderDrawer.tsx`. Compagno: [[gotcha-ios-date-input-too-wide]].
