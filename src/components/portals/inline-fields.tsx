"use client";
import { useCallback, useEffect, useState } from "react";
import { Check, X } from "lucide-react";

// Campi editabili in riga, condivisi tra pannello portali e righe kit.
// Erano dentro PortalDetail: da quando il kit vive nella lista prodotti servono
// in due file.
const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function InlineText({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = useCallback(async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "errore");
    } finally {
      setBusy(false);
    }
  }, [draft, value, onSave]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left w-full truncate hover:underline underline-offset-2 decoration-[var(--color-line)]"
      >
        {value || (
          <span className="text-[var(--color-ink-muted)] italic">
            {placeholder ?? "—"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={draft}
        placeholder={placeholder}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="flex-1 min-w-0 text-sm bg-[var(--color-paper-soft)] border border-[var(--color-line)] rounded px-2 py-0.5 focus:outline-none focus:border-[var(--color-ink)]"
      />
      <button
        type="button"
        onClick={commit}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {err ? (
        <span className="text-[10px] text-[var(--color-critical)]">{err}</span>
      ) : null}
    </div>
  );
}

export function InlinePrice({
  value,
  onSave,
}: {
  value: number;
  onSave: (next: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = async () => {
    const n = Number(draft.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setEditing(false);
      setDraft(String(value));
      return;
    }
    if (n === value) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onSave(n);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm tabular-nums text-[var(--color-ink)] hover:underline underline-offset-2 shrink-0"
      >
        {EURO.format(value)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={draft}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="w-20 text-sm tabular-nums bg-[var(--color-paper-soft)] border border-[var(--color-line)] rounded px-2 py-0.5 focus:outline-none focus:border-[var(--color-ink)]"
      />
      <span className="text-xs text-[var(--color-ink-muted)]">EUR</span>
      <button
        type="button"
        onClick={commit}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
