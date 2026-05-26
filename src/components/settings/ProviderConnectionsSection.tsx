"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Button, Input, Pill } from "@/components/ui";
import {
  listProviders,
  saveProvider,
  testProvider,
  type ProviderStatus,
  type TestResult,
} from "@/lib/settings-api";

interface ProviderMeta {
  id: string;
  label: string;
  needsApiKey: boolean;
  needsBaseURL: boolean;
  hint?: string;
}

const PROVIDERS: ProviderMeta[] = [
  { id: "openai", label: "OpenAI", needsApiKey: true, needsBaseURL: false },
  { id: "anthropic", label: "Anthropic Claude", needsApiKey: true, needsBaseURL: false },
  { id: "google", label: "Google Gemini", needsApiKey: true, needsBaseURL: false },
  { id: "mistral", label: "Mistral", needsApiKey: true, needsBaseURL: false },
  { id: "groq", label: "Groq", needsApiKey: true, needsBaseURL: false },
  { id: "deepseek", label: "DeepSeek", needsApiKey: true, needsBaseURL: false },
  { id: "glm", label: "GLM (Zhipu)", needsApiKey: true, needsBaseURL: false },
  { id: "minimax", label: "MiniMax", needsApiKey: true, needsBaseURL: false },
  {
    id: "ollama",
    label: "Ollama (locale)",
    needsApiKey: false,
    needsBaseURL: true,
    hint: "Default: http://localhost:11434",
  },
  {
    id: "openai-compat",
    label: "OpenAI Compatible",
    needsApiKey: true,
    needsBaseURL: true,
  },
];

export function ProviderConnectionsSection(): ReactElement {
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>({});

  useEffect(() => {
    void listProviders().then(setStatuses);
  }, []);

  const refresh = async (): Promise<void> => {
    setStatuses(await listProviders());
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow mb-3">Connessioni</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Provider <span className="font-serif italic">AI</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Configura la API key di ogni provider una sola volta. Poi nella sezione
          &quot;Modelli AI&quot; scegli quale provider e modello usare per
          l&apos;agente di onboarding.
        </p>
      </header>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] divide-y divide-[var(--color-line)] bg-[var(--color-paper)]">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            meta={p}
            status={statuses[p.id]}
            onSaved={refresh}
          />
        ))}
      </div>
    </section>
  );
}

interface ProviderCardProps {
  meta: ProviderMeta;
  status?: ProviderStatus;
  onSaved: () => Promise<void>;
}

function ProviderCard({ meta, status, onSaved }: ProviderCardProps): ReactElement {
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);

  useEffect(() => {
    setBaseURL(status?.baseURL ?? "");
  }, [status?.baseURL]);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    const payload: { apiKey?: string; baseURL?: string } = {};
    if (apiKey) payload.apiKey = apiKey;
    if (baseURL) payload.baseURL = baseURL;
    await saveProvider(meta.id, payload);
    setApiKey("");
    await onSaved();
    setSaving(false);
  };

  const handleTest = async (): Promise<void> => {
    setTesting(true);
    setTest(null);
    if (apiKey || baseURL) {
      const payload: { apiKey?: string; baseURL?: string } = {};
      if (apiKey) payload.apiKey = apiKey;
      if (baseURL) payload.baseURL = baseURL;
      await saveProvider(meta.id, payload);
      setApiKey("");
    }
    const result = await testProvider(meta.id);
    setTest(result);
    await onSaved();
    setTesting(false);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-medium">{meta.label}</p>
          <p className="mono-caps text-[var(--color-ink-muted)] mt-1">{meta.id}</p>
        </div>
        <ConnectionBadge status={status} test={test} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
        {meta.needsApiKey ? (
          <Input
            type="password"
            placeholder={status?.hasApiKey ? "********* (salvata)" : "API key"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        ) : (
          <div className="flex items-center text-xs text-[var(--color-ink-muted)]">
            Nessuna API key richiesta
          </div>
        )}

        {meta.needsBaseURL || meta.id === "ollama" ? (
          <Input
            placeholder={meta.hint ?? "Base URL"}
            value={baseURL}
            onChange={(e) => setBaseURL(e.target.value)}
          />
        ) : (
          <div />
        )}

        <Button
          variant="ghost"
          size="sm"
          loading={testing}
          onClick={() => void handleTest()}
        >
          Testa
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={saving}
          onClick={() => void handleSave()}
        >
          Salva
        </Button>
      </div>

      {test && (
        <p
          className={
            test.ok
              ? "text-xs text-[var(--color-positive)]"
              : "text-xs text-[var(--color-critical)]"
          }
        >
          {test.ok ? "OK — " : "Errore: "}
          {test.message}
        </p>
      )}
    </div>
  );
}

function ConnectionBadge({
  status,
  test,
}: {
  status?: ProviderStatus;
  test: TestResult | null;
}): ReactElement {
  if (test?.ok) return <Pill variant="tertiary" size="sm">verificato ora</Pill>;
  if (status?.verifiedAt) {
    return (
      <Pill variant="tertiary" size="sm">
        verificato {formatRelative(status.verifiedAt)}
      </Pill>
    );
  }
  if (status?.configured) return <Pill variant="neutral" size="sm">configurato</Pill>;
  return <Pill variant="neutral" size="sm">non configurato</Pill>;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "ora";
  if (min < 60) return `${min}m fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  return `${d}g fa`;
}
