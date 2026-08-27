---
type: feature
project: kyron-studio
created: 2026-08-25
last_verified: 2026-08-27
tags: [ui, dashboard, agenti, suspense, streaming]
---

# 016 — Cruscotto home + agenti con nome proprio

## Cosa

Due cose in un colpo, sul modello di global-games Studio (stesso pacchetto
`@studiofuturo/studio-core`):

1. la home `/` non e' piu' un launcher di card, e' un **cruscotto** con numeri veri;
2. i 5 agenti hanno un **nome proprio** invece del nome della loro sezione.

Prima: la home ripeteva ricerca + 11 card, cioe' esattamente quello che stanno
gia' in sidebar e in `Cmd+K`. Zero dati. E gli agenti si chiamavano "Controlli",
"Agevolazioni": nessuna identita', e l'avatar blobatar (seedato sul nome)
cambiava faccia se cambiavi il titolo del modulo.

## Gli agenti

| Nome | Sezione | Modulo |
|---|---|---|
| Livia | Portali | `/portals` |
| Bruno | Controlli | `/checks` |
| Elsa | Agevolazioni | `/vat-relief` |
| Vera | Anteprima | `/preview` |

Fonte unica: `src/components/shell/modules.ts`. Il label e' doppio
(`Livia · Portali`), costruito una volta dall'helper `agent(name, role)`, quindi
sidebar e palette lo prendono gratis leggendo `m.label` come facevano prima.

Due export nuovi dallo stesso file:

- `AGENTS` — i 4 moduli `kind: "agent"` con nome e ruolo, per la griglia agenti
- `agentNameOf(moduleId)` — il nome per le chat; prima era una stringa ripetuta
  a mano in ogni `ChatBubble`, ogni `MobileChatOverlay` e ogni saluto iniziale

`dati` resta `kind: "tool"`: la chat di Nico vive dentro lo strumento, non e' un
agente autonomo, quindi in sidebar sta in Strumenti come "Dati". Tiene comunque
`agentName: "Nico"` per la chat e l'avatar — per questo `AGENTS` filtra anche su
`kind === "agent"`, altrimenti Nico ricomparirebbe nella griglia.

Effetto collaterale voluto: blobatar e' seedato sul nome, quindi ogni agente ha
ora la sua faccia stabile legata a Livia/Bruno/Elsa/Vera (e a Nico nella chat Dati).

## Il cruscotto

`src/components/dashboard/`

| File | Ruolo |
|---|---|
| `DashboardMosaic.tsx` | griglia 12 colonne, i `Suspense` |
| `StatTile.tsx` | tile client con tilt 3D (port di `GradientTile` di global-games) |
| `tiles.tsx` | i 4 fetch, async server components |
| `RangePicker.tsx` | selettore di periodo (popover) + `useStoredRange` |
| `DashboardShell.tsx` | header + periodo globale (context) |
| `BucketTile.tsx` | tile Ordini e Fatturato: stessa lettura, due metriche |
| `VisitsTileClient.tsx` | tile Visite: periodi PostHog on demand |
| `TrafficSection.tsx` | visite + ordini nello stesso `TrafficChart` |

Le 4 tile:

| Tile | Periodo | Fonte | Fallback |
|---|---|---|---|
| Ordini | globale (Da sempre di base) | `ordersAll()` aggregato per periodo | `—` |
| Fatturato | globale (stesso controllo) | stessa lettura, aggregata per periodo | `—` |
| Portali attivi | — (conteggio di adesso) | `listPortals()` → `status` | `—` |
| Visite | globale; "Da sempre" = 90gg PostHog | `getAnalyticsOverview(range)` → `totals.visitors` | `—` |

Nessun endpoint nuovo, ne' lato studio ne' lato studio-server.

### Periodo scegliibile su tre tile (2026-08-27)

Un **solo** popover in alto a destra (`PageHeader.actions`), default
**Da sempre**. Controlla Ordini, Fatturato e Visite. Fuori dal giro resta
**Portali attivi**: e' un conteggio di adesso, un periodo non vuol dire niente.

Opzioni: Da sempre / 30 giorni / 7 giorni / Oggi. Scelta unica in
`localStorage` (`studio.dashboard.range`).

- **Ordini** e **Fatturato** (`BucketTile`): i totali di tutti i periodi
  arrivano gia' calcolati, lo switch e' istantaneo.
- **Visite** (`VisitsTileClient`): PostHog non ha un "sempre", il tetto e' 90
  giorni — "Da sempre" chiede quella finestra. Ogni altro periodo e' una query
  on demand (`visitsTotalsAction`) con cache client. Il grafico sotto resta
  sui 30 giorni (`overview30d`), non segue il controllo.

Gotcha collegato: i bottoni *dentro* le tile si attivano su `pointerdown`, non su
`click` — vedi `gotchas/gotcha-click-perso-su-card-con-tilt.md`. Il selettore
periodo sta nell'header, fuori dal tilt: click normale.

Su ordini e fatturato lo switch non fa rete: i totali di tutti i periodi arrivano **gia' calcolati dal server**
in un'unica prop, quindi cambiare periodo e' istantaneo e non ricarica nulla.

