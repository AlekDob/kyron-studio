---
type: feature
project: kyron-studio
created: 2026-08-31
last_verified: 2026-08-31
tags: [ui, design-system, dark-mode, tokens, settings]
---

# 020 — Dark mode + tab Tema nei settings

## Cosa

Tema scuro per tutto lo Studio, con scelta Chiaro / Scuro / Sistema in
Impostazioni → Tema (visibile a tutti, non solo admin). Supera il "light-only"
della feature 014.

## Come

Stessa strategia della feature 014: **cambiare i valori dei token, non i nomi**.
Dal 2026-08-31 il blocco dark vive in **studio-core >= 0.4.0** (`theme.css`,
`html[data-theme="dark"]`): il pacchetto definisce i due set di valori, l'app
tiene switch, tile del cruscotto e ring mobile. Nessun componente ridisegnato.

| Pezzo | Dove | Note |
|---|---|---|
| Token dark | **studio-core 0.4.0** `theme.css`, blocco `html[data-theme="dark"]` | paper `#232429`, ink `#f2f3f7`, accent alzato a `#7b84f3`, lastra `#1b1c21`, sfere piu' accese, `color-scheme: dark` |
| Vetro lastra | studio-core 0.4.0 | il bianco hardcodato del `::before` e' diventato token `--studio-content-glass` (light `rgb(239 239 239 / 86%)`, dark `rgb(27 28 33 / 82%)`) |
| `dark:` shadcn | `@custom-variant dark` su `[data-theme="dark"]` | segue la scelta utente, non prefers-color-scheme |
| Switch senza flash | `app/layout.tsx`, `THEME_INIT` inline in `<body>` | legge localStorage prima del paint; `suppressHydrationWarning` su `<html>` (lo script cambia l'attributo prima dell'hydration) |
| Tab Tema | `settings/ThemeSection.tsx` + `SettingsLayout.tsx` | 3 card radio con miniatura; chiave `kyron-studio-theme` in localStorage, "Sistema" = chiave assente. Default tab per gli editor |
| Tile cruscotto | token `--tile-{indaco,menta,ambra,rosa}` in `globals.css` | i gradienti sono usciti da `StatTile.tsx`: nel dark il colore diventa alone su base grafite, il testo segue `--color-ink` da solo |
| Ring mobile | token `--studio-inset-ring` | era un rgb() ripetuto 6 volte |

## Bonifiche hardcoded

- `RangePicker` `text-white` → `text-[var(--color-paper)]` (il chip e' `bg-ink`, si inverte da solo)
- `TilePill` `bg-white/70` → `bg-[var(--color-paper)]/70`
- `AgentsGrid` anello avatar `border-white` → `border-[var(--color-paper)]`

## Lasciati apposta

- Thumbnail prodotto / logo portale `bg-white`: le foto hanno il fondo bianco
- `ColorPicker` ordini: colori reali dei prodotti
- Email HTML e anteprima mail DDT: le email restano light
- Iframe Anteprima (`/preview`): il sito e' light, resta su fondo bianco

## Gotcha

- La preferenza e' **per-browser** (localStorage): niente sync tra dispositivi,
  YAGNI finche' nessuno lo chiede
- Se cambi la logica di `applyTheme` in `ThemeSection`, cambia anche `THEME_INIT`
  in `layout.tsx`: fanno lo stesso calcolo
- I valori dark si ritoccano in **studio-core** (`src/theme.css`) + publish,
  non qui: il contratto e' documentato nel README del pacchetto (sezione
  "Dark mode"). La guardia del core vieta nomi cliente nei sorgenti
- Con "Sistema" attivo, il cambio tema del SO a pagina aperta si vede al reload
  (niente listener live, scelta deliberata)
