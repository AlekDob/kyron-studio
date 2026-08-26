"use client";

// Caricamento del file prodotti Danea (EcommProdotti.xml).
// L'XML non viene archiviato: studio-server lo parsa e tiene in memoria solo i
// record per un'ora, il tempo di guardare il piano e confermare.
import { useRef, useState, type ReactElement } from "react";
import { Upload, FileCode, Check } from "lucide-react";

interface UploadedImport {
  id: string;
  filename: string;
  recordCount: number;
  groupCount: number;
}

interface Props {
  readOnly?: boolean;
  disabled?: boolean;
  initialImport?: UploadedImport | null;
  onSubmit?: (data: UploadedImport) => void;
}

export function DaneaUploader({
  readOnly,
  disabled,
  initialImport,
  onSubmit,
}: Props): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<UploadedImport | null>(initialImport ?? null);
  const [uploading, setUploading] = useState(false);
  const [sent, setSent] = useState(Boolean(initialImport && readOnly));
  const [error, setError] = useState<string | null>(null);

  const locked = sent || readOnly || disabled;

  async function handleFile(files: FileList | null): Promise<void> {
    const picked = files?.[0];
    if (!picked || locked) return;
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", picked);
      const res = await fetch("/api/products/import", { method: "POST", body: form });
      const json = (await res.json()) as Partial<UploadedImport> & { error?: string };
      if (!res.ok || !json.id) throw new Error(json.error ?? `Errore ${res.status}`);
      setFile(json as UploadedImport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Caricamento fallito");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function submit(): void {
    if (!file || locked) return;
    setSent(true);
    onSubmit?.(file);
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <p className="mb-3 text-sm font-medium text-[var(--color-ink)]">
        File prodotti da Danea
      </p>

      {!locked && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-paper-muted)] px-4 py-6 text-sm text-[var(--color-ink-muted)] hover:border-[var(--color-action)] disabled:opacity-50"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          {uploading ? "Lettura del file..." : "Scegli l'export XML (EcommProdotti.xml)"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files)}
      />

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] px-3 py-2">
          <FileCode className="h-4 w-4 shrink-0 text-[var(--color-ink-muted)]" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-ink)]">
            {file.filename}
          </span>
          <span className="shrink-0 text-xs text-[var(--color-ink-muted)]">
            {file.recordCount} righe, {file.groupCount} gruppi
          </span>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-[var(--color-critical)]">{error}</p>}

      {!locked ? (
        <button
          type="button"
          onClick={submit}
          disabled={!file || uploading}
          className="mt-3 w-full rounded-[var(--radius-pill)] bg-[var(--color-action)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-30"
        >
          Calcola il piano
        </button>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          File inviato: sto confrontando col catalogo
        </p>
      )}

      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        Il file non viene archiviato: resta in memoria un'ora, il tempo dell'import.
      </p>
    </div>
  );
}
