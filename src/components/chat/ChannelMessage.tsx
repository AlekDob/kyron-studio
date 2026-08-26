"use client";

// Una riga della chat a canale (stile Slack): avatar + nome + ora + corpo.
// Le righe di fila dello stesso autore non ripetono avatar e nome.
import type { ReactElement } from "react";
import { MarkdownContent, type AgentMessage } from "@studiofuturo/studio-core";
import { AgentFace } from "@/components/chat/AgentFace";
import { Skeleton } from "@/components/ui";
import { GenerativeRenderer } from "@/components/chat/generative/registry";
import type {
  GenerativeDescriptor,
  GenerativeSubmission,
} from "@/components/chat/generative/types";

function formatTime(ts: number): string {
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

/** Cerchietto con l'iniziale: l'utente non ha un avatar caricato in Kyron. */
function UserBadge({ label }: { label: string }): ReactElement {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper-muted)] text-[12px] font-medium text-[var(--color-ink-soft)]">
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

interface Props {
  message: AgentMessage;
  /** Nome dell'agente, seed dell'avatar. */
  agentId: string;
  agentName: string;
  userLabel: string;
  /** Prima riga di un blocco: mostra avatar e nome. */
  showAuthor: boolean;
  /** Etichette leggibili dei tool ("run_hogql" -> "Query PostHog"). */
  toolLabels: Record<string, string>;
  busy: boolean;
  /** Card gia' inviate, per id del descriptor: tornano di sola lettura. */
  sent?: Record<string, GenerativeSubmission>;
  /** Assente = card di sola lettura (agenti che non chiedono input). */
  onSubmitCard?: (d: GenerativeDescriptor, sub: GenerativeSubmission) => void;
}

export function ChannelMessage({
  message: m,
  agentId,
  agentName,
  userLabel,
  showAuthor,
  toolLabels,
  busy,
  sent = {},
  onSubmitCard,
}: Props): ReactElement {
  const isAgent = m.role === "assistant";
  const author = isAgent ? agentName : userLabel;
  const hasUi = Boolean(m.ui?.length);
  const tools = [...new Set(m.tools ?? [])];

  return (
    <article
      className={`group/message flex gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--studio-hover-surface)] ${
        showAuthor ? "mt-5 first:mt-0" : "mt-1"
      }`}
    >
      <div className="flex w-8 shrink-0 justify-center pt-0.5">
        {showAuthor ? (
          isAgent ? (
            <AgentFace seed={agentId} label={agentName} size={32} />
          ) : (
            <UserBadge label={userLabel} />
          )
        ) : (
          <span className="pt-1 text-[11px] tabular-nums text-[var(--color-ink-muted)] opacity-0 group-hover/message:opacity-100">
            {formatTime(m.at)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {showAuthor && (
          <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
            <span className="truncate text-[15px] font-semibold text-[var(--color-ink)]">
              {author}
            </span>
            <span className="text-[13px] tabular-nums text-[var(--color-ink-muted)]">
              {formatTime(m.at)}
            </span>
          </div>
        )}
        {tools.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-md border border-[var(--color-line)] bg-[var(--color-paper-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-ink-muted)]"
              >
                {toolLabels[t] ?? t}
              </span>
            ))}
          </div>
        )}
        {m.ui?.map((descriptor, i) => (
          <div key={`${descriptor.id}-${i}`} className="my-2">
            <GenerativeRenderer
              descriptor={descriptor}
              readOnly={!onSubmitCard || Boolean(sent[descriptor.id])}
              initialSubmission={sent[descriptor.id] ?? null}
              disabled={busy}
              onSubmit={
                onSubmitCard ? (sub) => onSubmitCard(descriptor, sub) : undefined
              }
            />
          </div>
        ))}
        {m.content.trim() ? (
          <MarkdownContent content={m.content} />
        ) : (
          busy &&
          isAgent &&
          !hasUi && (
            // Attesa del primo token: due righe di skeleton, non un puntino.
            <div className="flex flex-col gap-1.5 py-1">
              <Skeleton className="h-3.5 w-[70%] rounded-md" />
              <Skeleton className="h-3.5 w-[45%] rounded-md" />
            </div>
          )
        )}
      </div>
    </article>
  );
}
