---
type: feature
project: studio
created: 2026-08-27
last_verified: 2026-08-27
tags: [agent, ordini, danea, ddt, email, resend, money-path, generative-ui]
---

# Feature 019 — Comunicazioni ai clienti dai DDT Danea

## Perche'

Danea Web e' chiuso: nessuna API, nessun webhook. Quando serve avvisare i
clienti di qualcosa (nel primo caso reale: ritardi di consegna) l'unica cosa che
l'operatore puo' fare e' esportare i documenti da Danea. 378 DDT in un XML da
2 MB, con dentro nome, email, scuola, studente e righe della consegna.

Da qui: l'operatore carica il file in chat con Nico, gli dice **cosa** comunicare,
Nico scrive oggetto e testo, mostra il piano, e dopo l'ok manda le mail.

## Il file

`EasyfattDocuments` di Danea Easyfatt Enterprise. Sul campione di agosto 2026:

- 378 `<Document>`, tutti `DocumentType = D`
- `CustomerEmail` su 378/378 (375 uniche: 3 famiglie con due figli)
- `TrackingNumber` **vuoto su tutti**: sono consegne a scuola, non spedizioni.
  Il testo non deve mai nominare corriere o tracking.
- `CustomField1` = slug portale, `CustomField2` = PaymentIntent Stripe (227/378),
  `CustomField3` = tipo consegna, `CustomField4` = codice meccanografico
- `FootNotes` = "Studente: X — Classe: Y"

## Il bug che stava sotto (fix Fase 0)

`getTag()` in `commesso/danea-parse.ts` costruiva `<${tag}[^>]*>`: prefisso non
ancorato. Sul listino prodotti non si vedeva; nei DDT `<TotalWithoutTax>` viene
**prima** di `<Total>`, quindi `<Total>` agganciava il tag sbagliato e la cattura
arrivava fino al vero `</Total>` restituendo spazzatura. Ora e'
`<${tag}(?:\s[^>]*)?>`. Il caso e' bloccato da un test in
`tests/features/commesso-danea.test.ts`.

## Come funziona

1. `render_danea_uploader` — stesso riquadro del listino. Il tipo di file lo
   riconosce il server dal root XML (`StoredImport` e' una union
   `kind: "products" | "ddt"`), non lo si chiede all'operatore.
2. `parse_ddt_summary` — quanti DDT, per portale, per pagamento, quanti senza email.
3. `plan_ddt_mailing` — non manda niente. Torna la card `DdtMailPlan` con oggetto,
   testo, conteggi e 3 anteprime reali (in `<iframe sandbox>`: l'HTML della mail
   non entra nel DOM di Studio). Il testo si corregge riscrivendo il brief in chat.
4. `send_ddt_test_mail` — una mail sola, per default all'operatore loggato.
5. `send_ddt_mailing` — vuole `confirm: true`. Manda al massimo 50 destinatari per
   chiamata e torna `remaining`: il cursore E' l'idempotenza, niente job in background.

## La card di anteprima

Il problema vero non era la card: era che Nico non la chiamava mai. Scriveva la
bozza a mano nel messaggio ("Oggetto: ... Titolo: ... Paragrafi: 1. 2. 3.") e
chiedeva il permesso di preparare un piano che non scrive niente. Ora il prompt lo
vieta: appena il brief e' chiaro, `plan_ddt_mailing` e basta. La conferma serve
solo per l'invio vero.

Dentro `DdtMailPlan`:

- **Anteprime** — 3 schede, la mail renderizzata davvero in `<iframe sandbox>`.
- **Box destinatari** — lista scrollabile di *tutti* i pendenti: nome, email,
  "Ordine N" o "nessun ordine" (i DDT senza `pi_` Stripe, la mail parte lo stesso),
  portale. Intestazione col conteggio e quanti sono agganciati a un ordine.
- **Invia una prova** — campo email precompilato con l'indirizzo dell'operatore
  loggato (`testTo` viaggia nei props `_ui`, non dentro il piano: il modello non
  lo vede). Manda la scheda di anteprima selezionata. Esito inline.

## La mail di prova

`sendDdtTestMail` in `ddt-mailing.ts`, esposta da `POST /api/v1/orders/ddt-test-mail`
(**`requireAdmin`**: le altre rotte di quel file leggono, questa manda mail).

- Salta di proposito `DDT_MAIL_ENABLED` e l'allowlist: la prova serve proprio quando
  l'invio di massa e' ancora spento.
