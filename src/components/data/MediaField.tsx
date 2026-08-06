"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";

interface Props {
  name: string;
  label: string;
  accept: string;
  hint?: string;
  initialId?: string;
  initialName?: string;
  initialUrl?: string;
}

// Campo upload per un media Payload: il file parte subito verso /api/media e
// nel form resta solo l'id del media (hidden input). Cosi' il submit e' un
// semplice JSON, senza multipart nella server action.
export function MediaField({
  name,
  label,
  accept,
  hint,
  initialId,
  initialName,
  initialUrl,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaId, setMediaId] = useState(initialId ?? "");
  const [filename, setFilename] = useState(initialName ?? "");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: form });
      const body = (await res.json()) as {
        id?: string;
        filename?: string;
        url?: string;
        error?: string;
      };
      if (!res.ok || !body.id) {
        setError(body.error ?? "Caricamento fallito");
        return;
      }
      setMediaId(body.id);
      setFilename(body.filename ?? file.name);
      setUrl(body.url ?? "");
    } catch {
      setError("Errore di rete");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
      <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {label}
      </span>
      <input type="hidden" name={name} value={mediaId} />

      {filename ? (
        <p className="mb-3 text-sm">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="underline">
              {filename}
            </a>
          ) : (
            filename
          )}
        </p>
      ) : (
        <p className="mb-3 text-sm text-[var(--color-ink-muted)]">
          Nessun file caricato
        </p>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm hover:bg-[var(--color-paper-muted)] disabled:opacity-50"
      >
        <Upload aria-hidden="true" className="size-4" />
        {busy ? "Caricamento..." : filename ? "Sostituisci file" : "Carica file"}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={(e) => void handleChange(e)}
        className="hidden"
        aria-label={label}
      />

      {hint ? (
        <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
          <X aria-hidden="true" className="size-3" /> {error}
        </p>
      ) : null}
    </div>
  );
}
