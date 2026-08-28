"use client";

// Chat a canale come nello Studio GGS: header "#nome", righe piatte, chip dei
// tool e suggerimenti all'apertura. Il loop di streaming viene dal core, il
// layout sta qui perche' e' la faccia dello Studio Kyron.
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useAgentStream, type ChatStreamEvent } from "@studiofuturo/studio-core";
import { AgentFace } from "@/components/chat/AgentFace";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChannelMessage } from "@/components/chat/ChannelMessage";
import { ChannelHeader } from "@/components/chat/ChannelHeader";
import { describeSubmission } from "@/components/chat/submission-label";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
  type GenerativeSubmission,
} from "@/components/chat/generative/types";
import { agentNameOf } from "@/components/shell/modules";

interface Props {
  /** Id del modulo agente: seed dell'avatar e fonte del nome. */
  agentId: string;
  /** Proxy SSE, es. "/api/agent/stats". */
  endpoint: string;
  /** Cosa sa fare, mostrato a canale vuoto. */
  intro: string;
  /** Prime domande pronte da cliccare. */
  suggestions: string[];
  toolLabels?: Record<string, string>;
  /** Per i pannelli laterali che seguono i tool result. */
  onEvent?: (ev: ChatStreamEvent) => void;
  /** Campi extra nel body a ogni turno (contesto di pagina, selezione). */
  extraBody?: () => Record<string, unknown>;
  /**
   * Le card generative accettano input (uploader, picker) e rimandano i dati
   * all'agente. Senza questo sono di sola lettura, come per Ada e Bruno.
   */
  interactive?: boolean;
  /** Effetti collaterali di una card inviata (es. il draft del portale). */
  onSubmission?: (submission: GenerativeSubmission) => void;
  /** Primo messaggio mandato da solo all'apertura (deep link da un altro modulo). */
  initialPrompt?: string;
  /** Riga sopra il composer: contesto o azione della pagina. */
  aboveComposer?: ReactNode;
  /** Card che vivono nel pannello laterale e non vanno ripetute in chat. */
  hideCards?: string[];
  /**
   * Contesto della UI (es. prodotto selezionato nel pannello) appeso al
   * messaggio in USCITA e non alla bolla: l'agente sa di cosa stiamo parlando
   * senza che l'utente riscriva SKU e prezzi, e senza un tool in piu'.
   */
  selectionContext?: () => string | null;
  /** Dentro una bottom sheet la testata la disegna gia' il DrawerHeader. */
  hideHeader?: boolean;
}

export function AgentChannel({
  agentId,
  endpoint,
  intro,
  suggestions,
  toolLabels = {},
  onEvent,
  extraBody,
  interactive = false,
  onSubmission,
  initialPrompt,
  aboveComposer,
  hideCards,
  selectionContext,
  hideHeader = false,
}: Props): ReactElement {
  const name = agentNameOf(agentId);
  const channel = name.toLowerCase();
  const [input, setInput] = useState("");
  const [sent, setSent] = useState<Record<string, GenerativeSubmission>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  // Il testo che vede l'utente e quello che riceve l'agente divergono solo
  // quando si invia una card: il JSON aspetta qui il turno successivo.
  const payloadRef = useRef<string | null>(null);
  const { messages, busy, send } = useAgentStream({
    endpoint,
    onEvent,
    extraBody,
    errorPrefix: "Errore",
    toUi: ({ result }) => {
      const d = extractGenerativeDescriptor(result);
      return d && hideCards?.includes(d.component) ? null : d;
    },
    toApiContent: (text) => {
      const payload = payloadRef.current;
      payloadRef.current = null;
      if (payload) return payload;
      const ctx = selectionContext?.();
      return ctx ? `${text}\n\n[Contesto UI: ${ctx}]` : text;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const started = useRef(false);
  useEffect(() => {
    if (!initialPrompt || started.current) return;
    started.current = true;
    void send(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  function submit(text: string): void {
    if (!text.trim() || busy) return;
    setInput("");
    void send(text);
  }

  function submitCard(d: GenerativeDescriptor, sub: GenerativeSubmission): void {
    if (busy) return;
    onSubmission?.(sub);
    setSent((prev) => ({ ...prev, [d.id]: sub }));
    payloadRef.current = JSON.stringify({
      kind: "generative_submission",
      component: d.component,
      data: sub.data,
    });
    void send(describeSubmission(sub));
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--color-paper)]">
      {!hideHeader && <ChannelHeader agentId={agentId} name={name} />}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:px-3">
        <div className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ChannelIntro
              agentId={agentId}
              name={name}
              channel={channel}
              intro={intro}
              suggestions={suggestions}
              disabled={busy}
              onPick={submit}
            />
          ) : (
            messages.map((m, i) => (
              <ChannelMessage
                key={m.id}
                message={m}
                agentId={agentId}
                agentName={name}
                userLabel="Tu"
                showAuthor={messages[i - 1]?.role !== m.role}
                toolLabels={toolLabels}
                busy={busy}
                sent={sent}
                onSubmitCard={interactive ? submitCard : undefined}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {aboveComposer}

      <ChatComposer
        value={input}
        onChange={setInput}
        onSubmit={() => submit(input)}
        disabled={busy}
        placeholder={`Messaggio #${channel}`}
        ariaLabel={`Scrivi a ${name}`}
      />
    </div>
  );
}

function ChannelIntro({
  agentId,
  name,
  channel,
  intro,
  suggestions,
  disabled,
  onPick,
}: {
  agentId: string;
  name: string;
  channel: string;
  intro: string;
  suggestions: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}): ReactElement {
  return (
    <div className="flex flex-col items-start gap-5 px-3 py-10 sm:px-4">
      <div className="flex items-center gap-4">
        {/* Card di apertura: la faccia grande guarda il mouse. Le facce delle
           bolle no: sono decine e muoverle tutte fa rumore. */}
        <AgentFace seed={agentId} label={name} size={64} gaze />
        <div className="min-w-0">
          <p className="text-base font-semibold text-[var(--color-ink)]">#{channel}</p>
          <p className="mt-1.5 text-[15px] leading-snug text-[var(--color-ink-muted)]">
            {intro}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2 text-sm text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--studio-hover-surface)] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
