"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
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
import type { Annotation } from "@/lib/review/types";
import { buildUrn } from "@/lib/review/urn";
import type { PendingTarget } from "./PreviewWorkspace";
import { SelectionChip } from "./SelectionChip";
import {
  ProposalCard,
  type ProposalEntry,
  type ProposeArgs,
} from "./ProposalCard";

interface Props {
  currentUrl: string;
  currentPath: string;
  annotationsCount: number;
  pendingTarget: PendingTarget | null;
  onDismissPending: () => void;
  reviewer: string;
  onAdd: (a: Annotation) => void;
  onSendRequest: () => void;
}

type ChatEntry =
  | {
      kind: "msg";
      role: "user" | "assistant" | "system";
      content: string;
    }
  | (ProposalEntry & { kind: "proposal" });

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localeFromPath(path: string): "it" | "en" {
  return path.startsWith("/en") ? "en" : "it";
}

function entriesToMessages(entries: ChatEntry[]): ChatMessage[] {
  return entries
    .filter((e): e is Extract<ChatEntry, { kind: "msg" }> => e.kind === "msg")
    .map((e) => ({ role: e.role, content: e.content }));
}

function buildAnnotation(
  args: ProposeArgs,
  currentUrl: string,
  reviewer: string,
  overrides?: { text?: string },
): Annotation | null {
  if (!args.kind || !args.page) return null;
  const locale = localeFromPath(args.page);
  const source = {
    kind: "dom" as const,
    url: currentUrl,
    selector: args.selector?.trim() || "body",
    locale,
  };
  return {
    id: makeId("rev"),
    urn: buildUrn(source),
    source,
    page: args.page,
    kind: args.kind,
    original: {
      text: args.original?.text,
      assetSrc: args.original?.assetSrc,
    },
    proposal: {
      text: overrides?.text ?? args.proposal?.text,
      note: args.proposal?.note,
      newAssetHint: args.proposal?.newAssetHint,
      position: args.proposal?.position,
    },
    status: "open",
    createdAt: new Date().toISOString(),
    reviewer,
  };
}

function truncate(s: string, max = 120): string {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

const INTRO_MESSAGE =
  "Sono l'agente Review Editor. Clicca un elemento nell'anteprima a sinistra per selezionarlo, poi descrivimi la modifica. Io strutturo la proposta, tu confermi qui in chat, e poi inviamo tutto via email.";

export function PreviewChat(props: Props): ReactElement {
  const [entries, setEntries] = useState<ChatEntry[]>([
    { kind: "msg", role: "assistant", content: INTRO_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [entries, streaming, toolStatus]);

  const runStream = useCallback(
    async (seed: ChatEntry[]) => {
      setStreaming(true);
      setEntries([...seed, { kind: "msg", role: "assistant", content: "" }]);

      let working = seed;
      let buf = "";

      try {
        for await (const ev of streamReviewEditor({
          messages: entriesToMessages(seed),
          context: {
            currentUrl: props.currentUrl,
            currentPath: props.currentPath,
            annotationsCount: props.annotationsCount,
            pendingTarget: props.pendingTarget ?? undefined,
          },
        })) {
          if (ev.type === "delta") {
            buf += ev.delta;
            setEntries([
              ...working,
              { kind: "msg", role: "assistant", content: buf },
            ]);
          } else if (ev.type === "tool") {
            setToolStatus(`Sto chiamando \`${ev.tool}\`…`);
            if (ev.tool === "propose_annotation") {
              const id = makeId("prop");
              const args = (ev.args ?? {}) as ProposeArgs;
              const flushed: ChatEntry[] = buf
                ? [
                    ...working,
                    { kind: "msg", role: "assistant", content: buf },
                  ]
                : working;
              working = [
                ...flushed,
                { kind: "proposal", id, args, state: "pending" },
              ];
              buf = "";
              setEntries(working);
            } else if (ev.tool === "add_annotation") {
              const a = buildAnnotation(
                (ev.args ?? {}) as ProposeArgs,
                props.currentUrl,
                props.reviewer,
              );
              if (a) props.onAdd(a);
            } else if (ev.tool === "request_send_bundle") {
              props.onSendRequest();
            }
          } else if (ev.type === "tool-result") {
            setToolStatus(null);
          } else if (ev.type === "error") {
            buf += `\n\n_[errore: ${ev.error}]_`;
            setEntries([
              ...working,
              { kind: "msg", role: "assistant", content: buf },
            ]);
          }
        }
      } finally {
        setStreaming(false);
        setToolStatus(null);
      }
    },
    [props],
  );

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    const next: ChatEntry[] = [
      ...entries,
      { kind: "msg", role: "user", content: trimmed },
    ];
    setInput("");
    await runStream(next);
  }

  const confirmProposal = useCallback(
    async (id: string, editedText?: string) => {
      const found = entries.find(
        (e): e is Extract<ChatEntry, { kind: "proposal" }> =>
          e.kind === "proposal" && e.id === id && e.state === "pending",
      );
      if (!found) return;
      const next = entries.map<ChatEntry>((e) =>
        e.kind === "proposal" && e.id === id && e.state === "pending"
          ? { ...e, state: "confirmed", editedText }
          : e,
      );
      const annotation = buildAnnotation(
        found.args,
        props.currentUrl,
        props.reviewer,
        editedText ? { text: editedText } : undefined,
      );
      if (annotation) props.onAdd(annotation);

      const ack: ChatEntry = {
        kind: "msg",
        role: "user",
        content: editedText
          ? `Confermo con modifica: "${truncate(editedText)}"`
          : "Confermo, aggiungi al bundle.",
      };
      await runStream([...next, ack]);
    },
    [entries, props, runStream],
  );

  const cancelProposal = useCallback(
    async (id: string) => {
      const next = entries.map<ChatEntry>((e) =>
        e.kind === "proposal" && e.id === id && e.state === "pending"
          ? { ...e, state: "cancelled" }
          : e,
      );
      const ack: ChatEntry = {
        kind: "msg",
        role: "user",
        content: "Annulla la proposta, non aggiungerla.",
      };
      await runStream([...next, ack]);
    },
    [entries, runStream],
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3"
      >
        {entries.map((entry, i) => {
          if (entry.kind === "proposal") {
            return (
              <ProposalCard
                key={entry.id}
                proposal={entry}
                disabled={streaming}
                onConfirm={(text) => void confirmProposal(entry.id, text)}
                onCancel={() => void cancelProposal(entry.id)}
              />
            );
          }
          const isLastAssistant =
            entry.role === "assistant" &&
            i === entries.length - 1 &&
            streaming;
          const align = entry.role === "user" ? "justify-end" : "justify-start";
          return (
            <div key={i} className={`flex ${align}`}>
              {entry.role === "user" ? (
                <ChatBubble role="user" state="complete">
                  {entry.content}
                </ChatBubble>
              ) : isLastAssistant ? (
                <StreamingBubble raw={entry.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" state="complete">
                  <MarkdownContent
                    content={processContent(entry.content).text}
                  />
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

      {props.pendingTarget && (
        <SelectionChip
          target={props.pendingTarget}
          onDismiss={props.onDismissPending}
        />
      )}

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
            placeholder={
              props.pendingTarget
                ? "Descrivi la modifica per l'elemento selezionato…"
                : "Descrivi una modifica…"
            }
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
