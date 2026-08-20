"use client";

// Chat del modulo Agevolazioni. Come ChecksChat, ma i componenti generativi
// sono INTERATTIVI: l'uploader rimanda gli id dei documenti all'agente
// (protocollo generative_submission, come l'onboarding portali).
import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChatBubble } from "@/components/ui";
import { streamVatRelief, type ChatMessage } from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";
import { ChatComposer } from "@/components/chat/ChatComposer";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
  type GenerativeSubmission,
} from "@/components/chat/generative/types";
import { GenerativeRenderer } from "@/components/chat/generative/registry";
import type { OrderRow } from "@/lib/gateway";

interface Props {
  // Notifica al workspace l'ordine in lavorazione, per il pannello destro.
  onCase: (order: OrderRow) => void;
  initialOrderNumber?: string;
}

interface UiBlock {
  descriptor: GenerativeDescriptor;
  submission?: GenerativeSubmission;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  uis?: UiBlock[];
}

const GREETING =
  "Carica i documenti 104 che ti hanno inviato e li controllo: ti dico se il fascicolo e' completo o cosa manca. Se mi dai il numero d'ordine confronto anche intestatario e prodotti.";

export function VatReliefChat({ onCase, initialOrderNumber }: Props): ReactElement {
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const kickedOff = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming, toolStatus]);

  // Deep link da Ordini: parte gia' con la pratica in contesto.
  useEffect(() => {
    if (!initialOrderNumber || kickedOff.current) return;
    kickedOff.current = true;
    void send(`Controlliamo la richiesta IVA agevolata dell'ordine ${initialOrderNumber}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderNumber]);

  async function runStream(msgs: ChatMessage[], next: ChatTurn[]): Promise<void> {
    let buf = "";
    const uis: UiBlock[] = [];
    setTurns([...next, { role: "assistant", content: "" }]);
    try {
      for await (const ev of streamVatRelief({ messages: msgs })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          cancelAnimationFrame(rafRef.current);
          const snap = buf;
          const uiSnap = [...uis];
          rafRef.current = requestAnimationFrame(() => {
            setTurns([...next, { role: "assistant", content: snap, uis: uiSnap }]);
          });
        } else if (ev.type === "tool") {
          setToolStatus("lettura documenti in corso...");
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
          const r = ev.result as { _ui?: { component?: string; props?: { order?: OrderRow } } };
          if (r?._ui?.component === "VatReliefCase" && r._ui.props?.order) {
            onCase(r._ui.props.order);
          }
          const desc = extractGenerativeDescriptor(ev.result);
          // La scheda ordine vive nel pannello destro, non in chat.
          if (desc && desc.component !== "VatReliefCase") {
            uis.push({ descriptor: desc });
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

  // L'uploader ha confermato: manda gli id all'agente come messaggio strutturato
  // e mostra all'utente un riepilogo leggibile.
  async function handleSubmit(
    turnIdx: number,
    uiIdx: number,
    submission: GenerativeSubmission,
  ): Promise<void> {
    if (streaming) return;
    const frozen = turns.map((t, i) =>
      i === turnIdx
        ? { ...t, uis: t.uis?.map((u, j) => (j === uiIdx ? { ...u, submission } : u)) }
        : t,
    );
    const data = submission.data as { names?: string[]; orderNumber?: string | null };
    const human = `Ho caricato ${data.names?.length ?? 0} documento/i${
      data.orderNumber ? ` per l'ordine ${data.orderNumber}` : ""
    }: ${(data.names ?? []).join(", ")}`;

    const payload = JSON.stringify({
      kind: "generative_submission",
      component: submission.component,
      data: submission.data,
    });

    const next: ChatTurn[] = [...frozen, { role: "user", content: human }];
    setTurns(next);
    setStreaming(true);
    // All'agente mando il JSON, all'utente resta la frase leggibile.
    const msgs: ChatMessage[] = next.map((t, i) => ({
      role: t.role,
      content: i === next.length - 1 ? payload : t.content,
    }));
    await runStream(msgs, next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 min-h-0 space-y-5 overflow-y-auto px-5 py-5">
        {turns.map((t, i) => {
          const isLastAssistant = t.role === "assistant" && i === turns.length - 1;
          return (
            <div key={i} className="flex flex-col gap-2">
              {t.role === "user" ? (
                <div className="flex justify-end">
                  <ChatBubble role="user" state="complete">
                    {t.content}
                  </ChatBubble>
                </div>
              ) : isLastAssistant ? (
                <StreamingBubble
                  agent="Agevolazioni" raw={t.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" agent="Agevolazioni" state="complete">
                  <MarkdownContent content={processContent(t.content).text} />
                </ChatBubble>
              )}
              {t.uis?.map((u, j) => (
                <GenerativeRenderer
                  key={u.descriptor.id ?? j}
                  descriptor={u.descriptor}
                  readOnly={Boolean(u.submission)}
                  initialSubmission={u.submission ?? null}
                  disabled={streaming}
                  onSubmit={(sub) => void handleSubmit(i, j, sub)}
                />
              ))}
            </div>
          );
        })}
        {toolStatus && (
          <p className="px-2 text-xs italic text-[var(--color-ink-muted)]">{toolStatus}</p>
        )}
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void send()}
        disabled={streaming}
        placeholder="Es. controlla i documenti dell'ordine 326"
        ariaLabel="Scrivi all'agente Agevolazioni"
      />

    </div>
  );
}
