# Studio — Kyron admin hub

Frontend Next.js 16 a `studio.kyronedu.it`. Hub admin per onboarding scuole, link rapidi a Saleor / Payload / Coolify, stats PostHog (in arrivo).

Vedi `decision-012-studio-admin-hub.md` (in `/Users/alekdob/Desktop/Dev/Personal/Kyron/cms/documentation/decisions/`) per il contesto architetturale.

## Stack

- Next.js 16 + React 19 + TS strict
- Tailwind v4 CSS-first (no `tailwind.config.ts`, token in `globals.css`)
- AI SDK client (assistant-ui pattern) per la chat di onboarding
- Auth: cookie Payload condiviso su `.kyronedu.it` (nessuna login form propria)

## Setup locale (3 tab)

Il flusso completo richiede 3 processi in parallelo: Kyron CMS (per Payload + `PendingSchools` collection) + studio-server (agente AI SDK) + studio (questo).

**Tab 1 — Kyron CMS** (deve girare per Payload REST + collection):
```bash
cd /Users/alekdob/Desktop/Dev/Personal/Kyron/cms
npm run dev   # http://localhost:3000
```

Pre-flight Kyron una sola volta:
- In `.env` di Kyron, assicurati che `PAYLOAD_PUSH=true` la prima volta (per creare la tabella `pending_schools`). Poi rimetti `false`.
- Crea un user via `/admin/collections/users` -> "Generate API Key" -> copialo (ti servira' come `STUDIO_PAYLOAD_API_KEY`).

**Tab 2 — studio-server**:
```bash
cd /Users/alekdob/Desktop/Dev/Personal/Kyron/studio-server
cp .env.example .env
# Edita .env: OPENAI_API_KEY
npm install
npm run dev   # http://localhost:8790
```

**Tab 3 — studio (questo)**:
```bash
cd /Users/alekdob/Desktop/Dev/Personal/Kyron/studio
cp .env.example .env.local
# Edita .env.local:
#   STUDIO_PAYLOAD_API_KEY=<dalla tab 1>
#   STUDIO_DEV_USER=alek@kyronedu.it   <- bypass auth in locale (vedi sotto)
npm install
npm run dev   # http://localhost:3010
```

Apri `http://localhost:3010` → vedi l'hub.

### Auth in locale

Il cookie `kyron-rev` setato da Kyron CMS su `localhost:3000` NON e' visibile da `localhost:3010` (host-only, non c'e' subdomain). In dev usiamo `STUDIO_DEV_USER=tuo@email` per bypassare l'auth e iterare sull'UI. In produzione (`NODE_ENV=production`) l'env e' ignorato e si usa solo il cookie cross-subdomain `.kyronedu.it`.

### Smoke test locale

1. `localhost:3010/` → vedi "Ciao alek@kyronedu.it" + hub card
2. `localhost:3010/schools/onboarding` → chat parte, "Come si chiama la scuola?"
3. Rispondi alle domande dell'agente fino al save
4. `localhost:3010/schools/queue` → vedi la PendingSchool appena creata
5. Click "Genera .md" → scarica `<slug>.md` con frontmatter completo
6. Click "Modifica" → apre Payload admin in nuova tab

## Routes

| Path | Tipo | Funzione |
|------|------|----------|
| `/` | Server | Hub: card linker (Saleor / Payload / Coolify / PostHog) |
| `/schools/onboarding` | Client | Chat agentica per nuova scuola |
| `/schools/queue` | Server | Lista PendingSchools dal CMS Payload |
| `/api/agent/onboard-school` | Route handler | Proxy SSE verso studio-server |

## Auth

- Cookie Payload `.kyronedu.it` letto via `cookies()` in Server Component.
- `getCurrentUser()` chiama `kyronedu.it/api/users/me` con cookie forwarding.
- Se manca → redirect a `kyronedu.it/admin/login`.

Per funzionare in produzione, Payload (`Kyron/cms/payload.config.ts`) DEVE essere configurato con:
```ts
cookies: { domain: '.kyronedu.it', secure: true, sameSite: 'lax' }
```
(vedi decision-012).

## Deploy

Coolify Application service su `studio.kyronedu.it`. Cert LE automatico via Traefik condiviso con Kyron + kyron-ecommerce.
