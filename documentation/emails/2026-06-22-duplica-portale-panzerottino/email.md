---
type: email
project: kyron-studio
created: 2026-06-22
canale: resend
mittente: Panzerottino <web@kyronedu.it>
oggetto: Ora i portali si clonano (e io ci metto la firma)
tags: [announcement, internal, panzerottino, portals, duplicate]
---

# Annuncio interno — Duplica portale (da Panzerottino)

Comunicazione **interna al team Kyron** che annuncia la nuova funzione _Duplica portale_ dello Studio. Tono ironico/autoironico tipico di [[panzerottino]].

| Campo | Valore |
|---|---|
| Da | `Panzerottino <web@kyronedu.it>` |
| Reply-to | `info@kyronedu.it` |
| A | `team@kyronedu.it` |
| Cc | `gmail@alekdob.com` |
| Oggetto | Ora i portali si clonano (e io ci metto la firma) |
| Preview | Niente piu' setup da zero: bundle, sconti e catalogo arrivano gia' pronti. |
| Canale | Resend (`api.resend.com/emails`) |
| Inviata | 2026-06-22, id Resend `8e6d1404-085a-4503-85d4-bd44bb060da5` |

## Allegati / immagini

- **logo Kyron** — inline `cid:kyron-logo` (gotcha logo: cid + `width` attributo *e* inline, vedi skill `kyron-email`)
- **screenshot bottone** — `duplica-portale.png`, inline `cid:duplica-portale` nel corpo + allegato scaricabile. Sorgente 3456x2592 ridimensionata a 1200px con `sips -Z 1200`.

## Messaggio

Da oggi, nel modulo Portali dello Studio, ogni card ha un bottone **Copy** (tooltip _Duplica portale_). Duplicando un portale esistente la nuova scuola eredita **bundle, sconti, catalogo e spedizione**; al team resta solo l'anagrafica base (nome, slug, indirizzo, codice meccanografico, logo). La copia nasce come **Bozza**; channel e voucher si rigenerano all'Abilita.

## Plain text

Il fallback plain text e' incluso in `send.mjs` (vedi `/tmp/kyron-mail/send.mjs` al momento dell'invio) e rispecchia il corpo HTML.

## Versione precedente

Una prima copia era partita per errore verso `tea@kyronedu.it` (refuso, indirizzo inesistente → bounce). Reinviata a `team@kyronedu.it` con `gmail@alekdob.com` in cc.
