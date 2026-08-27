---
type: feature
project: kyron-studio
created: 2026-08-19
last_verified: 2026-08-19
tags: [ui, design-system, tokens, shell, tailwind-v4, light-only]
---

# 014 — Design della shell: scrivania grigia, lastra di vetro, accento indaco

## Cosa

Redesign completo dello Studio sullo stesso linguaggio visivo dello Studio di
`global-games` (`~/Desktop/Dev/Personal/global-games/studio`). Sostituisce il
look "port da Virgilio" (sidebar bianca con bordo, pagine su fondo bianco, tile
moduli colorate, dark mode).

Tre livelli sovrapposti:

1. **Scrivania** — `.studio-gradient-layer`: grigio neutro `#d6d6d6` con dietro
   due radiali indaco (una grande in alto a destra, una piu' piccola in basso a
   sinistra) che ruotano di tinta piano (`hue-rotate` -28deg -> +38deg in 45s).
2. **Sidebar** — trasparente, appoggiata sulla scrivania. Nessun bordo.
3. **Lastra** — `.studio-content-inset`: il contenuto sta su un rettangolo di
   vetro (radius 20px, blur 24px da 1024px in su, opaco sotto), staccato dai
   bordi di 8/16px.

Sopra la lastra: card bianche **piatte** (niente bordo, niente ombra), cifre KPI
col font a puntini Doto, transizione tra pagine con velo indaco.

## Come

### Strategia: cambiare i valori, non i nomi

Lo Studio aveva 1.364 `className` che leggevano gia' `var(--color-…)` /
`var(--radius-…)`. Sono stati cambiati **solo i valori** dei token in
`src/app/globals.css`: ~100 componenti si sono ridisegnati senza essere toccati.
I file modificati a mano sono ~15.

### Token (`src/app/globals.css`, blocco `@theme`)

| Token | Valore | Note |
|---|---|---|
| `--color-accent` | `#5b67f0` | indaco, copia esatta di global-games (prima era `#1B4FE5`) |
| `--color-accent-soft` | `#7b84f3` | |
| `--color-accent-deep` | `#3a45c8` | usato dal velo di `page-wipe` |
| `--color-accent-tint` | `rgba(91,103,240,0.08)` | fondo delle tile moduli |
| `--color-ink` | `#0b0d12` | |
| `--color-ink-soft` | `#373a46` | |
| `--color-ink-muted` | `#5f636e` | alzato: sul grigio della lastra il vecchio `#6B6F7A` stava a 3.8:1 |
| `--color-paper` | `#ffffff` | card |
| `--color-line` / `-strong` | `#e7e8ec` / `#d1d3d9` | |
| `--radius-control` | `0.625rem` | **era referenziato in 34 punti senza essere definito**: gli angoli venivano quadrati |
| `--radius-card` | `16px` | invariato |
| `--font-sans` | `var(--font-jakarta), …` | Plus Jakarta Sans |
| `--font-dots` | `var(--font-doto), …` | solo cifre grandi |
| `--ease-studio` | `cubic-bezier(0.32,0.72,0,1)` | una sola curva per tutto |

Variabili di shell in `:root` (non in `@theme`, non servono come utility
Tailwind): `--studio-gradient-top/bottom`, `--studio-content-surface`,
`--studio-glass-*`, `--studio-hover-surface`, `--studio-active-surface`,
`--studio-muted-label`, `--studio-content-shadow`.

### Font: adesso sono caricati davvero

Prima `--font-sans` dichiarava `Geist`, `--font-serif` `Instrument Serif`,
`--font-mono` `JetBrains Mono` — **stringhe senza `next/font`**: l'app girava col
font di sistema. Ora `layout.tsx` carica `Plus_Jakarta_Sans` e `Doto` via
`next/font/google`, con le variabili su `<html>` (non su `<body>`, altrimenti
`--font-dots` non risolve da `:root`).

`--font-serif` e `--font-mono` restano come token (sono usati: `font-serif
italic` in 12 titoli, `font-mono` per ID/codici/OTP) ma senza nomi di famiglia
mai caricati: lo stack cade su Georgia / Menlo, che e' quello che faceva prima.

### Regole

- **Light-only.** Il dark mode e' stato rimosso (`ThemeProvider`,
  `ThemeSection`, tab "Tema", blocco `[data-theme="dark"]`). Toglie anche il
  flash di tema al primo paint.
- **Card piatte.** Su lastra grigia la card bianca si stacca da sola: niente
  bordo, niente `--shadow-card` nella variante di default di `ui/Card.tsx`.
- **Tile moduli senza colore.** `shell/modules.ts` non ha piu' il campo `tone`
  (erano 10 hex fuori token): fondo `--color-accent-tint`, icona
  `--color-accent`.
- **Una sola curva di motion**: `--ease-studio`. Ogni animazione ha il suo
  gemello `@media (prefers-reduced-motion: reduce)`.
