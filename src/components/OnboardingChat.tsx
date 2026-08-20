"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ChatBubble } from "@/components/ui";
import { streamOnboardChat, type ChatMessage } from "@/lib/chat-runtime";
import { MarkdownContent, StreamingBubble, processContent } from "./chat/chat-ui";
import { GenerativeRenderer } from "./chat/generative/registry";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
  type GenerativeSubmission,
} from "./chat/generative/types";

import { ChatComposer } from "@/components/chat/ChatComposer";
const INITIAL_GREETING =
  "Ciao. Iniziamo l'onboarding di una nuova scuola. Come si chiama la scuola?";

interface UiBlock {
  descriptor: GenerativeDescriptor;
  submission: GenerativeSubmission | null;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  ui?: UiBlock;
}

export function OnboardingChat(): ReactElement {
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: INITIAL_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function runAgent(history: ChatTurn[]): Promise<void> {
    setStreaming(true);
    const wireMessages: ChatMessage[] = history.map((t) => ({
      role: t.role,
      content: t.content,
    }));
    let assistantBuffer = "";
    let pendingUi: UiBlock | null = null;

    // appendi bolla assistente vuota
    setTurns([...history, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamOnboardChat({ messages: wireMessages })) {
        if (ev.type === "delta") {
          assistantBuffer += ev.delta;
          setTurns([
            ...history,
            { role: "assistant", content: assistantBuffer, ui: pendingUi ?? undefined },
          ]);
        } else if (ev.type === "tool-result") {
          const descriptor = extractGenerativeDescriptor(ev.result);
          if (descriptor) {
            pendingUi = { descriptor, submission: null };
            setTurns([
              ...history,
              {
                role: "assistant",
                content: assistantBuffer,
                ui: pendingUi,
              },
            ]);
          }
        } else if (ev.type === "error") {
          assistantBuffer += `\n\n_[errore: ${ev.error}]_`;
          setTurns([
            ...history,
            { role: "assistant", content: assistantBuffer, ui: pendingUi ?? undefined },
          ]);
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  async function send(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: trimmed }];
    setInput("");
    await runAgent(next);
  }

  async function handleGenerativeSubmit(
    turnIndex: number,
    submission: GenerativeSubmission,
  ): Promise<void> {
    // freeze il componente con la submission, poi invia messaggio strutturato
    const frozen: ChatTurn[] = turns.map((t, i) =>
      i === turnIndex && t.ui
        ? { ...t, ui: { ...t.ui, submission } }
        : t,
    );

    const wireContent = JSON.stringify({
      kind: "generative_submission",
      component: submission.component,
      id: submission.id,
      data: submission.data,
    });

    const next: ChatTurn[] = [
      ...frozen,
      { role: "user", content: wireContent },
    ];
    await runAgent(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 min-h-[400px]">
        {turns.map((m, i) => {
          const isLastAssistant =
            m.role === "assistant" && i === turns.length - 1;

          if (m.role === "user") {
            return (
              <ChatBubble key={i} role="user" state="complete">
                {renderUserContent(m.content)}
              </ChatBubble>
            );
          }

          // Renderizza il testo: la StreamingBubble gestisce internamente lo
          // stato "thinking" quando il content e' ancora vuoto e isStreaming=true.
          // Per i turn vecchi (non last) con content vuoto (es. turn che ha
          // emesso solo tool call senza testo) skippiamo la bolla.
          const showText = isLastAssistant || m.content.length > 0;
          const textPart = showText
            ? (isLastAssistant ? (
                <StreamingBubble
                  agent="Onboarding Scuole"
                  raw={m.content}
                  isStreaming={streaming}
                />
              ) : (
                <ChatBubble role="assistant" agent="Onboarding Scuole" state="complete">
                  <MarkdownContent content={processContent(m.content).text} />
                </ChatBubble>
              ))
            : null;

          return (
            <div key={i} className="flex flex-col gap-3">
              {textPart}
              {m.ui ? (
                <GenerativeRenderer
                  descriptor={m.ui.descriptor}
                  initialSubmission={m.ui.submission}
                  readOnly={Boolean(m.ui.submission)}
                  disabled={streaming}
                  onSubmit={(sub) => void handleGenerativeSubmit(i, sub)}
                />
              ) : null}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => void send()}
        disabled={streaming}
        placeholder="Scrivi una risposta…"
        ariaLabel="Scrivi all'assistente di onboarding scuola"
        className="px-0"
        hint={
          <>
            L&apos;agente può sbagliare. Verifica sempre i dati raccolti prima
            di approvare la PendingSchool.
          </>
        }
      />

    </div>
  );
}

function renderUserContent(raw: string): string {
  // se il messaggio user e' una submission strutturata, mostra un riepilogo
  // umano invece del JSON crudo.
  try {
    type Row = { slug: string; capacitySlug?: string };
    const parsed = JSON.parse(raw) as {
      kind?: string;
      component?: string;
      data?: {
        selections?: Row[];
        name?: string;
        priceEur?: number;
        components?: Row[];
      };
    };
    // Etichetta leggibile di una riga: slug o "slug (128gb)" per i tagli.
    const label = (r: Row): string =>
      r.capacitySlug ? `${r.slug} (${r.capacitySlug})` : r.slug;
    if (parsed.kind === "generative_submission") {
      if (parsed.component === "ProductPicker") {
        const rows = parsed.data?.selections ?? [];
        return rows.length === 0
          ? "(nessun prodotto selezionato)"
          : `Selezionati ${rows.length} prodotti: ${rows.map(label).join(", ")}`;
      }
      if (parsed.component === "BundleBuilder") {
        const name = parsed.data?.name ?? "(senza nome)";
        const price = parsed.data?.priceEur ?? 0;
        const comps = parsed.data?.components ?? [];
        return `Kit "${name}" a ${price.toFixed(2)} EUR (${comps.length} componenti: ${comps.map(label).join(", ")})`;
      }
      return `Submission ${parsed.component ?? "?"}`;
    }
  } catch {
    // non e' JSON, falla passare
  }
  return raw;
}
