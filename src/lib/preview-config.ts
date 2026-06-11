// Base URL del sito mostrato nel modulo Anteprima.
// Unico punto di verita': cambiare ambiente = cambiare env, non il codice.
// NEXT_PUBLIC_* viene inlinata al build, quindi e' leggibile anche client-side.
export const PREVIEW_BASE_URL =
  process.env.NEXT_PUBLIC_PREVIEW_BASE_URL ?? "https://kyronedu.it";

// Origin cms ammessi a dialogare con lo studio via postMessage
// (handshake kyron-rev:* del ReviewOverlay). Dedup per quando
// PREVIEW_BASE_URL coincide con uno dei default.
export const PARENT_ORIGINS = Array.from(
  new Set([
    PREVIEW_BASE_URL,
    "https://kyronedu.it",
    "https://staging.kyronedu.it",
    "http://localhost:3000",
  ]),
);
