"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { DataDisclosure } from "@/components/data/DataDisclosure";
import { DataSelect } from "@/components/data/DataSelect";
import { MediaField } from "@/components/data/MediaField";
import {
  AMBITI,
  CATEGORIE,
  DESTINATARI,
  TIPI_CON_FILE,
  TIPI_FILE,
  slugify,
  type Option,
  type RisorsaValues,
} from "@/lib/risorse";
import { saveRisorsa, type SaveState } from "@/app/(authed)/dati/risorse/actions";

const input =
  "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20";
const shell =
  "rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4";
const labelCls =
  "block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3";

export function RisorsaForm({ values }: { values: RisorsaValues }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveRisorsa,
    {},
  );
  const [tipoFile, setTipoFile] = useState(values.tipoFile);
  const [slug, setSlug] = useState(values.slug);
  const [titolo, setTitolo] = useState(values.titolo.it);
  const conFile = TIPI_CON_FILE.includes(tipoFile);

  // Lo slug segue il titolo finche' l'utente non lo tocca a mano.
  const [slugTouched, setSlugTouched] = useState(Boolean(values.slug));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="__id" value={values.id} />

      <div className={shell}>
        <span className={labelCls}>Titolo (IT + EN)</span>
        <div className="grid gap-3">
          <input
            name="titolo__it"
            value={titolo}
            onChange={(e) => {
              setTitolo(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Titolo italiano"
            className={input}
          />
          <input
            name="titolo__en"
            defaultValue={values.titolo.en}
            placeholder="English title"
            className={input}
          />
        </div>
      </div>

      <label className={`block ${shell}`}>
        <span className={labelCls}>Slug (indirizzo della risorsa)</span>
        <input
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          className={`${input} font-mono`}
        />
      </label>

      <div className={shell}>
        <span className={labelCls}>Descrizione breve (IT + EN)</span>
        <div className="grid gap-3">
          <textarea
            name="descrizioneBreve__it"
            defaultValue={values.descrizioneBreve.it}
            rows={3}
            className={input}
          />
          <textarea
            name="descrizioneBreve__en"
            defaultValue={values.descrizioneBreve.en}
            rows={3}
            className={input}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={`block ${shell}`}>
          <span className={labelCls}>Categoria</span>
          <DataSelect name="categoria" defaultValue={values.categoria}>
            {CATEGORIE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </DataSelect>
        </label>

        <label className={`block ${shell}`}>
          <span className={labelCls}>Tipo di risorsa</span>
          <DataSelect
            name="tipoFile"
            value={tipoFile}
            onChange={(e) => setTipoFile(e.target.value)}
          >
            {TIPI_FILE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </DataSelect>
        </label>
      </div>

      {conFile ? (
        <MediaField
          name="file"
          label="File della risorsa"
          accept="application/pdf,application/zip"
          hint="PDF o ZIP, massimo 25 MB."
          initialId={values.file?.id}
          initialName={values.file?.filename}
          initialUrl={values.file?.url}
        />
      ) : (
        <label className={`block ${shell}`}>
          <span className={labelCls}>Indirizzo del link</span>
          <input
            name="url"
            defaultValue={values.url}
            placeholder="https://..."
            className={input}
          />
        </label>
      )}

      <MediaField
        name="copertina"
        label="Copertina (obbligatoria)"
        accept="image/png,image/jpeg,image/webp"
        hint="Immagine di anteprima mostrata nella card."
        initialId={values.copertina?.id}
        initialName={values.copertina?.filename}
        initialUrl={values.copertina?.url}
      />

      <CheckboxGroup
        name="ambiti"
        label="Ambiti"
        options={AMBITI}
        selected={values.ambiti}
      />
      <CheckboxGroup
        name="destinatari"
        label="Destinatari"
        options={DESTINATARI}
        selected={values.destinatari}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={`block ${shell}`}>
          <span className={labelCls}>Data di aggiornamento</span>
          <input
            type="date"
            name="dataAggiornamento"
            defaultValue={values.dataAggiornamento}
            className={input}
          />
        </label>
        <label className={`block ${shell}`}>
          <span className={labelCls}>Ordine in evidenza</span>
          <input
            type="number"
            name="ordine"
            defaultValue={values.ordine}
            className={input}
          />
        </label>
      </div>

      <div className={`${shell} flex flex-col gap-3`}>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="pubblicata"
            defaultChecked={values.pubblicata}
          />
          Pubblicata sul sito
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="inEvidenza"
            defaultChecked={values.inEvidenza}
          />
          Mostra in evidenza
        </label>
      </div>

      <DataDisclosure summary="Campi opzionali (riga meta, descrizione estesa)">
        <div className="mt-3 grid gap-3">
          <input
            name="meta__it"
            defaultValue={values.meta.it}
            placeholder="PDF · 73 pagine · ed. 2026"
            className={input}
          />
          <input
            name="meta__en"
            defaultValue={values.meta.en}
            placeholder="PDF · 73 pages · 2026 ed."
            className={input}
          />
          <textarea
            name="descrizioneEstesa__it"
            defaultValue={values.descrizioneEstesa.it}
            rows={4}
            placeholder="Descrizione estesa (IT)"
            className={input}
          />
          <textarea
            name="descrizioneEstesa__en"
            defaultValue={values.descrizioneEstesa.en}
            rows={4}
            placeholder="Extended description (EN)"
            className={input}
          />
        </div>
      </DataDisclosure>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
        <Link
          href="/dati/risorse"
          className="text-sm text-[var(--color-ink-muted)] hover:underline"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[var(--color-ink)] px-5 py-2 text-sm font-medium text-[var(--color-paper)] hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Salvataggio..." : "Salva"}
        </button>
      </div>
    </form>
  );
}

function CheckboxGroup({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: Option[];
  selected: string[];
}) {
  return (
    <fieldset className={shell}>
      <legend className={labelCls}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={selected.includes(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
