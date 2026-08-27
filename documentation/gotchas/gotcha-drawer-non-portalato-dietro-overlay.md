---
type: gotcha
project: studio
created: 2026-08-27
last_verified: 2026-08-27
tags: [mobile, drawer, z-index, portal, stacking, overlay, catalogo]
---

# Drawer non portalato: su mobile si apre DIETRO l'overlay agenti

## Sintomo
Su iPhone, nel pannello di Nico (`/catalogo`), toccare la riga di un prodotto **non sembra
fare niente**. Chiudendo il pannello con la X compare il dettaglio prodotto — quindi era
aperto da subito, solo invisibile. Su desktop tutto ok.

## Causa
Non e' un problema di evento: e' stacking. Erano due `fixed` in stacking context diversi:

| Elemento | Come stava |
|---|---|
| `MobileChatOverlay` (pannello agenti) | `createPortal` su body, `zIndex: 60` |
| `ProductDrawer` (dettaglio) | `z-50`, **renderizzato in place** dentro la pagina |

Il drawer, restando nell'albero della pagina, non compete con un portal su body: apriva
dietro il pannello. Il `z-50` non serviva a niente perche' l'antenato aveva un contesto
piu' basso dell'overlay.

## Fix (2026-08-27)
Tutti i drawer usano il `Drawer` di `@studiofuturo/studio-core`: fa `createPortal` su body
con backdrop `z-[70]` e pannello `z-[80]` **uguali per tutti**. Cosi' l'ordine di apertura
decide chi sta sopra (il nodo montato dopo e' l'ultimo del body) e l'impilamento diventa
prevedibile: lista → dettaglio → portale.

Regola: **su mobile un pannello a schermo pieno deve essere un portal su body**. Se ne
scrivi uno nuovo, non inventare un `z-` nuovo: usa il `Drawer` del pacchetto.

## Effetto collaterale accettato
Con due sheet impilate, `Esc` chiude **entrambe** (tutti i `Drawer` ascoltano su `window`).
Prima il dettaglio si chiudeva da solo. Coerente col nuovo modello, ma da sapere.

Compagno: [[gotcha-ios-bottom-sheet-dvh-not-vh]].
