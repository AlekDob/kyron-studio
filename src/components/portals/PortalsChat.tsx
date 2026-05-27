"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "@/components/ui";
import {
  streamOnboardChat,
  type ChatMessage,
  type ChatStreamEvent,
} from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
  type GenerativeSubmission,
} from "@/components/chat/generative/types";
import { GenerativeRenderer } from "@/components/chat/generative/registry";

interface Props {
  slug?: string;
}

interface UiBlock {
  descriptor: GenerativeDescriptor;
  submission?: GenerativeSubmission;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  ui?: UiBlock;
}

const NAV_TOOLS = new Set(["get_portal"]);

interface ToolArgs {
  slug?: string;
}

function greeting(slug?: string): string {
  if (slug) {
    return `Sto guardando il portale **${slug}**. Posso mostrarti i dettagli, analizzare il catalogo e i kit, o confrontarlo con altri portali. Cosa vuoi sapere?`;
  }
  return "Ciao! Posso aiutarti a creare un nuovo portale scuola o mostrarti quelli esistenti. Da dove partiamo?";
}

export function PortalsChat({ slug }: Props): ReactElement {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: greeting(slug) },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, streaming, toolStatus]);

  function toMessages(): ChatMessage[] {
    return turns.map((t) => ({ role: t.role, content: t.content }));
  }

  async function send(text?: string): Promise<void> {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming) return;
    if (!text) setInput("");

    const next: ChatTurn[] = [
      ...turns,
      { role: "user", content: trimmed },
    ];
    setTurns(next);
    setStreaming(true);

    const msgs = next.map((t) => ({ role: t.role, content: t.content }));
    let buf = "";
    let pendingUi: UiBlock | undefined;
    setTurns([...next, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamOnboardChat({ messages: msgs })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          setTurns([
            ...next,
            { role: "assistant", content: buf, ui: pendingUi },
          ]);
        } else if (ev.type === "tool") {
          setToolStatus(`Sto chiamando \`${ev.tool}\`...`);
          if (NAV_TOOLS.has(ev.tool)) {
            const args = (ev.args ?? {}) as ToolArgs;
            if (args.slug && args.slug !== slug) {
              router.push(`/portals/${args.slug}`);
            }
          }
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
          const desc = extractGenerativeDescriptor(ev.result);
          if (desc) {
            pendingUi = { descriptor: desc };
            setTurns([
              ...next,
              { role: "assistant", content: buf, ui: pendingUi },
            ]);
          }
          if (ev.tool === "list_portals") router.refresh();
        } else if (ev.type === "error") {
          buf += `\n\n_[errore: ${ev.error}]_`;
          setTurns([...next, { role: "assistant", content: buf }]);
        }
      }
    } finally {
      setStreaming(false);
      setToolStatus(null);
    }
  }

  function handleGenerativeSubmit(
    turnIdx: number,
    submission: GenerativeSubmission,
  ): void {
    setTurns((prev) => {
      const updated = [...prev];
      const turn = updated[turnIdx];
      if (!turn?.ui) return prev;
      updated[turnIdx] = {
        ...turn,
        ui: { ...turn.ui, submission },
      };
      return updated;
    });

    const summary = renderUserSummary(submission);
    const payload = JSON.stringify({
      kind: "generative_submission",
      component: turns[turnIdx]?.ui?.descriptor.component,
      data: submission.data,
    });

    const next: ChatTurn[] = [
      ...turns.map((t, i) =>
        i === turnIdx && t.ui
          ? { ...t, ui: { ...t.ui, submission } }
          : t,
      ),
      { role: "user" as const, content: payload },
    ];
    setTurns(next);

    void (async () => {
      setStreaming(true);
      let buf = "";
      let pendingUi: UiBlock | undefined;
      setTurns([...next, { role: "assistant", content: "" }]);
      const msgs = next.map((t) => ({ role: t.role, content: t.content }));

      try {
        for await (const ev of streamOnboardChat({ messages: msgs })) {
          if (ev.type === "delta") {
            buf += ev.delta;
            setTurns([
              ...next,
              { role: "assistant", content: buf, ui: pendingUi },
            ]);
          } else if (ev.type === "tool") {
            setToolStatus(`Sto chiamando \`${ev.tool}\`...`);
            if (NAV_TOOLS.has(ev.tool)) {
              const args = (ev.args ?? {}) as ToolArgs;
              if (args.slug && args.slug !== slug) {
                router.push(`/portals/${args.slug}`);
              }
            }
          } else if (ev.type === "tool-result") {
            setToolStatus(null);
            const desc = extractGenerativeDescriptor(ev.result);
            if (desc) {
              pendingUi = { descriptor: desc };
              setTurns([
                ...next,
                { role: "assistant", content: buf, ui: pendingUi },
              ]);
            }
          } else if (ev.type === "error") {
            buf += `\n\n_[errore: ${ev.error}]_`;
            setTurns([...next, { role: "assistant", content: buf }]);
          }
        }
      } finally {
        setStreaming(false);
        setToolStatus(null);
      }
    })();

    void summary;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3"
      >
        {turns.map((t, i) => {
          const isLastAssistant =
            t.role === "assistant" && i === turns.length - 1;
          const align = t.role === "user" ? "justify-end" : "justify-start";
          const isGenSubmission =
            t.role === "user" && t.content.startsWith('{"kind"');

          return (
            <div key={i} className={`flex flex-col ${align} gap-2`}>
              {t.role === "user" ? (
                <div className="flex justify-end">
                  <ChatBubble role="user" state="complete">
                    {isGenSubmission
                      ? renderUserContent(t.content)
                      : t.content}
                  </ChatBubble>
                </div>
              ) : isLastAssistant ? (
                <StreamingBubble raw={t.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" state="complete">
                  <MarkdownContent content={processContent(t.content).text} />
                </ChatBubble>
              )}
              {t.ui ? (
                <GenerativeRenderer
                  descriptor={t.ui.descriptor}
                  readOnly={!!t.ui.submission}
                  disabled={streaming}
                  initialSubmission={t.ui.submission}
                  onSubmit={(sub) => handleGenerativeSubmit(i, sub)}
                />
              ) : null}
            </div>
          );
        })}
        {toolStatus && (
          <p className="text-xs text-[var(--color-ink-muted)] italic px-2">
            {toolStatus}
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-t border-[var(--color-line)] px-4 py-3"
      >
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] py-2 pl-4 pr-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi all'agente..."
            disabled={streaming}
            aria-label="Scrivi all'agente Portali"
            className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            aria-label="Invia"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-action)] text-[var(--color-paper)] hover:bg-[var(--color-action-hover)] disabled:opacity-30"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

function renderUserSummary(sub: GenerativeSubmission): string {
  const d = sub.data as Record<string, unknown>;
  if (d.selectedSlugs) {
    const slugs = d.selectedSlugs as string[];
    return `Selezionati ${slugs.length} prodotti`;
  }
  if (d.name && d.priceEur != null) {
    return `Kit "${d.name}" a ${d.priceEur} EUR`;
  }
  return "Dati inviati";
}

function renderUserContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      data?: { selectedSlugs?: string[]; name?: string; priceEur?: number };
    };
    if (parsed.data?.selectedSlugs) {
      return `Selezionati ${parsed.data.selectedSlugs.length} prodotti`;
    }
    if (parsed.data?.name) {
      return `Kit "${parsed.data.name}" a ${parsed.data.priceEur} EUR`;
    }
  } catch {
    // fallback
  }
  return "Dati inviati";
}
