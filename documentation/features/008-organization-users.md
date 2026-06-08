---
type: feature
project: kyron-studio
created: 2026-06-08
last_verified: 2026-06-08
tags: [auth, ruoli, rbac, organizzazione, settings, admin, editor]
---

# 008 — Organizzazione: utenti & ruoli

## Cosa

Gestione degli utenti di Studio (`studio.kyronedu.it`) direttamente dalla UI,
in Impostazioni → **Organizzazione** (admin-only). Sostituisce la env var
`KYRON_REVIEW_EMAILS` con una collection Payload come fonte di verita'.

Due ruoli:
- **admin**: gestisce utenti + sezioni di sistema (Connessioni provider AI,
  Modelli AI, MCP) oltre a tutto il resto.
- **editor**: tutto tranne le sezioni admin-only. Puo' comunque creare/modificare
  ed eliminare dati e portali.

## Storage

Collection Payload **`studio-users`** (`cms/payload/collections/StudioUsers.ts`):
`email` (unique) · `role` (admin|editor) · `isActive` · `invitedBy`.
NON e' la collection `users` (quelli sono admin Payload + service API key).

## Architettura

```
LOGIN (pre-cookie)
  /api/login/{request,verify} → resolveStudioAccess(email)   (studio/src/lib/studio-access.ts)
     → studio-server GET /auth/resolve?email=  (no cookie, X-Tenant)
        → studio-users (Payload) → { allowed, role }
     → fallback bootstrap: KYRON_ADMIN_EMAILS se DB/server down (solo admin)
  verify firma kyron-rev con role nel payload (UI gating)

GATING UI (post-login)
  settings/page.tsx → getCurrentUser() → isAdmin() → SettingsLayout
     tab adminOnly (connessioni/modelli/mcp/org) nascoste agli editor

AZIONI ADMIN (authz reale, lato server)
  studio /api/org/* → proxy (X-Tenant + cookie) → studio-server /api/v1/studio-users
     middleware: tenant → studioAuth → requireAdmin (lookup ruolo fresco da DB)
  /settings/* ora: tenant → studioAuth → requireAdmin
```

## File chiave

| File | Ruolo |
|---|---|
| `cms/payload/collections/StudioUsers.ts` | collection studio-users |
| `cms/scripts/seed-studio-users.mjs` | seed idempotente (2 admin + 3 editor) |
| `studio-server/src/core/studio-users/store.ts` | CRUD + lookup + countActiveAdmins |
| `studio-server/src/middleware/require-admin.ts` | gate admin (lookup ruolo da DB) |
| `studio-server/src/features/auth/route.ts` | `/auth/resolve` (pre-login) + `/auth/me` |
| `studio-server/src/features/studio-users/route.ts` | CRUD admin-only + anti-lockout |
| `studio/src/lib/studio-access.ts` | `resolveStudioAccess` + fallback bootstrap |
| `studio/src/lib/auth.ts` | `StudioUser.role`, `getCurrentUser`, `isAdmin` |
| `studio/src/lib/otp.ts` | `signReviewCookie(email, role)` |
| `studio/src/lib/org-api.ts` | client `/api/org/studio-users` |
| `studio/src/app/api/org/[...path]/route.ts` | proxy → studio-server (inoltra cookie) |
| `studio/src/components/settings/OrganizationSection.tsx` | UI invito/ruolo/attiva/rimuovi |
| `studio/src/components/settings/SettingsLayout.tsx` | filtro tab adminOnly + render org |
| `studio/src/app/api/logout/route.ts` | logout: cancella kyron-rev (stesso domain) → /login |
| `studio/src/components/shell/AppSidebar.tsx` | voce "Esci" nel footer sidebar |

## Sicurezza / scelte

- **Authz reale lato server**: `requireAdmin` fa lookup fresco del ruolo dal DB
  per l'email del cookie. Il `role` nel cookie e' SOLO per il gating UI (non e'
  trusted per le azioni).
- **Anti-lockout**: non si puo' rimuovere/declassare/disattivare l'ultimo admin
  attivo (guard in `studio-users/route.ts` + `countActiveAdmins`).
- **Fallback bootstrap**: se studio-server/Payload e' irraggiungibile al login,
  solo gli indirizzi in `KYRON_ADMIN_EMAILS` possono entrare (come admin). Gli
  editor sono gestiti esclusivamente dal DB.
- **studio-users NON e' nel registry Dati**: gli editor non la vedono nel modulo
  Dati; si gestisce solo da Organizzazione (admin).

## Deploy (collection nuova → schema DB)

Vedi GOTCHA Schema DB del cms (payload migrate KO → `db/schema.sql` idempotente):
1. Dev: `PAYLOAD_PUSH=true npm run dev` (o run del seed con `PAYLOAD_PUSH=true`).
2. Seed: `node_modules/.bin/tsx scripts/seed-studio-users.mjs`.
3. Prod: rigenerare `cms/db/schema.sql` (nuova tabella `studio_users`) + seed sul
   Postgres target; settare `KYRON_ADMIN_EMAILS` su studio.
4. Dopo migrazione: svuotare `KYRON_REVIEW_EMAILS` (deprecata).

## Env vars

| Var | Dove | Scopo |
|---|---|---|
| `KYRON_ADMIN_EMAILS` | studio | CSV admin bootstrap (fallback login se DB down) |
| `TENANT_KYRON_PAYLOAD_API_KEY` | studio-server | service key per leggere/scrivere studio-users |

## Logout / refresh ruolo

Il ruolo viaggia nel cookie `kyron-rev` (firmato al login). Un cookie emesso
**prima** del rollout di questa feature NON ha il `role` → l'utente e' trattato
come **editor** (privilegio minimo). Per applicare il ruolo corretto serve
**re-login**: voce **"Esci"** nel footer sidebar → `GET/POST /api/logout`
(cancella `kyron-rev` con lo stesso `KYRON_COOKIE_DOMAIN`) → `/login` → il nuovo
cookie porta il `role` risolto dal DB. Stesso meccanismo per applicare un
cambio ruolo: l'utente deve rifare login (il cookie dura 7gg).

## Vedi anche

- `004-login-standalone.md` (login OTP, ora con ruolo)
- `002-settings-tabs-layout.md` (tab settings)
