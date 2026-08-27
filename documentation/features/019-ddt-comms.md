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
4. `send_ddt_mailing` — vuole `confirm: true`. Manda al massimo 50 destinatari per
   chiamata e torna `remaining`: il cursore E' l'idempotenza, niente job in background.

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