- **Non tocca `email_log`** e non scrive sull'ordine: non consuma il claim.
- Il client manda solo il testo, mai HTML: il server ri-renderizza con
  `planDdtMailing`. `to` e' un solo indirizzo, validato con regex — e' l'unico
  confine rimasto, quindi ha il suo test.
- Oggetto prefissato `[PROVA] `, log server-side di chi ha mandato a chi.

## Le guardie

**Idempotenza durevole senza database.** studio-server non ha un DB e il suo
filesystem si azzera a ogni redeploy: inaccettabile su un invio di massa. Il
registro sta su Payload, collection `email-log`, campo `key` **`unique: true`**
(`${campaignId}:${docKey}`). Il `create` E' il lock: claim-before-send. Se Payload
risponde duplicate, quella mail e' gia' partita e si salta; se il claim riesce, si
invia. Se Payload e' giu' il lotto **si ferma**: fallire chiuso, mai inviare senza
claim.

`docKey` = `${Numbering}-${Number}-${Date}` (es. `/EC-1-2026-08-05`): identita'
stabile del documento, 378/378 unica sul file reale.

`campaignId` e' uno slug per comunicazione (`ritardi-agosto-2026`): riusarlo non
rimanda le mail gia' partite, cambiarlo permette una seconda comunicazione sullo
stesso file.

**Allowlist.** `DDT_MAIL_ENABLED=true` arma l'invio, `DDT_MAIL_ALLOW` (CSV) lo
limita a quegli indirizzi. Stessa semantica di `ORDERS_SHIP_NOTIFY_ALLOW`: piena =
solo quelli, vuota = tutti. Primo giro reale con la variabile valorizzata.

**Un destinatario per chiamata**, mai `/emails/batch`: nessuno vede gli altri e il
logo `cid:` continua a funzionare (batch non supporta gli allegati). Throttle 500 ms
tra invii, un solo retry sul 429.

## Aggancio all'ordine

`orders/ddt-match.ts` fa una sola passata Saleor (`fetchOrdersForRange` da -7g a
+1g rispetto ai DDT) e aggancia a cascata: PaymentIntent, poi email + portale ma
solo con **un** candidato. Due candidati = due figli della stessa famiglia nella
stessa scuola: `ambiguous`, mai un aggancio a caso.

L'aggancio serve **solo** a mostrare il log sulla scheda ordine: la mail parte
comunque, perche' il DDT ha gia' tutto. I 151 senza `pi_` non sono un problema.

Nel drawer ordine, sezione "Comunicazioni inviate" (`OrderComms.tsx`): elenco
cliccabile che apre oggetto, testo e data, letto da `GET /api/v1/orders/comms`.

## Bug indipendente riparato qui

`sendShipNotification` rimandava la mail "spedito" a **ogni** PATCH sullo stato.
La guardia e' ora dentro `setWorkflowStatus` (metadata `kyron_ship_notified_at`),
non nel tool: ne beneficia anche la UI ordini esistente. Il marcatore si scrive
SOLO dopo un invio riuscito — scriverlo anche sul ramo "bloccato dall'allowlist"
avrebbe silenziato per sempre quel cliente il giorno del go-live.

## Prerequisito di produzione

`email-log` e' una collection nuova = **tabella nuova**. In produzione il push dello
schema Payload non esiste (il ramo e' eliminato dal DefinePlugin di Next: nessun
`PAYLOAD_PUSH` a runtime lo riattiva) e `payload migrate` e' KO su questo stack.
La tabella arriva quindi da una migration SQL idempotente:
`cms/db/migrations/0003-email-log.sql`, applicata in automatico a ogni boot da
`cms/scripts/apply-schema.sh` e tracciata in `_kyron_migrations`.

Ordine di deploy: **prima il CMS** (che crea la tabella al boot), poi studio-server,
poi studio — mai due deploy insieme, il CCX23 va in OOM. Senza la tabella,
`claimSend` fallisce e il lotto si ferma: nessuna mail parte senza claim.

## 2026-08-31 — il registro copre TUTTE le mail dell'ordine

`email-log` nasce come lock anti-doppio-invio delle campagne DDT, ma la scheda
ordine lo mostra come registro comunicazioni: su un ordine normale restava vuoto.
Ora ogni mail legata a un ordine scrive la sua riga.

