"use client";
import { useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import type { PortalDetail } from "@/lib/gateway";
import { DuplicatePortalModal } from "./DuplicatePortalModal";
import { EnablePortalButton } from "./EnablePortalButton";
import { isDraft } from "./portals-filter";

// Le azioni del portale: pubblicazione, stato, duplica, elimina. Stanno nella
// scheda e non sulla riga della lista — in lista un select e un cestino accanto
// a ogni portale sono un click sbagliato che aspetta di succedere.
export interface PortalActionHandlers {
  onChangeStatus: (slug: string, status: string) => Promise<void>;
  onDelete: (slug: string) => Promise<void>;
  onDuplicate: (sourceSlug: string, body: { newSlug: string; newNome: string }) => Promise<void>;
}

export function PortalActions({
  portal,
  onChangeStatus,
  onDelete,
  onDuplicate,
  onChanged,
}: PortalActionHandlers & { portal: PortalDetail; onChanged?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const draft = isDraft(portal);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <EnablePortalButton slug={portal.slug} status={portal.status} onDone={onChanged} />

      <button
        type="button"
        disabled={busy}
        onClick={() => void run(() => onChangeStatus(portal.slug, draft ? "onboarded" : "draft"))}
        className="rounded-[var(--radius-control)] border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)] disabled:opacity-50"
      >
        {draft ? "Segna come Live" : "Rimetti in bozza"}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => setDuplicating(true)}
        className="inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)] disabled:opacity-50"
      >
        <Copy size={12} /> Duplica
      </button>

      {/* Due click: il primo chiede conferma, il secondo cancella davvero. */}
      <button
        type="button"
        disabled={busy}
        onClick={() => (confirm ? void run(() => onDelete(portal.slug)) : setConfirm(true))}
        onBlur={() => setConfirm(false)}
        className={`inline-flex items-center gap-1 rounded-[var(--radius-control)] border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 ${
          confirm
            ? "border-[var(--color-critical)] bg-[var(--color-critical)] text-white"
            : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-critical)] hover:text-[var(--color-critical)]"
        }`}
      >
        <Trash2 size={12} /> {confirm ? "Confermi?" : "Elimina"}
      </button>

      {duplicating && (
        <DuplicatePortalModal
          sourceSlug={portal.slug}
          sourceNome={portal.nome}
          onClose={() => setDuplicating(false)}
          onConfirm={async (body) => {
            await onDuplicate(portal.slug, body);
            setDuplicating(false);
          }}
        />
      )}
    </div>
  );
}
