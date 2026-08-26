---
type: feature
project: kyron-studio
created: 2026-08-25
last_verified: 2026-08-25
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
| `TrafficSection.tsx` | visite + ordini nello stesso `TrafficChart` |

Le 4 tile, ultimi 30 giorni:

| Tile | Fonte | Fallback |
|---|---|---|
| Ordini | `listOrders()` → `count` | `—` |
| Fatturato | stessa chiamata → `totalGross` | `—` |
| Portali attivi | `listPortals()` → `status` | `—` |
| Visite | `getAnalyticsOverview("30d")` → `totals.visitors` | `—` |

Nessun endpoint nuovo, ne' lato studio ne' lato studio-server.

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
`orders30d` e' avvolto in `cache()` come l'overview.

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
- Screenshot da browser headless/in background: le tile e le aree dei grafici
  risultano invisibili. Non e' un bug — con `document.hidden` l'animazione di
  mount (framer-motion e recharts) non parte e resta a opacita' zero. Nel DOM la
  geometria c'e'.
- `npm run lint` era gia' rotto prima di questa feature (`next lint` non esiste
  piu' in Next 16, lo script in `package.json` e' vecchio). Non toccato.