- `ordersAll()` legge tutto lo storico (`from: 2020-01-01`) invece dei soli 30
  giorni: la voce "Da sempre" lo richiede comunque, e ordini-30gg + grafico si
  ricavano filtrando in memoria. Resta **una sola** chiamata Saleor per tutta la pagina.
- `aggregate(orders, days)` somma `totalGross` esattamente come fa il gateway
  (`studio-server/src/features/orders/route.ts`, reduce su `totalGross`): i
  numeri combaciano con la lista ordini. `days = null` significa tutto lo storico,
  `0` significa oggi.
- La chiave `localStorage` si legge in `useEffect`, non nell'initializer di
  `useState`: il server non vede la localStorage e leggerla prima romperebbe
  l'hydration. Costo: un frame su "Da sempre" prima di passare al periodo salvato.
- Debito segnato in codice (`ponytail:` in `tiles.tsx`): il gateway pagina a 100
  ordini per volta, quindi lo storico che cresce allunga il primo render. Quando
  dara' fastidio, serve un endpoint di aggregati per periodo su studio-server
  invece di scaricare tutte le righe.

### Due scelte che contano

**Skeleton senza stato client.** Ogni tile e' un async server component dentro
un `<Suspense>`: Next streamma e le tile si riempiono una alla volta. Zero hook,
zero `isLoading` da gestire.

**Un grafico solo: visite e ordini insieme.** Il confronto utile e' "il traffico
si trasforma in ordini?", quindi le due cose stanno nello stesso chart. Gli
ordini hanno un asse Y loro a destra (tratteggio ambra): 3 ordini e 300 visite
sullo stesso asse terrebbero la linea ordini incollata al pavimento. Il
fatturato non e' una terza linea — gli euro non condividono scala con nessuno
dei due — sta nel tooltip accanto al numero ordini.

`TrafficChart` e' lo stesso componente di `/analytics`: ha una prop `orders`
opzionale che passa solo il cruscotto. Se manca, il grafico e' identico a prima
(un asse, due aree, titolo "Visitatori per giorno"). Il raggruppamento per
giorno lo fa `TrafficSection` dalle righe che `listOrders` restituisce gia'.

**Ordini chiamati una volta sola.** Servono tre volte (2 tile + grafico):
`ordersAll` e' avvolto in `cache()` come l'overview.

**Ogni fetch in try/catch.** Se Saleor o PostHog non rispondono la tile mostra
`—` e il resto del cruscotto resta in piedi. Verificato in locale: senza
`SALEOR_APP_TOKEN` le tile ordini/fatturato/portali fanno `—`, Visite continua a
dare il numero.

## Pagina agenti

`src/components/agents/AgentsGrid.tsx` deriva da `AGENTS` e monta una `AgentCard`
(studio-core, mai usata prima in Kyron) per agente, con `ChatAvatar` da 88px
nello slot avatar. Due varianti: `fill` per la striscia nel cruscotto, auto-fill
per la pagina.

`/agenti` **e'** la voce "Agenti" di `MODULES` (rev 2026-08-25): gli agenti non
sono piu' righe di primo livello ma canali `#` sotto quella voce, quindi il
doppione non c'e' piu'. La voce e' `exact: true` cosi' resta attiva solo su
`/agenti` e non su ogni canale figlio.

## Prompt server-side

`studio-server`, 5 file, solo la riga di auto-presentazione: `onboard-school`
(Livia), `price-guard/agent.ts` (Bruno), `vat-relief` (Elsa), `review-editor`
(Vera), `data-editor` (Nico). **Serve un redeploy di studio-server** perche' si
veda in prod.

## Cosa non c'e'

- `SystemStatus` di global-games: Kyron non ha un endpoint health
- donut magazzino e qualita' catalogo: non hanno senso qui
- font a puntini per i numeri: Kyron non lo carica
- avatar caricabili dall'utente (editor + IndexedDB, ~1500 righe in
  global-games): si aggiunge se servono foto vere

## Gotcha

- La striscia agenti e' a larghezza piena, non 8/4 come in global-games: 5 card
  agente in un terzo di colonna non ci stanno.
- **La cella della striscia agenti vuole `min-w-0`** (fix 2026-08-27). La marquee
  ha contenuto `w-max` largo ~2300px; senza `min-w-0` il grid prende quella
  misura come larghezza minima della colonna e da mobile TUTTA la dashboard
  sfora in larghezza (le tile diventano larghe 2200px e vengono tagliate). Non si
  vede da desktop perche' la colonna e' 1/12. Misurato a 402px: colonna 2320px
  prima, 354px dopo.
- **In locale la dashboard non si idrata** se studio-server non raggiunge Saleor e
  Payload: i `Suspense` restano nel fallback e i componenti client non ricevono
  gli handler (i bottoni non rispondono). Condizione preesistente, non un bug
  della tile: si riproduce identica su `main`. Per provare interazioni sul
  cruscotto serve un gateway con le fonti vive.
- Screenshot da browser headless/in background: le tile e le aree dei grafici
  risultano invisibili. Non e' un bug — con `document.hidden` l'animazione di
  mount (framer-motion e recharts) non parte e resta a opacita' zero. Nel DOM la
  geometria c'e'.
- `npm run lint` era gia' rotto prima di questa feature (`next lint` non esiste
  piu' in Next 16, lo script in `package.json` e' vecchio). Non toccato.
