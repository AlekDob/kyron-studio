"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  streamReviewEditor,
  type ChatMessage,
} from "@/lib/chat-runtime";
import { ChannelMessage } from "@/components/chat/ChannelMessage";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { CHANNELS } from "@/components/chat/agent-channels";
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
import { agentNameOf } from "@/components/shell/modules";

// Nome proprio dell'agente: unica fonte il registry dei moduli.
const AGENT = agentNameOf("preview");

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
      /** Ora mostrata nella riga del canale. */
      at: number;
    }
  | (ProposalEntry & { kind: "proposal" });

/** Le righe del canale vogliono un'ora: un solo punto dove metterla. */
function msg(
  role: "user" | "assistant" | "system",
  content: string,
): Extract<ChatEntry, { kind: "msg" }> {
  return { kind: "msg", role, content, at: Date.now() };
}

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
  `Sono ${AGENT}. Clicca un elemento nell'anteprima a sinistra per selezionarlo, poi descrivimi la modifica. Io strutturo la proposta, tu confermi qui in chat, e poi inviamo tutto via email.`;

export function PreviewChat(props: Props): ReactElement {
  const [entries, setEntries] = useState<ChatEntry[]>([
    msg("assistant", INTRO_MESSAGE),
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
      setEntries([...seed, msg("assistant", "")]);

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
              msg("assistant", buf),
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
                  ? [...working, msg("assistant", buf)]
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
              setEntries([...working, msg("assistant", buf)]);
            } else if (ev.tool === "request_send_bundle") {
              props.onSendRequest();
            }
          } else if (ev.type === "tool-result") {
            setToolStatus(null);
          } else if (ev.type === "error") {
            buf += `\n\n_[errore: ${ev.error}]_`;
            setEntries([
              ...working,
              msg("assistant", buf),
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
      msg("user", trimmed),
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
          msg(
            "assistant",
            editedText
              ? `Aggiunta al bundle con la tua modifica: "${truncate(editedText)}".`
              : "Aggiunta al bundle.",
          ),
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
        msg("assistant", "Proposta annullata."),
      ];
    });
  }, []);

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3"
      >
        {entries.map((entry, i) => {
          if (entry.kind === "proposal") {
            return (
              <div key={entry.id} className="px-2 py-2">
                <ProposalCard
                  proposal={entry}
                  disabled={streaming}
                  onConfirm={(text) => void confirmProposal(entry.id, text)}
                  onCancel={() => void cancelProposal(entry.id)}
                />
              </div>
            );
          }
          const prev = entries[i - 1];
          return (
            <ChannelMessage
              key={i}
              message={{
                id: String(i),
                role: entry.role === "user" ? "user" : "assistant",
                content: entry.content,
                at: entry.at,
              }}
              agentId="preview"
              agentName={AGENT}
              userLabel="Tu"
              showAuthor={prev?.kind !== "msg" || prev.role !== entry.role}
              toolLabels={CHANNELS.preview.toolLabels}
              busy={streaming && i === entries.length - 1}
            />
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
              msg("assistant", "Annotazione manuale aggiunta al bundle."),
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
            : `Messaggio #${AGENT.toLowerCase()}`
        }
        ariaLabel="Scrivi all'agente Review Editor"
      />

    </div>
  );
}
