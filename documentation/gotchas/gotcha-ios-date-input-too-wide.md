---
type: gotcha
project: studio
created: 2026-06-14
last_verified: 2026-06-14
tags: [ios, safari, input, date, css, responsive]
---

# `<input type="date">` su iOS prende larghezza intrinseca → sfora il contenitore

## Sintomo
In un layout a colonne (es. grid di filtri), i campi `type="date"` su **iPhone/Safari**
appaiono **più larghi** degli altri controlli affiancati (es. `<select>`) e sforano la
cella, anche con `w-full` (`width:100%`). Su Chrome desktop il problema NON si vede.

## Causa
I date input iOS hanno una **larghezza intrinseca** legata al contenuto (data + icona
calendario) che, senza `appearance: none`, ignora di fatto `width:100%`. I `<select>` del
design system invece hanno già `appearance-none`, quindi si comportano bene → la differenza
di larghezza è proprio quella.

## Fix
Aggiungere `appearance-none` (+ `min-w-0`) ai date input:
```tsx
<Input type="date" className="min-w-0 appearance-none" ... />
```
Verificato in preview a 375px: date input e select tornano alla **stessa larghezza** (335px).

Vedi `src/components/orders/OrdersFilters.tsx`. Compagno: [[gotcha-ios-bottom-sheet-dvh-not-vh]].
