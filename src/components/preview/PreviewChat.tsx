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
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { Annotation } from "@/lib/review/types";
import { buildUrn } from "@/lib/review/urn";
import type { PendingTarget } from "./PreviewWorkspace";
import { SelectionChip } from "./SelectionChip";
import { ManualAnnotationForm } from "./ManualAnnotationForm";
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
  const [manualOpen, setManualOpen] = useState(false);
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
              const args = (ev.args ?? {}) as ProposeArgs;
              const alreadyHandled = working.some(
                (e) =>
                  e.kind === "proposal" &&
                  e.state === "confirmed" &&
                  e.args.kind === args.kind &&
                  e.args.page === args.page,
              );
              if (!alreadyHandled) {
                const id = makeId("prop");
                const flushed: ChatEntry[] = buf
                  ? [...working, { kind: "msg", role: "assistant", content: buf }]
                  : working;
                working = [
                  ...flushed,
                  { kind: "proposal", id, args, state: "pending" },
                ];
                buf = "";
                setEntries(working);
              }
            } else if (ev.tool === "add_annotation") {
              const args = (ev.args ?? {}) as ProposeArgs;
              const a = buildAnnotation(args, props.currentUrl, props.reviewer);
              if (a) props.onAdd(a);
              working = working.map<ChatEntry>((e) =>
                e.kind === "proposal" &&
                e.state === "pending" &&
                e.args.kind === args.kind &&
                e.args.page === args.page
                  ? { ...e, state: "confirmed" }
                  : e,
              );
              setEntries([...working, { kind: "msg", role: "assistant", content: buf }]);
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
    (id: string, editedText?: string) => {
      const found = entries.find(
        (e): e is Extract<ChatEntry, { kind: "proposal" }> =>
          e.kind === "proposal" && e.id === id && e.state === "pending",
      );
      if (!found) return;
      const annotation = buildAnnotation(
        found.args,
        props.currentUrl,
        props.reviewer,
        editedText ? { text: editedText } : undefined,
      );
      if (annotation) props.onAdd(annotation);

      setEntries((prev) => {
        const updated = prev.map<ChatEntry>((e) =>
          e.kind === "proposal" && e.id === id && e.state === "pending"
            ? { ...e, state: "confirmed", editedText }
            : e,
        );
        return [
          ...updated,
          {
            kind: "msg",
            role: "assistant",
            content: editedText
              ? `Aggiunta al bundle con la tua modifica: "${truncate(editedText)}".`
              : "Aggiunta al bundle.",
          },
        ];
      });
    },
    [entries, props],
  );

  const cancelProposal = useCallback((id: string) => {
    setEntries((prev) => {
      const updated = prev.map<ChatEntry>((e) =>
        e.kind === "proposal" && e.id === id && e.state === "pending"
          ? { ...e, state: "cancelled" }
          : e,
      );
      return [
        ...updated,
        {
          kind: "msg",
          role: "assistant",
          content: "Proposta annullata.",
        },
      ];
    });
  }, []);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-5"
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
                <StreamingBubble
                  agent="Review Editor" raw={entry.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" agent="Review Editor" state="complete">
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
          onDismiss={() => {
            setManualOpen(false);
            props.onDismissPending();
          }}
          onManual={
            manualOpen ? undefined : () => setManualOpen(true)
          }
        />
      )}
      {props.pendingTarget && manualOpen && (
        <ManualAnnotationForm
          target={props.pendingTarget}
          onCancel={() => setManualOpen(false)}
          onSave={(data) => {
            const t = props.pendingTarget!;
            const args: ProposeArgs = {
              kind: data.kind,
              page: t.page,
              selector: t.selector ?? (t.urn ? undefined : "body"),
              original: {
                text: t.currentText,
                assetSrc: t.assetSrc,
              },
              proposal: {
                text: data.proposalText,
                note: data.note,
                newAssetHint: data.newAssetHint,
              },
            };
            const a = buildAnnotation(args, props.currentUrl, props.reviewer);
            if (a) props.onAdd(a);
            setManualOpen(false);
            props.onDismissPending();
            setEntries((prev) => [
              ...prev,
              {
                kind: "msg",
                role: "assistant",
                content: "Annotazione manuale aggiunta al bundle.",
              },
            ]);
          }}
        />
      )}

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void send()}
        disabled={streaming}
        placeholder={
          props.pendingTarget
            ? "Descrivi la modifica per l'elemento selezionato…"
            : "Descrivi una modifica…"
        }
        ariaLabel="Scrivi all'agente Review Editor"
      />

    </div>
  );
}
