---
type: feature
project: kyron-studio
created: 2026-05-26
last_verified: 2026-05-26
tags: [auth, login, otp, resend, workstream-03]
---

# 004 — Login OTP standalone

## Cosa

Login a 2 step su `studio.kyronedu.it/login` (email → codice 6 cifre via
email). Cookie firmato `kyron-rev` su `.kyronedu.it` (7gg). Studio non
dipende piu' dal cms per l'auth.

## Architettura

```
/login (page.tsx)                     UI 2-step
  └─ POST /api/login/request          genera OTP, manda email via Resend
       └─ cookie kyron-otp (10 min)
  └─ POST /api/login/verify           verifica codice + setta kyron-rev
       └─ cookie kyron-rev (7gg, .kyronedu.it)
       └─ redirect a ?next= o /

Auth gate: app/(authed)/layout.tsx → getCurrentUser() → redirect /login
```

## File chiave

| File | Ruolo |
|---|---|
| `src/lib/otp.ts` | sign/verify cookie OTP HMAC + helper review cookie (porta `role`) |
| `src/lib/studio-access.ts` | `resolveStudioAccess(email)` → allowlist + ruolo da DB (feature 008) |
| `src/app/api/login/request/route.ts` | POST email → OTP + email |
| `src/app/api/login/verify/route.ts` | POST code → setta kyron-rev |
| `src/app/login/page.tsx` | UI 2-step Server Component |
| `src/app/(authed)/layout.tsx` | Auth gate per tutte le route protette |
| `src/lib/auth.ts` | `getCurrentUser()` + `loginUrl()` |

## Env vars richieste

| Var | Scopo |
|---|---|
| `RESEND_API_KEY` | invio email OTP (stesso account cms staging) |
| ~~`KYRON_REVIEW_EMAILS`~~ | **deprecato** (feature 008): allowlist ora su collection Payload `studio-users` |
| `KYRON_ADMIN_EMAILS` | CSV admin di bootstrap: fallback login se studio-server/DB down (feature 008) |
| `KYRON_REVIEW_ENABLED` | gate killswitch (`"true"` per abilitare) |
| `KYRON_REVIEW_SECRET` o `PAYLOAD_SECRET` | segreto HMAC (deve matchare cms per transition compat) |
| `KYRON_COOKIE_DOMAIN` | `.kyronedu.it` per cookie cross-subdomain |
| `NEXT_PUBLIC_SERVER_URL` | base assoluta per redirect (evita `0.0.0.0` dietro Traefik) |

## Gotcha

- **Redirect loop `/login`**: il root layout NON deve auth-gateare. Tutte
  le route protette stanno sotto `(authed)/`. `/login` e `/api/login/*`
  restano fuori e accessibili senza cookie.
- **`req.url` legge `0.0.0.0:3010` dietro Coolify+Traefik**: SEMPRE
  costruire URL di redirect con base da `NEXT_PUBLIC_SERVER_URL`. Vedi
  cms feature 025 (stessa gotcha).
- **Cookie domain**: in dev (`localhost`) NON va settato `.kyronedu.it`
  (cookie host-only). In prod si', per condividere con `studio-server`
  e (legacy) cms.

## Flusso login utente

1. Va su `studio.kyronedu.it` → layout (authed) → no cookie → 307 `/login`
2. Inserisce email → POST `/api/login/request`
   - Genera OTP, firma in `kyron-otp` cookie (10 min)
   - Manda email Resend (Studio Kyron `<noreply@kyronedu.it>`)
   - 303 a `/login?step=otp&email=...&sent=ok`
3. Inserisce codice ricevuto → POST `/api/login/verify`
   - Verifica `codeMatches(input, otpCookie.code)`
   - Setta `kyron-rev` 7gg su `.kyronedu.it`
   - Brucia `kyron-otp`
   - 303 a `next` (default `/`)
4. Layout `(authed)` riconosce il cookie → renderizza DesktopShell

## Vedi anche

- `Kyron/documentation/workstreams/03-studio-standalone.md`
- Originale: `cms/lib/studio/otp.ts` + `cms/app/api/studio/login/`
