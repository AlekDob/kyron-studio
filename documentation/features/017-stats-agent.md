---
type: feature
project: studio
created: 2026-08-25
last_verified: 2026-08-25
tags: [agent, analytics, posthog, hogql, generative-ui]
---

# Feature 017 — Ada · Statistiche (agente PostHog)

## Perche'

`/analytics` (feature 009) risponde solo alle domande previste: 7 range fissi,
8 query aggregate, sezioni cablate. Ogni domanda fuori da quelle sezioni
("quanti ordini ha fatto massari a luglio contro giugno?") finiva ad Alek che
apriva la Query API PostHog a mano.

Ada scrive HogQL da sola, in **sola lettura**, e risponde con testo + tabella +
grafico dentro la chat.

## Il vincolo che guida il design

La Query API PostHog sta a **~120 query/ora per key**. La stessa key serve
`/analytics` (cache TTL 5 min) e il report email delle 09:00. Quindi:

- le domande standard passano dal tool `overview`, che legge la cache esistente
  (`getOverview(range)`) e non consuma query;
- Ada ha un budget suo di **40 query/ora** (finestra scorrevole in memoria).
  Esaurito, il tool ritorna un messaggio leggibile, non un 500.

## I tre tool (studio-server)

| Tool | Cosa fa | Budget |
|---|---|---|
| `overview({ range })` | KPI, serie, citta', fonti, pagine, device, per portale sui 7 range predefiniti. Riusa `getOverview`. | no |
| `run_hogql({ query, title, view })` | Sanifica, esegue, ritorna `{columns, rows}` + descriptor `_ui` `StatsResult`. | si |
| `list_portals()` | slug + nome dei portali, per tradurre "Massari" nello `school_slug`. | no |

`view` e' `"table" | "bars" | "line"`: la scelta la fa Ada nel prompt.

## Il guard

`studio-server/src/features/stats-agent/hogql-guard.ts` — l'unico pezzo non
banale, coperto da `tests/features/stats-hogql-guard.test.ts`.

`assertReadOnly(query)`:
- una sola istruzione (nessun `;` interno)
- deve iniziare con `SELECT` o `WITH`
- lista nera `INSERT/ALTER/DROP/DELETE/UPDATE/CREATE/TRUNCATE/ATTACH/DETACH/SYSTEM/GRANT/OPTIMIZE/RENAME`
  (match su `\b...\b`, cosi' `updated_at` passa)
- vietate `url()/file()/remote()/s3()/jdbc()/mysql()/postgresql()` e `INTO OUTFILE`
- se manca `LIMIT`, appende `LIMIT 200`

La key PostHog ha scope `query:read`: una scrittura fallirebbe comunque lato
PostHog. Il guard e' il secondo lucchetto — serve a non spendere una chiamata e
a dare un messaggio chiaro invece di un 403 opaco.

## Lo schema nel prompt

`prompt.ts` porta lo schema PostHog esplicito, altrimenti l'LLM inventa i nomi
dei campi e la query torna zero righe **senza errore**.

Regola non negoziabile: ogni query filtra
`properties.$host IN ('kyronedu.it','www.kyronedu.it')` — il project PostHog e'
condiviso con staging e localhost, senza il filtro i numeri sono sbagliati.

Convenzioni imposte: visitatori = `count(DISTINCT person_id)`, pageview =
`countIf(event = '$pageview')`, fatturato =
`sumIf(coalesce(toFloat(properties.total), 0), event = 'order_completed')`.

## File

| File | Ruolo |
|---|---|
| `studio-server/src/features/analytics/posthog.ts` | `runHogqlWithColumns` (come `runHogql` ma tiene i nomi delle colonne) |
| `studio-server/src/features/stats-agent/hogql-guard.ts` | sanitize + budget |
| `studio-server/src/features/stats-agent/prompt.ts` | schema PostHog + regole di query |
| `studio-server/src/features/stats-agent/agent.ts` | `runStatsAgent`, `maxSteps: 6`, i 3 tool |
| `studio-server/src/features/stats-agent/route.ts` | SSE `/agents/stats` (tenant + studioAuth) |
| `studio/src/app/(authed)/stats/page.tsx` | pagina, chat a larghezza piena (no pannello laterale) |
| `studio/src/components/stats/StatsChat.tsx` | chat client |
| `studio/src/components/chat/generative/StatsResult.tsx` | tabella sempre, + `BarList` o area chart |
| `studio/src/app/api/agent/stats/route.ts` | proxy SSE Next → studio-server |
| `studio/src/components/shell/modules.ts` | entry `stats` (`Ada · Statistiche`, `kind: "agent"`) |

## Gotcha

- **AI SDK v4 `maxSteps` default 1**: senza `maxSteps: 6` Ada fa la query e non
  commenta il risultato.
- **Colonne solo con `runHogqlWithColumns`**: `runHogql` ritorna solo `results`
  (array di array). Senza i nomi, tabella e grafico non hanno etichette.
  `runHogql` e' rimasto intatto: lo usano 8 query di `/analytics`.
- **`StatsResult` indovina la colonna valore**: prende l'ultima colonna numerica
  della prima riga (le query aggregate mettono la dimensione a sinistra). Le
  colonne con nome tipo `fatturato/revenue/total/eur` sono formattate in EUR.
- **`POSTHOG_API_KEY` resta lato server**: mai esposta al frontend (decision-017).

## Cosa resta fuori

- cache dei risultati HogQL di Ada (il budget orario basta)
- report email di Ada (c'e' gia' quello analytics delle 09:00)
- query preferite salvate: si vede dopo qualche settimana d'uso quali sono
