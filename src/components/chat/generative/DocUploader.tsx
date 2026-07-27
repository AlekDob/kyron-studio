"use client";

// Upload documenti 104 per la validazione IVA agevolata.
// I file NON vengono archiviati: studio-server li tiene in memoria 30 minuti
// (dati sanitari, GDPR art. 9). Alla submit manda all'agente solo gli id.
import { useRef, useState, type ReactElement } from "react";
import { Upload, FileText, X, Check } from "lucide-react";

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

interface Props {
  orderNumber?: string | null;
  readOnly?: boolean;
  disabled?: boolean;
  initialDocs?: UploadedDoc[];
  onSubmit?: (data: { uploadIds: string[]; names: string[]; orderNumber: string | null }) => void;
}

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocUploader({
  orderNumber,
  readOnly,
  disabled,
  initialDocs,
  onSubmit,
}: Props): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>(initialDocs ?? []);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(Boolean(initialDocs?.length && readOnly));
  const [error, setError] = useState<string | null>(null);

  const locked = sent || readOnly || disabled;

  async function handleFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0 || locked) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      for (const f of Array.from(files)) form.append("files", f);
      const res = await fetch("/api/vat-relief/upload", { method: "POST", body: form });
      const json = (await res.json()) as { uploads?: UploadedDoc[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Errore ${res.status}`);
      setDocs((prev) => [...prev, ...(json.uploads ?? [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento fallito");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function remove(id: string): void {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  function submit(): void {
    if (docs.length === 0 || locked) return;
    setSent(true);
    onSubmit?.({
      uploadIds: docs.map((d) => d.id),
      names: docs.map((d) => d.name),
      orderNumber: orderNumber ?? null,
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--color-ink)]">
          Documenti da controllare
        </p>
        {orderNumber && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-paper-muted)] px-2 py-0.5 text-xs text-[var(--color-ink-muted)]">
            Ordine #{orderNumber}
          </span>
        )}
      </div>

      {!locked && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-muted)] px-4 py-6 text-sm text-[var(--color-ink-muted)] hover:border-[var(--color-action)] disabled:opacity-50"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          {uploading ? "Caricamento..." : "Trascina o scegli i file (PDF, JPG, PNG)"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {docs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">
                {d.name}
              </span>
              <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                {formatSize(d.size)}
              </span>
              {!locked && (
                <button
                  type="button"
                  onClick={() => remove(d.id)}
                  aria-label={`Rimuovi ${d.name}`}
                  className="shrink-0 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-[var(--color-critical)]">{error}</p>}

      {!locked ? (
        <button
          type="button"
          onClick={submit}
          disabled={docs.length === 0 || uploading}
          className="mt-3 w-full rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-30"
        >
          Controlla {docs.length > 0 ? `(${docs.length})` : ""}
        </button>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {docs.length} document{docs.length === 1 ? "o" : "i"} inviat{docs.length === 1 ? "o" : "i"} al controllo
        </p>
      )}

      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        I file non vengono archiviati: restano in memoria 30 minuti, il tempo del controllo.
      </p>
    </div>
  );
}
