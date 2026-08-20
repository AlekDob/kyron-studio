"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatBubble } from "@/components/ui";

// Brain: porting 1:1 da Virgilio apps/client/src/modules/_shared/chat-ui.tsx.
// Single source of truth per la chat agente in Studio.

export function processContent(
  raw: string,
  extraStrip: RegExp[] = [],
): { text: string; isThinking: boolean } {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/g, "");
  for (const re of extraStrip) s = s.replace(re, "");
  const openIdx = s.indexOf("<think>");
  if (openIdx !== -1) {
    return { text: s.slice(0, openIdx).trimEnd(), isThinking: true };
  }
  return { text: s.trimStart(), isThinking: false };
}

export function MarkdownContent({ content }: { content: string }): ReactElement {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-[var(--color-ink)]">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        code: ({ children }) => (
          <code className="rounded bg-[var(--color-paper-muted)] px-1 py-0.5 font-mono text-xs text-[var(--color-ink)]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-[var(--radius-card)] bg-[var(--color-paper-muted)] p-3 font-mono text-xs last:mb-0">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-[var(--color-line)] pl-3 text-[var(--color-ink-muted)] last:mb-0">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="mb-4 mt-3 overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-line)] last:mb-0">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-[var(--color-paper-muted)]">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-[var(--color-line)]">{children}</tbody>
        ),
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="border-b border-[var(--color-line)] px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-3 text-[var(--color-ink)]">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function useTypewriter(
  target: string,
  enabled: boolean,
  speed = 180,
): string {
  const posRef = useRef(enabled ? 0 : target.length);
  const targetRef = useRef(target);
  const [, tick] = useState(0);

  targetRef.current = target;

  useEffect(() => {
    if (!enabled) {
      posRef.current = target.length;
      tick((n) => n + 1);
      return;
    }
    const ms = 1000 / speed;
    const id = setInterval(() => {
      if (posRef.current < targetRef.current.length) {
        posRef.current++;
        tick((n) => n + 1);
      }
    }, ms);
    return () => clearInterval(id);
  }, [enabled, speed, target.length]);

  return target.slice(0, enabled ? posRef.current : target.length);
}

export function StreamingBubble({
  raw,
  isStreaming,
  agent,
  extraStrip = [],
}: {
  raw: string;
  isStreaming: boolean;
  agent?: string;
  extraStrip?: RegExp[];
}): ReactElement {
  const { text, isThinking } = processContent(raw, extraStrip);
  const displayed = useTypewriter(text, isStreaming && !isThinking);
  const typing =
    isStreaming && !isThinking && displayed.length < text.length;
  const state = !isStreaming
    ? "complete"
    : isThinking || !text
      ? "thinking"
      : typing
        ? "streaming"
        : "complete";
  return (
    <ChatBubble role="assistant" state={state} agent={agent}>
      {displayed ? <MarkdownContent content={displayed} /> : null}
    </ChatBubble>
  );
}
