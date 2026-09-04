---
type: feature
project: studio
created: 2026-09-03
last_verified: 2026-09-03
tags: [ricerca, chip, filtri, frase-filtro, popover, agente, dry]
---

# Feature 023 — Ricerca come chip nella frase-filtro

## Perche'

Kevin: "manca il campo ricerca. In prodotti, clienti, portali, ordini ecc."
Il campo c'era, poi e' stato togliuto e sostituito dal link "oppure chiedi una
ricerca a <agente>". Cercare tramite agente costa ~5 secondi a ricerca, e in
una giornata di ricerche sono tanti.

Ora la ricerca e' un chip della frase, come gli altri filtri. L'agente resta
utile per le domande vere ("sopra 600 euro non confermati"), non per trovare un
nome.

## Cosa fa

| Stato | Cosa si vede |
|---|---|
| Nessuna query | Chip indaco con lente: "Oppure fai una ricerca" |
| Click | Popover con il campo, a fuoco (transizione `studio-row-in`) |
| Mentre scrivi | Dopo 300ms di pausa la lista si aggiorna, skeleton dal `pending` |
| Query attiva | La frase dice "che contengono", il chip mostra `“imac”`, il × accanto azzera |

Il chip e' **uno solo** per la ricerca a mano e per quella dell'agente: entrambe
scrivono `filter.query`, che vive nell'URL (`?q=`).

## Da telefono niente popover

Sotto i 1024px il campo **prende il posto del chip nella riga**, non si apre un
pannello. Il popover si chiude su `resize`, e aprire la tastiera del telefono e'
un `resize`: il campo spariva appena lo toccavi. In riga la lista resta anche
visibile mentre scrivi, cosa che una sheet dal basso coprirebbe.

Chiude col tasto invio, con Esc o toccando fuori. Alla chiusura quello che hai
scritto viene rimandato subito: se il campo sparisce prima dei 300ms il timeout
del debounce verrebbe annullato e la ricerca si perderebbe.

## Dove

| Sezione | File della frase | Placeholder |
|---|---|---|
| Ordini | `components/orders/OrdersSentence.tsx` | n° ordine, cliente o Stripe |
| Clienti | `components/customers/CustomersSentence.tsx` | nome, email o telefono |
| Prodotti | `components/products/ProductsSentence.tsx` | nome, SKU o categoria |
| Portali | `components/portals/PortalsSentence.tsx` | nome, citta' o codice |
| Richieste | `components/requests/RequestsSentence.tsx` | titolo o testo |

Componente unico: `components/orders/search-chip.tsx` (`SearchChip`), con `Chip`
+ `Popover` gia' esistenti. `Chip` ha una prop `icon` per la lente.

## Scelte

| Scelta | Perche' |
|---|---|
| Debounce 300ms | Come il vecchio campo di Ordini: una richiesta per pausa, non per tasto |
| Il × sta **fuori** dal chip | Dentro sarebbe un bottone in un bottone (il trigger del popover): gli screen reader lo leggono male |
| Niente plumbing nuovo | `query` / `?q=` erano rimasti cablati: server per Ordini e Clienti, fuzzy in memoria per Prodotti, Portali e Richieste |
| Link all'agente rimosso | Deciso con Alek: due modi di cercare nella stessa riga confondono. Cancellato anche `lib/focus-agent-chat.ts` |

## Fuori scopo

- **Dati** (`/dati/[slug]`): ha gia' la sua ricerca `?q=` con form GET server-side.
- Fuzzy (sottosequenza, in pagina) e ricerca server (sottostringa) restano
  diverse: differenza nota, vedi commento in `products-filter.ts`.