| Mail | Da dove parte | `campaign` |
|---|---|---|
| Conferma ordine al cliente | storefront `api/orders/confirmation-email` | `conferma-ordine` |
| Riepilogo interno al team | storefront `api/orders/confirmation-email` | `riepilogo-interno` |
| Buono Carta del Docente (interna) | storefront `api/checkout/teacher-card-buono` | `buono-carta-docente` |
| Documenti IVA 4% (interna) | storefront `api/checkout/vat-relief-docs` | `documenti-iva-4` |
| Ordine spedito | studio-server `orders/status.ts` | `ordine-spedito` |
| Bonifico ricevuto (anche residuo) | studio-server `orders/bank-transfer.ts` | `bonifico-ricevuto` |
| Buono acquisito | studio-server `orders/teacher-card.ts` | `carta-docente-acquisita` |
| Nuovo importo IVA 4% | studio-server `orders/vat-relief-notify.ts` | `iva-4-importo-aggiornato` |
| Campagne DDT | studio-server `orders/ddt-mailing.ts` | slug campagna |

- studio-server: `sendAndLog()` in `email-log.ts` (manda + registra). `docKey` col
  timestamp, niente lock: l'anti-doppio-invio di queste mail sta gia' sui metadata
  dell'ordine Saleor.
- storefront: `src/lib/email/log.ts` scrive su Payload con `PAYLOAD_API_KEY` (che
  ha gia' per i portali runtime). Nessun giro via studio-server.
- Il log e' sempre **best-effort**: Payload giu' non deve far fallire una mail
  riuscita (al contrario di `claimSend`, che invece fallisce chiuso).
- Il `body` si salva come testo (`htmlToText`): l'HTML della mail nel drawer e'
  illeggibile.
- UI: la sezione ha un tab suo, **Comunicazioni** (prima stava in coda a Note).
- Non retroattivo: gli ordini precedenti al deploy restano senza righe.

## 2026-08-31 (2) — storico da Resend

Il registro nostro parte da oggi; lo storico degli ordini gia' fatti sta su Resend,
che e' anche l'unico a sapere se una mail e' stata **consegnata**.

- `studio-server/src/features/orders/resend-log.ts` — `GET https://api.resend.com/emails`
  (100/pagina, cursore `after=<id>`, ~30 giorni di retention = 5 pagine per l'account
  Kyron). Si scarica tutto e si tiene in cache **in memoria 5 minuti**: l'API non
  filtra per destinatario (`?to=` viene ignorato), quindi il filtro e' nostro.
- `matchesOrder()` — `#504` nell'oggetto con confine a destra (`#504` != `#5041`),
  oppure destinatario uguale all'email del cliente (prende le mail senza numero).
- `GET /api/v1/orders/comms?number=&email=` unisce Resend + `email-log` con
  `Promise.allSettled` (una fonte giu' non azzera l'altra) e deduplica per oggetto.
- `GET /api/v1/orders/comms/:id` — testo della mail, caricato solo quando
  l'operatore apre la riga. Si mostra `text`, non l'HTML: niente
  `dangerouslySetInnerHTML` su contenuto che arriva da un'API.
- UI: badge di consegna per riga (Consegnata / Aperta / Non consegnata / In ritardo /
  Segnalata spam) da `last_event`. Riga senza badge = fuori dalla finestra Resend.

### Cliente vs interna

`audienceOf(to, customerEmail)` in `resend-log.ts`: destinatario che contiene l'email
dell'ordine = `cliente`, altrimenti `interna`. Senza email d'ordine il fallback e' il
dominio (`@kyronedu.it` su TUTTI i destinatari = interna; basta un indirizzo esterno,
es. l'agente in copia, per considerarla in uscita). In UI: icona persona accent vs
icona edificio grigia, oggetto attenuato per le interne.

## Aggiornamento 2026-08-31 — il motore d'invio e' condiviso

Con il modulo Clienti (feature 021) l'invio e' stato sfilato dal file DDT: piano,
lotti da 50, claim-before-send su Payload, allowlist e kill switch vivono ora in
`core/email/campaign.ts` + `core/email/campaign-template.ts`. `ddt-mailing.ts` e
`ddt-mail-template.ts` restano, ma solo per costruire i destinatari e il riquadro
dal DDT. I nomi dei tool di Nico e la sua card non cambiano.

Bea (Clienti) usa lo stesso motore con i propri tool `*_customer_*` e le **stesse**
env `DDT_MAIL_ENABLED` / `DDT_MAIL_ALLOW`: un solo interruttore per fermare tutte
le mail di massa.
