"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "@/components/ui";
import {
  streamDataEditor,
  type ChatMessage,
} from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";

interface Props {
  slug: string;
  id?: string;
}

const MUTATING_TOOLS = new Set(["update_record", "create_record", "delete_record"]);
const OPEN_TOOLS = new Set(["get_record", "update_record"]);

interface ToolArgs {
  slug?: string;
  id?: string | number;
}

function greeting(slug: string, id?: string): string {
  if (id) {
    return `Sto guardando il record **${id}** della collection \`${slug}\`. Posso modificarlo, aggiornare singoli campi o eliminarlo. Cosa vuoi fare?`;
  }
  return `Sto guardando la collection \`${slug}\`. Posso cercare record, mostrarteli, o crearne/aggiornarne uno. Da dove partiamo?`;
}

export function DataChat({ slug, id }: Props): ReactElement {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: greeting(slug, id) },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mutatedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming, toolStatus]);

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;

    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setStreaming(true);
    mutatedRef.current = false;

    let buf = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamDataEditor({
        messages: next,
        context: { slug, id },
      })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          setMessages([...next, { role: "assistant", content: buf }]);
        } else if (ev.type === "tool") {
          setToolStatus(`Sto chiamando \`${ev.tool}\`…`);
          if (MUTATING_TOOLS.has(ev.tool)) mutatedRef.current = true;
          if (OPEN_TOOLS.has(ev.tool)) {
            const args = (ev.args ?? {}) as ToolArgs;
            const targetSlug = args.slug ?? slug;
            const targetId = args.id != null ? String(args.id) : undefined;
            if (targetId && (targetSlug !== slug || targetId !== id)) {
              router.push(`/dati/${targetSlug}/${targetId}`);
            }
          }
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
          if (MUTATING_TOOLS.has(ev.tool)) router.refresh();
        } else if (ev.type === "error") {
          buf += `\n\n_[errore: ${ev.error}]_`;
          setMessages([...next, { role: "assistant", content: buf }]);
        }
      }
    } finally {
      setStreaming(false);
      setToolStatus(null);
      if (mutatedRef.current) router.refresh();
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3"
      >
        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1;
          const align = m.role === "user" ? "justify-end" : "justify-start";
          return (
            <div key={i} className={`flex ${align}`}>
              {m.role === "user" ? (
                <ChatBubble role="user" state="complete">
                  {m.content}
                </ChatBubble>
              ) : isLastAssistant ? (
                <StreamingBubble raw={m.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" state="complete">
                  <MarkdownContent content={processContent(m.content).text} />
                </ChatBubble>
              )}
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
            placeholder="Chiedi all'agente…"
            disabled={streaming}
            aria-label="Scrivi all'agente Editor Dati"
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
