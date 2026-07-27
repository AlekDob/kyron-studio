"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChatBubble } from "@/components/ui";
import { streamPriceGuard, type ChatMessage } from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
} from "@/components/chat/generative/types";
import { GenerativeRenderer } from "@/components/chat/generative/registry";
import type { Anomaly } from "@/components/chat/generative/AnomalyReport";

interface Props {
  // Notifica al workspace l'ultimo report, per il pannello di destra.
  onReport: (anomalies: Anomaly[]) => void;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  uis?: GenerativeDescriptor[];
}

const GREETING =
  "Posso controllare prezzi e sconti dei portali (sola lettura). Prova: \"controlla tutti i portali\" oppure \"controlla massari\".";

export function ChecksChat({ onReport }: Props): ReactElement {
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming, toolStatus]);

  async function runStream(msgs: ChatMessage[], next: ChatTurn[]): Promise<void> {
    let buf = "";
    const uis: GenerativeDescriptor[] = [];
    setTurns([...next, { role: "assistant", content: "" }]);
    try {
      for await (const ev of streamPriceGuard({ messages: msgs })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          cancelAnimationFrame(rafRef.current);
          const snap = buf;
          const uiSnap = [...uis];
          rafRef.current = requestAnimationFrame(() => {
            setTurns([...next, { role: "assistant", content: snap, uis: uiSnap }]);
          });
        } else if (ev.type === "tool") {
          setToolStatus("controllo in corso...");
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
          // Il pannello destro mostra le anomalie dell'ultimo controllo.
          const r = ev.result as { anomalies?: Anomaly[] } | undefined;
          if (Array.isArray(r?.anomalies)) onReport(r!.anomalies!);
          const desc = extractGenerativeDescriptor(ev.result);
          if (desc) {
            uis.push(desc);
            setTurns([...next, { role: "assistant", content: buf, uis: [...uis] }]);
          }
        } else if (ev.type === "error") {
          buf += `\n\n_[errore: ${ev.error}]_`;
          setTurns([...next, { role: "assistant", content: buf, uis: [...uis] }]);
        }
      }
    } finally {
      cancelAnimationFrame(rafRef.current);
      setStreaming(false);
      setToolStatus(null);
      if (buf || uis.length > 0) {
        setTurns([...next, { role: "assistant", content: buf, uis: [...uis] }]);
      }
    }
  }

  async function send(text?: string): Promise<void> {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming) return;
    if (!text) setInput("");
    const next: ChatTurn[] = [...turns, { role: "user", content: trimmed }];
    setTurns(next);
    setStreaming(true);
    await runStream(
      next.map((t) => ({ role: t.role, content: t.content })),
      next,
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto px-5 py-4">
        {turns.map((t, i) => {
          const isLastAssistant = t.role === "assistant" && i === turns.length - 1;
          return (
            <div key={i} className={`flex flex-col gap-2 ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              {t.role === "user" ? (
                <div className="flex justify-end">
                  <ChatBubble role="user" state="complete">
                    {t.content}
                  </ChatBubble>
                </div>
              ) : isLastAssistant ? (
                <StreamingBubble raw={t.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" state="complete">
                  <MarkdownContent content={processContent(t.content).text} />
                </ChatBubble>
              )}
              {t.uis?.map((d, j) => (
                <GenerativeRenderer key={d.id ?? j} descriptor={d} readOnly disabled={streaming} />
              ))}
            </div>
          );
        })}
        {toolStatus && (
          <p className="px-2 text-xs italic text-[var(--color-ink-muted)]">{toolStatus}</p>
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
            placeholder="Chiedi un controllo..."
            disabled={streaming}
            aria-label="Scrivi all'agente Controlli"
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
