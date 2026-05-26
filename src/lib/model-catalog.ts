import type { ProviderId } from "./settings-api";

// Fallback statico usato quando il provider non risponde a /v1/models o non e'
// ancora configurato. Verita' resta upstream — questo serve solo per popolare
// il select all'inizio.

const STATIC_MODEL_CATALOG: Record<ProviderId, string[]> = {
  openai: [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-5.1",
    "gpt-5.1-mini",
    "o3",
    "o3-mini",
    "o4-mini",
  ],
  anthropic: [
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "claude-haiku-4-5-20251001",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
  ],
  mistral: [
    "mistral-large-latest",
    "mistral-medium-latest",
    "mistral-small-latest",
    "open-mistral-nemo",
    "codestral-latest",
    "ministral-8b-latest",
  ],
  google: [
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  groq: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  glm: ["glm-4-plus", "glm-4-air", "glm-4-flash", "glm-4-long"],
  minimax: ["MiniMax-Text-01", "abab6.5s-chat", "abab6.5g-chat"],
  ollama: [],
  "openai-compat": [],
};

export function getStaticModels(provider: ProviderId): string[] {
  return STATIC_MODEL_CATALOG[provider] ?? [];
}
