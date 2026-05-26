"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChatBubble } from "@/components/ui";
import {
  streamReviewEditor,
  type ChatMessage,
} from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";
import type { Annotation, AnnotationKind } from "@/lib/review/types";
import { buildUrn } from "@/lib/review/urn";

interface Props {
  currentUrl: string;
  currentPath: string;
  annotationsCount: number;
  reviewer: string;
  onAdd: (a: Annotation) => void;
  onSendRequest: () => void;
}

interface ToolArgs {
  kind?: AnnotationKind;
  page?: string;
  selector?: string;
  original?: { text?: string; assetSrc?: string };
  proposal?: {
    text?: string;
    note?: string;
    newAssetHint?: string;
    position?: "before" | "after" | "replace";
  };
}

function makeId(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localeFromPath(path: string): "it" | "en" {
  return path.startsWith("/en") ? "en" : "it";
}

export function PreviewChat(props: Props): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Sono l'agente Review Editor. Naviga il sito a sinistra e descrivimi le modifiche che vuoi proporre — testi da cambiare, immagini, commenti. Io le strutturo, tu confermi, e poi inviamo tutto via email.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming, toolStatus]);

  function applyAddAnnotation(args: ToolArgs): void {
    if (!args.kind || !args.page) return;
    const locale = localeFromPath(args.page);
    const source =
      args.selector && args.selector.trim()
        ? {
            kind: "dom" as const,
            url: props.currentUrl,
            selector: args.selector,
            locale,
          }
        : {
            kind: "dom" as const,
            url: props.currentUrl,
            selector: "body",
            locale,
          };
    const annotation: Annotation = {
      id: makeId(),
      urn: buildUrn(source),
      source,
      page: args.page,
      kind: args.kind,
      original: {
        text: args.original?.text,
        assetSrc: args.original?.assetSrc,
      },
      proposal: {
        text: args.proposal?.text,
        note: args.proposal?.note,
        newAssetHint: args.proposal?.newAssetHint,
        position: args.proposal?.position,
      },
      status: "open",
      createdAt: new Date().toISOString(),
      reviewer: props.reviewer,
    };
    props.onAdd(annotation);
  }

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

    let buf = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamReviewEditor({
        messages: next,
        context: {
          currentUrl: props.currentUrl,
          currentPath: props.currentPath,
          annotationsCount: props.annotationsCount,
        },
      })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          setMessages([...next, { role: "assistant", content: buf }]);
        } else if (ev.type === "tool") {
          setToolStatus(`Sto chiamando \`${ev.tool}\`…`);
          if (ev.tool === "add_annotation") {
            applyAddAnnotation((ev.args ?? {}) as ToolArgs);
          } else if (ev.tool === "request_send_bundle") {
            props.onSendRequest();
          }
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
        } else if (ev.type === "error") {
          buf += `\n\n_[errore: ${ev.error}]_`;
          setMessages([...next, { role: "assistant", content: buf }]);
        }
      }
    } finally {
      setStreaming(false);
      setToolStatus(null);
    }
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col">
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
            placeholder="Descrivi una modifica…"
            disabled={streaming}
            aria-label="Scrivi all'agente Review Editor"
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