- **Niente framer-motion**: aurora, lastra, velo e entrata pagina sono CSS.
- **Skeleton mai "Caricamento…"**: barre `--color-line-strong` (il `--color-line`
  su lastra grigia era invisibile).

### Gotcha: il blur va su `::before`, non sulla lastra

`backdrop-filter` sul nodo lo rende **containing block per i figli
`position: fixed`**: drawer ordini, modali e drawer annotazioni si ancoravano
alla lastra (248,16 1184x868) invece che alla finestra. Il vetro sta quindi su
`.studio-content-inset::before` (`position:absolute; inset:0; z-index:-1`) e la
lastra e' `background: transparent` da 1024px in su.

### Gotcha: non scrivere `-webkit-backdrop-filter` a mano

Con entrambe le forme scritte a mano, Lightning CSS (dentro Tailwind v4) scarta
la standard e tiene solo la prefissata — che Chromium non applica: lastra senza
blur. Scrivendo **solo** la forma standard, Lightning aggiunge il prefisso da
solo e ne emette due. Vale anche per `global-games/studio`, che ha lo stesso
codice e quindi lo stesso bug.

### Gotcha: `min-h-screen` dentro la lastra

La lastra e' alta `100dvh - 32px`. Le pagine con `min-h-screen` sforavano di
32px creando uno scroll fantasma: sostituito con `min-h-full` (7 file). Resta
`min-h-screen` solo su `/login`, che sta fuori dalla shell.

### Gotcha: la rail in hover e' un overlay, serve un fondo (studio-core 0.2.4)

La sidebar del core e' `bg-transparent` per scelta: si appoggia alla scrivania
grigia. Ma su `/preview` la rail compatta espansa e' `absolute` sopra il
contenuto — e sotto c'e' un iframe col sito, che si leggeva attraverso le voci
di menu. Da 0.2.4 lo stato espanso porta `bg-[var(--color-paper)]` +
`shadow-[var(--shadow-modal)]`; chiusa resta trasparente. Le utility arrivano
in build perche' `globals.css` ha `@source` sul dist del core: Tailwind v4 non
scansiona node_modules.

## File

**Riscritti**: `src/app/globals.css`, `src/app/layout.tsx`,
`shell/DesktopShell.tsx`, `shell/AppSidebar.tsx`, `ui/Sidebar.tsx`,
`ui/Card.tsx`, `shell/modules.ts`
**Nuovi**: `shell/PageTransition.tsx`, `src/app/(authed)/template.tsx`
**Eliminati**: `shell/ThemeProvider.tsx`, `settings/ThemeSection.tsx`
**Ritoccati**: `Dashboard.tsx`, `settings/SettingsLayout.tsx`, 3 `loading.tsx`,
`login/page.tsx`, `portals/PortalDetail.tsx`,
`chat/generative/AnomalyReport.tsx`, 7 pagine con `min-h-screen`

## Mobile: la lastra e' aperta sotto (2026-08-27)

Sotto i 1024px la lastra non e' piu' una card chiusa: radius solo in alto
(`1.25rem 1.25rem 0 0`) e scende fino al bordo inferiore dello schermo. Il radius
in basso tagliava il contenuto e faceva sembrare la pagina finita.

Due dettagli non ovvi, entrambi in `globals.css` (la lastra vive dentro
`@studiofuturo/studio-core`, installato dal registry: l'unico seam e' l'override):

- il fondo scompare togliendo il `padding-bottom` del wrapper, raggiunto con
  `div:has(> main.studio-content-inset)` perche' il pacchetto non espone una prop;
- la cornice e' un `box-shadow` ring e **un box-shadow non si taglia per lato**:
  va rifatta con tre `inset` su top/left/right.

Scoped a `main` di proposito: `/login` usa `studio-content-inset` su un `div` e
deve restare una card chiusa. Gli 8px di stacco laterale (`px-2`) restano.

Nello stesso blocco c'e' l'override dell'altezza delle bottom sheet in `dvh`:
vedi [[gotcha-ios-bottom-sheet-dvh-not-vh]].

## Marchio della sidebar

`shell/StudioMark.tsx`, portato da global-games: sfera indaco 28px con cinque
dischi che le cadono sotto e si dissolvono, in loop da 3.6s con 0.18s di
sfasamento l'uno dall'altro. Sostituisce il quadratino "K". I keyframes
`studio-mark-disc` stanno in `globals.css` (fermi con `prefers-reduced-motion`).

## Non fatto

- `dashboard/chart-theme.ts` di global-games **non** copiato: i 3 grafici
  Recharts passano gia' i colori come `var(--color-accent)` ecc., quindi
  ereditano l'indaco da soli. Centralizzarli in hex risolto sarebbe piu' codice
  e perderebbe il legame col token.
- `font-serif italic` nei titoli (es. "Ordini *portali*") resta: e' una firma
  Virgilio che global-games non ha. Da decidere con Alek.
- `viewport: { userScalable: false, maximumScale: 1 }` in `layout.tsx` non
  toccato (blocca lo zoom: da chiedere ad Alek, potrebbe essere voluto per i
  drawer iOS).
