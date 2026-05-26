// Studio chat runtime — port da Virgilio core/agent-client/runtime.ts.
// SSE diretto verso il proxy /api/agent/onboard-school (che inoltra a
// studio-server). Protocollo: ogni event e' `data: {json}\n\n` o `data: [DONE]\n\n`.

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatStreamEvent =
  | { type: "delta"; delta: string }
  | { type: "tool"; tool: string; args: unknown }
  | { type: "tool-result"; tool: string }
  | { type: "error"; error: string }
  | { type: "done" };

export async function* streamOnboardChat(input: {
  messages: ChatMessage[];
  signal?: AbortSignal;
}): AsyncGenerator<ChatStreamEvent, void, void> {
  yield* streamAgent({
    endpoint: "/api/agent/onboard-school",
    body: { messages: input.messages },
    signal: input.signal,
  });
}

export async function* streamDataEditor(input: {
  messages: ChatMessage[];
  context?: { slug?: string; id?: string | number };
  signal?: AbortSignal;
}): AsyncGenerator<ChatStreamEvent, void, void> {
  yield* streamAgent({
    endpoint: "/api/agent/data-editor",
    body: { messages: input.messages, context: input.context },
    signal: input.signal,
  });
}

export async function* streamReviewEditor(input: {
  messages: ChatMessage[];
  context?: {
    currentUrl?: string;
    currentPath?: string;
    annotationsCount?: number;
  };
  signal?: AbortSignal;
}): AsyncGenerator<ChatStreamEvent, void, void> {
  yield* streamAgent({
    endpoint: "/api/agent/review-editor",
    body: { messages: input.messages, context: input.context },
    signal: input.signal,
  });
}

async function* streamAgent(input: {
  endpoint: string;
  body: unknown;
  signal?: AbortSignal;
}): AsyncGenerator<ChatStreamEvent, void, void> {
  const res = await fetch(input.endpoint, {
    method: "POST",
    signal: input.signal,
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(input.body),
  });

  if (!res.ok || !res.body) {
    yield { type: "error", error: `Server ${res.status}` };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!raw.startsWith("data:")) continue;
      const payload = raw.slice(5).trim();
      if (payload === "[DONE]") {
        yield { type: "done" };
        return;
      }
      try {
        const parsed = JSON.parse(payload) as {
          delta?: string;
          tool?: string;
          args?: unknown;
          toolResult?: string;
          error?: string;
        };
        if (typeof parsed.delta === "string") {
          yield { type: "delta", delta: parsed.delta };
        } else if (typeof parsed.tool === "string") {
          yield { type: "tool", tool: parsed.tool, args: parsed.args };
        } else if (typeof parsed.toolResult === "string") {
          yield { type: "tool-result", tool: parsed.toolResult };
        } else if (typeof parsed.error === "string") {
          yield { type: "error", error: parsed.error };
        }
      } catch {
        // chunk malformato, skip
      }
    }
  }
}
