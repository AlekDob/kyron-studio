---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-26
tags: [shell, ui, sidebar, dashboard, settings, virgilio-port]
---

# 001 — Shell: sidebar + dashboard + command palette

## Cosa

Shell desktop di Studio: sidebar laterale fissa 248px, dashboard Virgilio-style
con ricerca + griglia agenti + griglia strumenti, command palette ⌘K, theme
toggle light/dark con persistenza.

## Stato

Phase 1 completata 2026-05-26. Responsive mobile aggiunto 2026-05-27. Pronta per `npm run dev` su `:3010`.

## Componenti

| Layer | File | Ruolo |
|---|---|---|
| Layout root | `src/app/layout.tsx` | async, auth check, monta `DesktopShell` |
| Shell | `src/components/shell/DesktopShell.tsx` | wrap `ThemeProvider` + `CommandPaletteProvider` + `AppSidebar` + main |
| Sidebar | `src/components/shell/AppSidebar.tsx` | sezioni: Inbox/Dashboard/Comandi, Agenti AI, Strumenti, footer theme |
| Registry moduli | `src/components/shell/modules.ts` | 6 moduli Kyron + helper `findModuleByPath` |
| Theme | `src/components/shell/ThemeProvider.tsx` | light/dark, localStorage `kyron-studio-theme` |
| Palette | `src/components/shell/CommandPaletteProvider.tsx` | ⌘K via cmdk, naviga con `useRouter` |
| Dashboard | `src/components/Dashboard.tsx` | client, ricerca live su modules |

## Responsive mobile (2026-05-27)

| Breakpoint | Comportamento |
|---|---|
| `< lg` (mobile/tablet) | Sidebar nascosta, drawer overlay 280px da sinistra con hamburger nella top bar sticky |
| `>= lg` (desktop) | Sidebar fissa 248px, layout originale |

| Aspetto | Dettaglio |
|---|---|
| Zoom | Disabilitato via `viewport` export (`userScalable: false`, `maximumScale: 1`) |
| Viewport height | `100dvh` (dynamic viewport height, gestisce barra browser mobile) |
| Navigazione | Drawer si chiude automaticamente al cambio route |
| Header mobile | Sticky top bar con hamburger + titolo "Studio" |

## Primitive UI usate (da `@/components/ui`)

`Sidebar`, `Card`, `Input` (con `iconLeft`), `Pill`, `IconButton`, `ActionCard`,
`FloatingModal`, `SourceCard`, `Button`, `ChatBubble`, `Select`, `Textarea`.

Tutte port-as-is da Virgilio `@virgilio/ui` (header `// Source: Virgilio ...`).

## Moduli configurati

| ID | Status | Route | Kind |
|---|---|---|---|
| inbox | coming-soon | `/inbox` | tool |
| schools-onboarding | **live** | `/schools/onboarding` | agent |
| portals | coming-soon | `/portals` | agent |
| brain | coming-soon | `/brain` | tool |
| log | coming-soon | `/log` | tool |
| settings | **live** | `/settings` | tool |

## Come modificarla

- Aggiungere modulo: edita `modules.ts`, push nell'array `MODULES`. Sidebar e
  dashboard si aggiornano da sole.
- Cambiare tema palette: edita `globals.css` `@theme` (light) e
  `[data-theme="dark"]` (dark).
- Bypass auth in dev: `STUDIO_DEV_USER=tua@email npm run dev`.

## Deps esterne aggiunte

`cmdk`, `lucide-react`, `@radix-ui/react-dialog`. Vedi `package.json`.

## Riferimenti

- Workstream: `Kyron/documentation/workstreams/01-studio-shell-port.md`
- Fonte port: `Virgilio/packages/ui/src/primitives/`, `Virgilio/apps/client/src/shell/`
- Decisione: copy-paste invece di workspace pnpm (trigger estrazione non
  soddisfatto, vedi workstream Phase 2).
