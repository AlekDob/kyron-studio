"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Button, Pill, Select } from "@/components/ui";
import {
  getModuleRouting,
  listProviderModels,
  listProviders,
  saveProcessConfig,
  PROVIDER_IDS,
  type ModelConfig,
  type ProviderId,
  type ProviderStatus,
} from "@/lib/settings-api";
import { getStaticModels } from "@/lib/model-catalog";

const MODULE_ID = "onboard-school";
const PROCESS_ID = "default";

const RUNTIME_OK: ProviderId[] = [
  "openai",
  "mistral",
  "groq",
  "deepseek",
  "glm",
  "minimax",
  "openai-compat",
];

export function ModelRoutingSection(): ReactElement {
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});
  const [routing, setRouting] = useState<ModelConfig | null>(null);
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [model, setModel] = useState<string>("gpt-4o");
  const [dynamicModels, setDynamicModels] = useState<string[]>([]);
  const [dynamicError, setDynamicError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [provs, route] = await Promise.all([
        listProviders(),
        getModuleRouting(MODULE_ID),
      ]);
      setStatuses(provs);
      const current = route[PROCESS_ID];
      if (current) {
        setRouting(current);
        setProvider(current.provider);
        setModel(current.model);
      }
    })();
  }, []);

  useEffect(() => {
    setDynamicError(null);
    setDynamicModels([]);
    void listProviderModels(provider).then((res) => {
      setDynamicModels(res.models);
      if (res.error) setDynamicError(res.error);
    });
  }, [provider]);

  const models = useMemo(() => {
    if (dynamicModels.length > 0) return dynamicModels;
    return getStaticModels(provider);
  }, [provider, dynamicModels]);

  const runtimeSupported = RUNTIME_OK.includes(provider);
  const providerConfigured = statuses[provider]?.configured ?? false;

  const handleSave = async (): Promise<void> => {
    if (!model) return;
    setSaving(true);
    const ok = await saveProcessConfig(MODULE_ID, PROCESS_ID, { provider, model });
    if (ok) {
      setRouting({ provider, model });
      setSavedAt(new Date().toISOString());
    }
    setSaving(false);
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow mb-3">Modelli AI</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Agente <span className="font-serif italic">onboarding scuola</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Scegli quale modello LLM viene usato per la chat di raccolta dati
          scuola. La API key viene presa dalla sezione &quot;Provider AI&quot;
          qui sopra.
        </p>
      </header>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)] p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="mono-caps text-[var(--color-ink-muted)]">Provider</span>
            <Select
              value={provider}
              onChange={(e) => {
                const next = e.target.value as ProviderId;
                setProvider(next);
                setModel("");
              }}
            >
              {PROVIDER_IDS.map((p) => (
                <option key={p} value={p}>
                  {p}
                  {statuses[p]?.configured ? "" : " (non configurato)"}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-2">
            <span className="mono-caps text-[var(--color-ink-muted)]">Modello</span>
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={models.length === 0}
            >
              <option value="">— seleziona modello —</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          {dynamicModels.length > 0 ? (
            <Pill variant="tertiary" size="sm">lista live</Pill>
          ) : (
            <Pill variant="neutral" size="sm">lista offline</Pill>
          )}
          {dynamicError && <span className="text-[var(--color-critical)]">{dynamicError}</span>}
          {!providerConfigured && (
            <span>
              Il provider <code className="font-mono">{provider}</code> non ha
              ancora una API key salvata.
            </span>
          )}
          {!runtimeSupported && (
            <Pill variant="warning" size="sm">runtime non ancora supportato</Pill>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-4">
          <div className="text-xs text-[var(--color-ink-muted)]">
            {routing ? (
              <>
                Configurazione attuale:{" "}
                <code className="font-mono text-[var(--color-ink)]">
                  {routing.provider}/{routing.model}
                </code>
              </>
            ) : (
              "Nessuna configurazione salvata — l'agente userà il fallback OpenAI gpt-4o."
            )}
            {savedAt && <span className="ml-2 text-[var(--color-positive)]">salvato.</span>}
          </div>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!model}
            onClick={() => void handleSave()}
          >
            Salva configurazione
          </Button>
        </div>
      </div>
    </section>
  );
}
