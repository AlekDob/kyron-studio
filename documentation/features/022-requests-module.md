---
type: feature
project: studio
created: 2026-09-03
last_verified: 2026-09-03
tags: [richieste, agente, ivo, linear, ticket, generative-ui, resend, urgenza]
---

# Feature 022 — Modulo Richieste (Ivo)

## Perche'

I ragazzi di Kyron chiedevano le cose a voce o in chat, e Alek le trascriveva a
mano su Linear. Si perdevano pezzi, e nessuno sapeva a che punto fosse la
propria richiesta.

Ora c'e' una sezione dello Studio dove il collega scrive cosa gli serve, Ivo gli
fa due domande, e alla conferma apre il ticket su Linear. A fianco, la lista di
tutti i ticket con lo stato preso da Linear: cosi' tutti vedono la situazione.

## Cos'e' una richiesta

**Un issue Linear del progetto Kyron.** Non esiste nessuna copia locale: la
lista e' quello che c'e' su Linear in quel momento. Non c'e' database, non c'e'
collection Payload, non c'e' cache.

Chi ha chiesto sta nella riga `Richiesto da: <email>` in fondo alla descrizione.
La chiave API e' personale di Alek, quindi su Linear i ticket risultano tutti
creati da lui: quella riga e' l'unico modo per sapere di chi era la richiesta.

## Coordinate Linear

| Cosa | Valore |
|---|---|
| Team | Studio Futuro (`FUT`) |
| Progetto | Kyron |
| Assegnatario | sempre Alek |
| Stati usati | Todo (blocca adesso), Backlog (puo' aspettare) |
| Label usate | Bug, Feature, Improvement, Article |

Tutti gli id stanno in **un solo posto**: la costante `LINEAR` in
`studio-server/src/core/linear/client.ts`.

## Backend — `studio-server/src/features/requests/`

| File | Ruolo |
|---|---|
| `../../core/linear/client.ts` | `linearQuery()` + costante `LINEAR` con gli id. Senza `LINEAR_API_KEY` lancia un errore parlante, non chiama nessuno |
| `service.ts` | `listRequests()` e `createRequest()`. Unico punto che tocca la rete |
| `route.ts` | `GET /api/v1/requests` — tenant + auth, **niente requireAdmin** |
| `tools.ts` | `list_requests`, `draft_request`, `create_request` |
| `prompt.ts` | system prompt di Ivo |
| `agent.ts` + `agent-route.ts` | `streamText` (maxSteps 8) + SSE `/agents/requests` |

### I tre tool

- **`list_requests`** — filtra il pannello a sinistra e torna il conteggio.
  Ritorna la ricevuta `RequestsReceipt`. Serve anche a rispondere "e' gia' stata
  chiesta?". La ricerca e' una substring semplice: **una parola chiave**, non
  una frase (lo dice la descrizione del tool).
- **`draft_request`** — **non scrive niente**. Ritorna il descriptor `_ui`
  `RequestDraft`, che il client rende come card con Conferma / Modifica.
- **`create_request`** — crea davvero, e solo con `confirm: true`. Stessa regola
  del money-path di Nico: proporre e scrivere sono due passaggi separati.
  All'apertura setta l'urgenza e manda la mail (sotto).

## Urgenza

L'ultima domanda di Ivo e' sempre l'urgenza, e la fa con parole normali ("ti
blocca adesso o puo' aspettare?"). Non la decide da solo: e' l'unica cosa che sa
solo chi chiede.

| Parola | `priority` Linear |
|---|---|
| bloccante | 1 (Urgent) |
| alta | 2 (High) |
| media | 3 (Medium) |
| bassa | 4 (Low) |

La traduzione sta in un posto solo: `URGENCY` in
`studio-server/src/core/linear/client.ts`. Lato Studio le stesse parole stanno
in `components/requests/requests-filter-ui.ts` (non in `lib/requests.ts`: quello
importa `gatewayFetch`, che e' solo-server, e un componente client non puo'
tirarselo dietro per due etichette).

Nella lista l'urgenza si mostra **solo quando blocca**: una pastiglia su ogni
riga smetterebbe di significare qualcosa. Nella scheda c'e' sempre.

## Mail a ogni richiesta

`requests/notify.ts` — quando il ticket si apre parte una mail ad Alek con
numero, oggetto, descrizione, tipo, stato e urgenza, piu' il bottone "Apri su
Linear". Riusa `sendKyronEmail` (mittente `Kyron <web@kyronedu.it>`, logo cid):
stessa impaginazione dei report ordini/analytics.

E' **best-effort**: se Resend e' giu' il ticket resta aperto lo stesso e il
collega non vede un errore che non lo riguarda. Destinatari da
`REQUESTS_NOTIFY_TO` (CSV, default `gmail@alekdob.com`).

Verificato: se il collega scrive "aprilo e basta, non chiedermi conferma", Ivo
si rifiuta e propone comunque la bozza.

## Frontend — `studio/src/components/requests/`

Stessa impalcatura del modulo Clienti, file per file: `RequestsWorkspace`
(lista a sinistra, chat 420px a destra, `MobileChatOverlay` su mobile),
`RequestsView`, `RequestsHeader` + `RequestsTiles` + `RequestsSentence`,
`RequestsList` + `RequestListRow`, `RequestDetail` + `RequestDrawer`.

Due differenze rispetto a Clienti:

1. **Il filtro si applica in pagina, non lato server.** I ticket sono un
   centinaio e arrivano tutti in un colpo: rifare il giro di rete a ogni chip
   sarebbe solo attesa. La funzione pura e' `filterRequests` in
   `requests-filter.ts`, con self-check accanto (`requests-filter.check.ts`).
   L'URL resta comunque l'unica verita' sul filtro.
2. **La scheda non ha tab e non fa nessuna chiamata in piu'**: quello che serve
   e' gia' nella riga. Il posto dove si lavora davvero e' Linear, quindi in
   fondo c'e' il link al ticket.

Card in chat: `RequestsReceipt` (riga su cui tornare, o il link al ticket appena
aperto) e `RequestDraft` (la bozza con i due bottoni), registrate in
`components/chat/generative/registry.tsx`.

## Env

| Var | Scopo |
|---|---|
| `LINEAR_API_KEY` | personal API key Linear. Va in **env Coolify**, mai nella UI Impostazioni: `data/settings.json` si azzera a ogni redeploy |
| `REQUESTS_NOTIFY_TO` | CSV di chi riceve la mail a ogni richiesta aperta. Default `gmail@alekdob.com` |
| `RESEND_API_KEY` | gia' in uso dai report: la mail riusa lo stesso mittente |

## Gotcha

- **Linear linkifica le email da sola.** `Richiesto da: tizio@x.it` diventa
  `[tizio@x.it](<mailto:tizio@x.it>)` nella descrizione salvata. Per questo
  `requesterOf()` estrae l'email con una regex invece di prendere la riga cosi'
  com'e': altrimenti il filtro "solo le mie" non combacia mai.
- **Il filetto `---` si usa gia' nei ticket.** La scheda toglie solo la riga
  `Richiesto da:` (e il filetto che la precede), non tutto quello che sta dopo
  il primo `---`.
- **La chiave e' nuda in `Authorization`**, senza `Bearer`.
