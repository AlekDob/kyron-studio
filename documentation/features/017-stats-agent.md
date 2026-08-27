---
type: feature
project: studio
created: 2026-08-25
last_verified: 2026-08-27
tags: [agent, analytics, posthog, hogql, meta-ads, generative-ui]
---

# Feature 017 — Ada · Statistiche e marketing (PostHog + Meta Ads)

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
  Alzato a **60/ora** il 2026-08-26: da quando Ada fa anche marketing, ogni
  domanda sulle campagne costa una query in piu' per correlare le visite.

## I tool (studio-server)

| Tool | Cosa fa | Budget |
|---|---|---|
| `overview({ range })` | KPI, serie, citta', fonti, pagine, device, per portale sui 7 range predefiniti. Riusa `getOverview`. | no |
| `run_hogql({ query, title, view })` | Sanifica, esegue, ritorna `{columns, rows}` + descriptor `_ui` `Chart`. | si |
| `render_chart({ title, kind, columns, rows })` | Disegna dati che Ada ha gia' in mano (da `overview` o dai tool Meta) senza rifare una query. Stesso descriptor `Chart`. | no |
| `sales_by_product({ range, channelSlug?, view?, top? })` | Prodotti realmente venduti: quantita', fatturato e ordini per prodotto dalle righe d'ordine **Saleor** (`fetchOrdersForRange`), esclusi CANCELED e email di test. Descriptor `_ui` `Chart`. PostHog non conosce i prodotti. | no |
| `list_portals()` | slug + nome dei portali, per tradurre "Massari" nello `school_slug`. | no |
| `get_meta_campaigns({ range })` | spesa, impression, click, CTR, CPC per campagna dalla Marketing API. Descriptor `_ui` `MetaCampaignsCard`. | no |
| `get_meta_campaign_detail({ campaignId, range })` | serie giornaliera di una campagna. | no |

`view` e' uno dei cinque tipi della `ChartCard` — la scelta la fa Ada nel prompt:

| kind | Quando |
|---|---|
| `timeline` | una serie nel tempo (una riga per giorno/ora), area chart |
| `columns` | pochi valori da confrontare a occhio, istogramma verticale |
| `bars` | classifica con etichette lunghe (pagine, nomi scuola), barre orizzontali |
| `pie` | solo parti di un totale, massimo 6 fette (oltre: `bars`) |
| `table` | quando il grafico non aggiunge niente |

**Il multi-serie non ha parametri**: la card legge la prima colonna come
etichetta e ogni colonna numerica successiva come una serie. Una query con due
colonne di misura (`giorno | luglio | giugno`) esce come due serie sullo stesso
grafico.

## Marketing: la correlazione non e' codice

Meta dice quanto spendiamo e quanti click compra; PostHog dice cosa succede sul
sito. Il ponte e' `utm_campaign`, e sta **nel prompt**, non in un tool: Ada
chiama `get_meta_campaigns`, poi scrive lei l'HogQL raggruppata per
`properties.utm_campaign` sullo stesso periodo. Zero codice di join.

Il limite e' vero e Ada lo deve dire: `utm_campaign` e' scritto a mano nel link
dell'inserzione e puo' non coincidere col nome campagna Meta. Se non combacia,
Ada risponde "non posso attribuire le visite" invece di abbinare per
somiglianza.

Env: `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` (in Coolify, non nel settings da
UI: `data/settings.json` si azzera a ogni redeploy). Se mancano, i tool tornano
un errore leggibile — i tool non lanciano mai eccezioni.

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
| `studio-server/src/features/stats-agent/agent.ts` | `runStatsAgent`, `maxSteps: 6`, i tool |
| `studio-server/src/features/stats-agent/sales.ts` | `rangeToDays` + `aggregateByProduct` — vendite per prodotto da Saleor (test in `tests/features/stats-sales-by-product.test.ts`) |
| `studio-server/src/features/stats-agent/route.ts` | SSE `/agents/stats` (tenant + studioAuth) |
| `studio/src/app/(authed)/stats/page.tsx` | pagina, chat a larghezza piena (no pannello laterale) |
| `studio/src/components/stats/StatsChat.tsx` | chat client |
| `studio-server/src/features/stats-agent/meta-ads.ts` | client Marketing API v21 con `fetch` (niente SDK) |
| `studio/src/components/chat/generative/MetaCampaignsCard.tsx` | tabella campagne + `BarList` sulla spesa |
| `@studiofuturo/studio-core` `ChartCard` | la card grafico, condivisa con gli altri Studio (`>=0.3.0`) |
| `studio/src/app/api/agent/stats/route.ts` | proxy SSE Next → studio-server |
| `studio/src/components/shell/modules.ts` | entry `stats` (`Ada · Statistiche`, `kind: "agent"`) |

## Gotcha

- **AI SDK v4 `maxSteps` default 1**: senza `maxSteps: 6` Ada fa la query e non
  commenta il risultato.
- **Colonne solo con `runHogqlWithColumns`**: `runHogql` ritorna solo `results`
  (array di array). Senza i nomi, tabella e grafico non hanno etichette.
  `runHogql` e' rimasto intatto: lo usano 8 query di `/analytics`.
- **La card decide dal nome colonna, non dai dati**: le colonne che si chiamano
  `fatturato/revenue/total/eur/importo/...` sono formattate in EUR, le altre
  come interi. Rinominare una colonna nella query cambia la formattazione.
- **`ResponsiveContainer` senza `initialDimension` resta vuoto** (recharts 3 +
  Next): il primo measure post-hydration torna -1. Gia' gestito nel core.
- **`chartTool` esiste anche nel core** (`@studiofuturo/studio-core/server`), ma
  studio-server lo ridichiara in locale: il descriptor e' 4 righe e la
  dipendenza dal core costerebbe l'auth GitHub Packages nella sua build Docker
  (il `Dockerfile` di `studio` ha `ARG NPM_TOKEN`, quello di `studio-server` no).
- **`POSTHOG_API_KEY` resta lato server**: mai esposta al frontend (decision-017).

## Perche' Coro resta col suo `render_plot`

Coro (`Personal/wacebot`) ha gia' i grafici, con un tool `render_plot` su
Observable Plot. Non condivide niente con questo codice: gli agenti sono righe
di database (`model Bot`), il runtime e' il `pi` agent, i tool stanno in un
array globale JSON Schema e i grafici non passano dal tool result ma da un
blocco messaggio `{kind:"chart"}`. Portare Ada su Coro e' un progetto a se':
il punto d'innesto e' il seam `AgentRuntime`/`ConnectorTool` in
`packages/adapter-kit`, e i tool di Ada leggono PostHog e Meta di Kyron.

## Cosa resta fuori

- cache dei risultati HogQL di Ada (il budget orario basta)
- report email di Ada (c'e' gia' quello analytics delle 09:00)
- query preferite salvate: si vede dopo qualche settimana d'uso quali sono
- `render_chart` sugli altri agenti (Nico, Bruno, Elsa, Ordini): il tool e'
  pronto, e' una riga per agente quando serve davvero
