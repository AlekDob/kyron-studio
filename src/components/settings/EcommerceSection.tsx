"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Button, Input, Pill } from "@/components/ui";
import {
  getEcommerceSettings,
  saveEcommerceSettings,
} from "@/lib/settings-api";

// Brain: decision-019 — % sconto bonifico configurabile. Il salvataggio scrive
// in studio-server (settings.json) e allinea il voucher Saleor BONIFICO-2 su
// tutti i channel (staging + prod). Lo storefront mostra questa % al checkout.
export function EcommerceSection(): ReactElement {
  const [percent, setPercent] = useState<string>("1.5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const s = await getEcommerceSettings();
      setPercent(String(s.bankTransferDiscountPercent));
      setLoading(false);
    })();
  }, []);

  const value = Number(percent.replace(",", "."));
  const valid = Number.isFinite(value) && value >= 0 && value <= 100;

  async function handleSave() {
    if (!valid) {
      setError("Inserisci una percentuale tra 0 e 100.");
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await saveEcommerceSettings({ bankTransferDiscountPercent: value });
    setSaving(false);
    if (ok) {
      setSavedAt(new Date().toISOString());
    } else {
      setError("Salvataggio non riuscito. Riprova.");
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow mb-3">Ecommerce</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Sconto <span className="text-[var(--color-ink-muted)]">bonifico bancario</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Percentuale di sconto applicata quando il cliente paga con bonifico.
          Vale per tutti i portali: al salvataggio aggiorniamo il voucher su
          Saleor e lo storefront mostra la nuova percentuale al checkout.
        </p>
      </header>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 space-y-5">
        <label className="space-y-2 block max-w-xs">
          <span className="mono-caps text-[var(--color-ink-muted)]">
            Sconto bonifico (%)
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={percent}
            disabled={loading}
            onChange={(e) => setPercent(e.target.value)}
          />
        </label>

        {error && (
          <p className="text-sm text-[var(--color-critical)]">{error}</p>
        )}

        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <div className="text-xs text-[var(--color-ink-muted)]">
            {savedAt ? (
              <Pill variant="tertiary" size="sm">
                salvato e propagato a Saleor
              </Pill>
            ) : (
              "Il calcolo reale vive nel voucher Saleor BONIFICO-2."
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!valid || loading}
            onClick={() => void handleSave()}
          >
            Salva
          </Button>
        </div>
      </div>
    </section>
  );
}
