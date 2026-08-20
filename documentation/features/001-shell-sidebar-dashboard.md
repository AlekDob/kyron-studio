---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-08-19
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
| Shell | `src/components/shell/DesktopShell.tsx` | scrivania + `CommandPaletteProvider` + `AppSidebar` + lastra contenuto + `PageTransition` (feature 014) |
| Sidebar | `src/components/shell/AppSidebar.tsx` | sezioni: Inbox/Dashboard/Comandi, Agenti AI, Strumenti, footer email + Esci |
| Registry moduli | `src/components/shell/modules.ts` | 6 moduli Kyron + helper `findModuleByPath` |
| ~~Theme~~ | — | **rimosso 2026-08-19**: lo Studio e' light-only, vedi feature 014 |
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
| Viewport height | `100dvh` solo su `DesktopShell` outer; workspace usano `h-full` (vedi nota sotto) |
| Navigazione | Drawer si chiude automaticamente al cambio route |
| Header mobile | `shrink-0` (non più sticky) — fa parte del flex column di `<main>` |
| Comandi ⌘K | Nascosto su mobile (`hidden lg:flex`), accessibile solo da desktop |

### Mobile viewport fix (2026-05-28)

Sintomo: nei workspace con form input in fondo (es. `PortalsChat` onboarding), su iOS Safari l'input non era visibile al primo render — appariva solo dopo un'interazione/scroll.

Causa: doppio `h-[100dvh]` (DesktopShell outer + workspace inner) + mobile header `sticky` ~49px → contenuto totale dentro `<main>` ~49px più alto del viewport. Il form veniva clippato sotto la URL bar; iOS lo riportava in view solo quando nascondeva la URL bar dopo un'interazione.

Fix:
- `DesktopShell.tsx`: `<main>` ora è `flex flex-col overflow-hidden`. Mobile header `shrink-0`. Children wrappati in `<div className="flex-1 min-h-0 overflow-y-auto">` che scrolla solo quando serve.
- Workspace (`PortalsWorkspace`, `DataWorkspace`, `PreviewWorkspace`): `h-[100dvh]` → `h-full`. Riempiono il wrap shell (= viewport - header su mobile, = 100dvh netto su desktop).

## Mobile chat FAB (2026-05-27)

Componente shared `MobileChatOverlay` (`src/components/shell/MobileChatOverlay.tsx`):
FAB fisso in basso a destra su mobile, apre fullscreen overlay con il pannello chat/context.

| Workspace | Label FAB | Contenuto overlay |
|---|---|---|
| Dati (`DataWorkspace`) | "Editor Dati" | Header contesto + DataChat |
| Anteprima (`PreviewWorkspace`) | "Review Editor" | ReviewPanel (chat + annotations) |
| Portali (`PortalsWorkspace`) | "Portali" | Side panel lista/detail (icona LayoutList) |

Settings non ha chat — usa tab rail orizzontale scrollabile su mobile.

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
- Cambiare palette: edita `globals.css`, blocco `@theme`. Il dark mode non
  esiste piu' (feature 014): niente `[data-theme="dark"]`.
- Bypass auth in dev: `STUDIO_DEV_USER=tua@email npm run dev`.

## Deps esterne aggiunte

`cmdk`, `lucide-react`, `@radix-ui/react-dialog`. Vedi `package.json`.

## Riferimenti

- Workstream: `Kyron/documentation/workstreams/01-studio-shell-port.md`
- Fonte port: `Virgilio/packages/ui/src/primitives/`, `Virgilio/apps/client/src/shell/`
- Decisione: copy-paste invece di workspace pnpm (trigger estrazione non
  soddisfatto, vedi workstream Phase 2).
