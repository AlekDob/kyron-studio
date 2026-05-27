"use client";

import { useRef, useState, type ReactElement } from "react";
import { Upload, Check, X, Image } from "lucide-react";

interface LogoUploaderProps {
  slug: string;
  readOnly?: boolean;
  disabled?: boolean;
  initialUploaded?: boolean;
  onSubmit?: (data: { uploaded: boolean; filename: string }) => void;
}

const GATEWAY_URL =
  process.env.NEXT_PUBLIC_STUDIO_SERVER_URL ?? "http://localhost:8790";

export function LogoUploader({
  slug,
  readOnly,
  disabled,
  initialUploaded,
  onSubmit,
}: LogoUploaderProps): ReactElement {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(initialUploaded ?? false);
  const [error, setError] = useState<string | null>(null);

  const locked = uploaded || readOnly || disabled;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Solo PNG, JPG o WebP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Max 5 MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleUpload(): Promise<void> {
    const file = fileRef.current?.files?.[0];
    if (!file || locked) return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${GATEWAY_URL}/api/v1/portals/${slug}/logo`,
        { method: "POST", body: form },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload fallito" }));
        setError((body as { error?: string }).error ?? "Upload fallito");
        return;
      }

      const result = (await res.json()) as { filename: string };
      setUploaded(true);
      onSubmit?.({ uploaded: true, filename: result.filename });
    } catch {
      setError("Errore di rete");
    } finally {
      setUploading(false);
    }
  }

  function handleSkip(): void {
    if (locked) return;
    setUploaded(true);
    onSubmit?.({ uploaded: false, filename: "" });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-4">
      <p className="text-xs font-medium text-[var(--color-ink)] mb-3">
        Logo scuola
      </p>

      {uploaded ? (
        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-soft)]">
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span>{preview ? "Logo caricato" : "Nessun logo (TBD)"}</span>
        </div>
      ) : (
        <>
          {preview ? (
            <div className="mb-3 flex items-center gap-3">
              <img
                src={preview}
                alt="Anteprima logo"
                className="h-16 w-16 rounded-[var(--radius-control)] border border-[var(--color-line)] object-cover"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={uploading || locked}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--color-action)] px-3 py-1.5 text-xs font-medium text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-40"
                >
                  <Upload className="h-3 w-3" />
                  {uploading ? "Caricamento..." : "Carica"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  disabled={locked}
                  className="text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  Cambia file
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={locked}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border-2 border-dashed border-[var(--color-line)] py-6 text-xs text-[var(--color-ink-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink-soft)] disabled:opacity-40"
            >
              <Image className="h-4 w-4" />
              Seleziona un file PNG, JPG o WebP (max 5 MB)
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Carica logo"
          />

          {error && (
            <p className="mb-2 flex items-center gap-1 text-[10px] text-red-600">
              <X className="h-3 w-3" /> {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSkip}
            disabled={locked}
            className="text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline"
          >
            Salta, aggiungo il logo dopo
          </button>
        </>
      )}
    </div>
  );
}
