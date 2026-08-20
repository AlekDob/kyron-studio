---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-08-19
tags: [settings, ui, tabs, virgilio-port]
---

# 002 — Settings: tabs layout Virgilio-style

## Cosa

Pagina `/settings` ridisegnata con layout 2-column Virgilio: rail sinistro
fisso 256px con tabs verticali, pane destro con la sezione attiva. Tabs
gestiti via `useState` lato client. Tabs disabled mostrano badge "presto".

## Stato

Live 2026-05-26. Sostituisce il vecchio layout single-column con header
+ link "Hub" (ridondante ora che c'e' la sidebar globale).

## Tabs configurati

| Tab | Stato | Sezione |
|---|---|---|
| Profilo | presto | placeholder `ComingSoonSection` |
| Connessioni | **live** | `ProviderConnectionsSection` (10 provider AI) |
| Modelli AI | **live** | `ModelRoutingSection` (routing per agente) |
| ~~Tema~~ | **rimossa 2026-08-19** | lo Studio e' light-only (feature 014); gli editor aprono su Profilo |
| Organizzazione | presto | placeholder |
| MCP Servers | presto | placeholder |

## File

| File | Ruolo |
|---|---|
| `src/app/settings/page.tsx` | server, monta `<SettingsLayout/>` |
| `src/components/settings/SettingsLayout.tsx` | client, tabs nav + content switch |
| `src/components/settings/ProviderConnectionsSection.tsx` | (gia' esistente) |
| `src/components/settings/ModelRoutingSection.tsx` | (gia' esistente) |
| ~~`src/components/settings/ThemeSection.tsx`~~ | eliminato 2026-08-19 (light-only, feature 014) |
| `src/components/settings/ComingSoonSection.tsx` | nuovo, placeholder generico |

## Differenze con Virgilio

| Aspetto | Virgilio | Kyron Studio |
|---|---|---|
| ~~ThemeProvider~~ | light + dark + system + 6 accent presets + custom color | eliminato: lo Studio e' light-only, accent indaco fisso |
| ProfileSection | dipende da `useOrg` provider | placeholder |
| OrgSection | dipende da `useOrg` + multi-tenant | placeholder |
| McpServersSection | API `/mcp/*` reali | placeholder |
| Routing tabs | `useState` interno | uguale |

## Come aggiungere un tab

1. Crea la sezione: `src/components/settings/MiaSezione.tsx` (client component).
2. Edita `SettingsLayout.tsx`:
   - aggiungi l'id al type `Tab`
   - aggiungi una row a `TABS` (rimuovi `disabled: true`)
   - aggiungi `{active === "miaid" && <MiaSezione/>}` nel pane destro

## Riferimenti

- Fonte port: `Virgilio/apps/client/src/modules/settings/SettingsModule.tsx`
- Feature 001 (shell): `001-shell-sidebar-dashboard.md`
- Workstream: `Kyron/documentation/workstreams/01-studio-shell-port.md`
