// Client per /api/settings/* (proxy server-side verso studio-server).
// Tenuto fetch-only, no toolkit di state: refetch manuale post-save.

export const PROVIDER_IDS = [
  "openai",
  "anthropic",
  "google",
  "mistral",
  "groq",
  "deepseek",
  "glm",
  "minimax",
  "ollama",
  "openai-compat",
] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export interface ModelConfig {
  provider: ProviderId;
  model: string;
}

export interface ProviderStatus {
  configured: boolean;
  hasApiKey: boolean;
  baseURL: string | null;
  verifiedAt: string | null;
}

export interface TestResult {
  ok: boolean;
  message: string;
  modelsCount?: number;
}

export interface ProviderModelsResult {
  models: string[];
  error?: string;
}

const BASE = "/api/settings";

export async function listProviders(): Promise<Record<string, ProviderStatus>> {
  try {
    const res = await fetch(`${BASE}/providers`, { cache: "no-store" });
    if (!res.ok) return {};
    const data = (await res.json()) as { providers?: Record<string, ProviderStatus> };
    return data.providers ?? {};
  } catch {
    return {};
  }
}

export async function saveProvider(
  providerId: string,
  body: { apiKey?: string; baseURL?: string },
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/providers/${encodeURIComponent(providerId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function testProvider(providerId: string): Promise<TestResult> {
  try {
    const res = await fetch(`${BASE}/providers/${encodeURIComponent(providerId)}/test`, {
      method: "POST",
    });
    if (!res.ok) return { ok: false, message: `Server ${res.status}` };
    return (await res.json()) as TestResult;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
}

export async function listProviderModels(
  providerId: string,
): Promise<ProviderModelsResult> {
  try {
    const res = await fetch(`${BASE}/providers/${encodeURIComponent(providerId)}/models`, {
      cache: "no-store",
    });
    if (!res.ok) return { models: [], error: `Server ${res.status}` };
    return (await res.json()) as ProviderModelsResult;
  } catch (err) {
    return { models: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getModuleRouting(
  moduleId: string,
): Promise<Record<string, ModelConfig>> {
  try {
    const res = await fetch(`${BASE}/routing/${encodeURIComponent(moduleId)}`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    return (await res.json()) as Record<string, ModelConfig>;
  } catch {
    return {};
  }
}

export async function saveProcessConfig(
  moduleId: string,
  processId: string,
  config: ModelConfig,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${BASE}/routing/${encodeURIComponent(moduleId)}/${encodeURIComponent(processId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
