"use client";

import { useState, type ReactElement } from "react";
import { FloatingModal } from "@/components/ui";
import { DaneaUploader } from "@/components/chat/generative/DaneaUploader";
import { DaneaImportPlan, type DaneaPlanData } from "@/components/chat/generative/DaneaImportPlan";

export function ImportWizard({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}): ReactElement {
  const [importId, setImportId] = useState<string | null>(null);
  const [plan, setPlan] = useState<DaneaPlanData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function afterUpload(id: string): Promise<void> {
    setError(null);
    const res = await fetch(`/api/products/import/${id}/plan?channel=default-channel`);
    const json = (await res.json()) as { plan?: DaneaPlanData; error?: string };
    if (!res.ok || !json.plan) {
      setError(json.error ?? "Piano non disponibile");
      return;
    }
    setImportId(id);
    setPlan(json.plan);
  }

  return (
    <FloatingModal open={open} onOpenChange={(v) => !v && onClose()} size="lg" position="right" ariaLabel="Importa prodotti">
      <div className="flex h-full flex-col overflow-hidden p-5">
        <p className="text-sm font-medium">Importa da Danea</p>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          XML listino, poi nomi, foto, negozio, portali.
        </p>
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {!importId && (
            <DaneaUploader
              onSubmit={(data) => {
                if (data.kind !== "products") {
                  setError("Questo file e' un DDT, non un listino prodotti.");
                  return;
                }
                void afterUpload(data.id);
              }}
            />
          )}
          {error && <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{error}</p>}
          {importId && plan && (
            <DaneaImportPlan
              target="prod"
              importId={importId}
              plan={plan}
              onApplied={onDone}
            />
          )}
        </div>
      </div>
    </FloatingModal>
  );
}
