"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChatBubble } from "@/components/ui";
import { streamOnboardChat, type ChatMessage } from "@/lib/chat-runtime";
import { MarkdownContent, StreamingBubble, processContent } from "./chat/chat-ui";

const INITIAL_GREETING =
  "Ciao. Iniziamo l'onboarding di una nuova scuola. Come si chiama la scuola?";

export function OnboardingChat(): ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    let assistantBuffer = "";
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamOnboardChat({ messages: next })) {
        if (ev.type === "delta") {
          assistantBuffer += ev.delta;
          setMessages([
            ...next,
            { role: "assistant", content: assistantBuffer },
          ]);
        } else if (ev.type === "error") {
          assistantBuffer += `\n\n_[errore: ${ev.error}]_`;
          setMessages([
            ...next,
            { role: "assistant", content: assistantBuffer },
          ]);
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 min-h-[400px]">
        {messages.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === messages.length - 1;

          if (m.role === "user") {
            return (
              <ChatBubble key={i} role="user" state="complete">
                {m.content}
              </ChatBubble>
            );
          }

          if (isLastAssistant) {
            return (
              <StreamingBubble
                key={i}
                raw={m.content}
                isStreaming={streaming}
              />
            );
          }

          return (
            <ChatBubble key={i} role="assistant" state="complete">
              <MarkdownContent content={processContent(m.content).text} />
            </ChatBubble>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-t border-[var(--color-line)] pt-4"
      >
        <div className="flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] py-2 pl-4 pr-2 transition-colors focus-within:border-[var(--color-line-strong)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi una risposta…"
            disabled={streaming}
            aria-label="Scrivi all'assistente di onboarding scuola"
            className="flex-1 bg-transparent text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            aria-label="Invia"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-action)] text-[var(--color-paper)] transition-opacity hover:bg-[var(--color-action-hover)] disabled:cursor-not-allowed disabled:opacity-30"
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
        <p className="mt-3 text-center text-xs text-[var(--color-ink-muted)]">
          L&apos;agente può sbagliare. Verifica sempre i dati raccolti prima di
          approvare la PendingSchool.
        </p>
      </form>
    </div>
  );
}
