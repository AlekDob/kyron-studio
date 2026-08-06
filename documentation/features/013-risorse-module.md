---
type: feature
project: kyron-studio
created: 2026-08-06
last_verified: 2026-08-06
tags: [risorse, dati, payload, upload, media, cataloghi]
---

# 013 — Risorse (dentro Dati)

## Cosa

Schermata dedicata `/dati/risorse` dentro il modulo Dati: lista, crea, modifica,
pubblica/metti in bozza ed elimina le risorse di `kyronedu.it/risorse`
(cataloghi, brochure, matrici, progetti bandi, materiali didattici). PDF e
copertina si caricano dal browser.

## Perche'

Andrea gestisce i contenuti da `studio.kyronedu.it` e basta: `kyronedu.it/admin`
(Payload) non e' un posto dove mandarlo. Il renderer generico di Dati non
bastava: `lib/data-fields.ts` deduce il tipo dal valore, quindi i select
diventavano testo libero, gli array JSON e i due upload restavano in sola
lettura. In piu' non esisteva nessuna pagina "crea record" nel frontend.

## Come

Segmento **statico** `dati/risorse/...`: in App Router batte il dinamico
`dati/[slug]/...`, quindi il modulo generico resta intatto e la card "Risorse"
in `/dati` (link `/dati/{slug}`) atterra da sola sulla schermata dedicata.

| File | Ruolo |
|---|---|
| `app/(authed)/dati/risorse/page.tsx` | lista con stato Bozza/Pubblicata + "Nuova risorsa" |
| `app/(authed)/dati/risorse/new/page.tsx` | form vuoto (`EMPTY_RISORSA`) |
| `app/(authed)/dati/risorse/[id]/page.tsx` | form popolato (`getRecord`, locale `all`) + elimina |
| `app/(authed)/dati/risorse/actions.ts` | `saveRisorsa` (create/update) + `destroyRisorsa`; patch costruito a mano |
| `components/data/RisorsaForm.tsx` | il form (select veri, checkbox multiple, disclosure campi opzionali) |
| `components/data/MediaField.tsx` | upload: il file parte subito, nel form resta solo l'id media |
| `components/data/DeleteRisorsaButton.tsx` | elimina con conferma |
| `lib/risorse.ts` | opzioni/label IT, `toRisorsaValues`, `slugify` |
| `app/api/media/route.ts` | proxy same-origin verso `POST /api/v1/media` |

Lato studio-server (stessa sessione):

- `core/payload/media.ts` — `uploadMedia()` estratta da `features/portals/logo.ts`
  (multipart Payload: blob in `file`, campi extra in `_payload` JSON, **niente**
  Content-Type a mano). `savePortalLogo` ora la chiama.
- `features/media/route.ts` — `POST /api/v1/media`, stessi middleware del
  gateway, whitelist mime (pdf, zip, png, jpeg, webp), limite 25 MB.
- `features/collections/registry.ts` — entry `risorse` (`purpose: manage`).
- `core/payload/gateway.ts` — `SEARCH_FIELDS.risorse` + fix `create()`: i campi
  localizzati `{it,en}` venivano serializzati dentro la locale di default (stesso
  bug gia' noto su `update`). Ora crea con la sola `it` e completa con `update`,
  che sa spezzare per locale. Vale anche per il tool `create_record` dell'agente.

## Regole del form

- **Slug** proposto dal titolo IT, modificabile: appena lo tocchi smette di seguirlo.
- **Pubblicata** → `_status: published | draft`. Togliere la spunta e' il modo di
  mettere offline una risorsa senza cancellarla.
- **Tipo risorsa** decide il campo: `pdf`/`zip` → upload file, `sfogliabile`/`link` → URL.
- **Copertina obbligatoria** (lo e' in Payload): il save la pretende con errore leggibile.
- Dopo il save l'hook Payload `revalidateRisorse` aggiorna `/risorse` da solo.

## Fuori scope

Upload generico per tutte le collection di Dati, drag & drop dell'ordine (c'e' il
campo numerico `ordine`), anteprima PDF dentro Studio, chat agente su questa
schermata.

## Riferimenti

- `cms/documentation/features/041-pagina-risorse.md` — la pagina pubblica
- `cms/payload/collections/Risorse.ts` — schema dei campi
