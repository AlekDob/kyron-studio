"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ChatBubble } from "@/components/ui";
import { streamOnboardChat, type ChatMessage } from "@/lib/chat-runtime";
import {
  MarkdownContent,
  StreamingBubble,
  processContent,
} from "@/components/chat/chat-ui";
import {
  extractGenerativeDescriptor,
  type GenerativeDescriptor,
  type GenerativeSubmission,
} from "@/components/chat/generative/types";
import { GenerativeRenderer } from "@/components/chat/generative/registry";
import type { PortalDraft } from "./PortalsWorkspace";
import type { PortalDetail } from "@/lib/gateway";

interface Props {
  onDraftUpdate: (updater: (prev: PortalDraft) => PortalDraft) => void;
  onStartCreating: () => void;
  onViewPortal: (portal: PortalDetail) => void;
}

interface UiBlock {
  descriptor: GenerativeDescriptor;
  submission?: GenerativeSubmission;
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  ui?: UiBlock;
}

const GREETING =
  "Ciao! Posso creare un nuovo portale scuola o mostrarti quelli esistenti. Da dove partiamo?";

export function PortalsChat({
  onDraftUpdate,
  onStartCreating,
  onViewPortal,
}: Props): ReactElement {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [turns, streaming, toolStatus]);

  function extractDraftFromToolArgs(
    tool: string,
    args: unknown,
  ): void {
    const a = (args ?? {}) as Record<string, unknown>;
    if (tool === "check_slug_availability" && a.slug) {
      onDraftUpdate((d) => ({ ...d, slug: String(a.slug) }));
    }
    if (tool === "validate_school_data") {
      onDraftUpdate((d) => ({
        ...d,
        slug: a.slug ? String(a.slug) : d.slug,
        provincia: a.countryArea ? String(a.countryArea) : d.provincia,
        codiceMeccanografico: a.codiceMeccanografico
          ? String(a.codiceMeccanografico)
          : d.codiceMeccanografico,
        sitoUfficiale: a.sitoUfficiale
          ? String(a.sitoUfficiale)
          : d.sitoUfficiale,
      }));
    }
    if (tool === "save_pending_school") {
      const addr = a.schoolAddress as Record<string, string> | undefined;
      onDraftUpdate((d) => ({
        ...d,
        nome: a.nome ? String(a.nome) : d.nome,
        slug: a.slug ? String(a.slug) : d.slug,
        sitoUfficiale: a.sitoUfficiale
          ? String(a.sitoUfficiale)
          : d.sitoUfficiale,
        codiceMeccanografico: a.codiceMeccanografico
          ? String(a.codiceMeccanografico)
          : d.codiceMeccanografico,
        via: addr?.streetAddress1 ?? d.via,
        cap: addr?.postalCode ?? d.cap,
        city: addr?.city ?? d.city,
        provincia: addr?.countryArea ?? d.provincia,
        shipToSchool:
          typeof a.shipToSchool === "boolean"
            ? a.shipToSchool
            : d.shipToSchool,
      }));
    }
  }

  function extractDraftFromToolResult(
    tool: string,
    result: unknown,
  ): void {
    if (tool === "save_pending_school") {
      onDraftUpdate((d) => ({ ...d, saved: true }));
    }
    if (tool === "get_portal" && result) {
      const r = result as Record<string, unknown>;
      if (r.portal) {
        onViewPortal(r.portal as PortalDetail);
      }
    }
  }

  function extractDraftFromSubmission(sub: GenerativeSubmission): void {
    const data = sub.data as Record<string, unknown>;
    if (data.selectedSlugs) {
      onDraftUpdate((d) => ({
        ...d,
        selectedProducts: data.selectedSlugs as string[],
      }));
    }
    if (data.name && data.priceEur != null) {
      const bundle = {
        name: String(data.name),
        priceEur: Number(data.priceEur),
        components: (data.components as string[]) ?? [],
      };
      onDraftUpdate((d) => ({
        ...d,
        bundles: [...(d.bundles ?? []), bundle],
      }));
    }
    if (typeof data.uploaded === "boolean") {
      onDraftUpdate((d) => ({
        ...d,
        logoUploaded: data.uploaded as boolean,
        logoFilename: data.uploaded ? String(data.filename) : undefined,
      }));
    }
  }

  const creatingTriggeredRef = useRef(false);

  function extractDraftFromAssistantText(text: string): void {
    const lower = text.toLowerCase();

    if (
      !creatingTriggeredRef.current &&
      (lower.includes("nome ufficiale") ||
        lower.includes("nome della scuola") ||
        lower.includes("come si chiama") ||
        lower.includes("iniziamo") ||
        lower.includes("onboarding"))
    ) {
      creatingTriggeredRef.current = true;
      onStartCreating();
    }

    const nameMatch = text.match(
      /(?:confermare che (?:è|e')|confermare.*?"([^"]+)"|il nome.*?"([^"]+)"|scuola.*?"([^"]+)")/i,
    );
    if (nameMatch) {
      const name = nameMatch[1] ?? nameMatch[2] ?? nameMatch[3];
      if (name) onDraftUpdate((d) => (d.nome ? d : { ...d, nome: name.trim() }));
    }

    const addrMatch = text.match(
      /(?:indirizzo|l'indirizzo)[^:]*?:\s*([^,]+),\s*(\d{5})\s+([A-Za-zÀ-ú\s]+?)\s*\((\w{2})\)/i,
    );
    if (addrMatch) {
      onDraftUpdate((d) => ({
        ...d,
        via: addrMatch[1].trim(),
        cap: addrMatch[2],
        city: addrMatch[3].trim(),
        provincia: addrMatch[4].toUpperCase(),
      }));
    }

    if (lower.includes("senza il sito") || lower.includes("proceder") && lower.includes("sito")) {
      onDraftUpdate((d) => d.sitoUfficiale ? d : { ...d, sitoUfficiale: "TBD" });
    }
  }

  const rafRef = useRef(0);

  async function runStream(msgs: ChatMessage[], next: ChatTurn[]): Promise<void> {
    let buf = "";
    let pendingUi: UiBlock | undefined;
    setTurns([...next, { role: "assistant", content: "" }]);

    try {
      for await (const ev of streamOnboardChat({ messages: msgs })) {
        if (ev.type === "delta") {
          buf += ev.delta;
          cancelAnimationFrame(rafRef.current);
          const snap = buf;
          const uiSnap = pendingUi;
          rafRef.current = requestAnimationFrame(() => {
            extractDraftFromAssistantText(snap);
            setTurns([
              ...next,
              { role: "assistant", content: snap, ui: uiSnap },
            ]);
          });
        } else if (ev.type === "tool") {
          setToolStatus(`\`${ev.tool}\`...`);
          extractDraftFromToolArgs(ev.tool, ev.args);
        } else if (ev.type === "tool-result") {
          setToolStatus(null);
          extractDraftFromToolResult(ev.tool, ev.result);
          const desc = extractGenerativeDescriptor(ev.result);
          if (desc) {
            pendingUi = { descriptor: desc };
            setTurns([
              ...next,
              { role: "assistant", content: buf, ui: pendingUi },
            ]);
          }
        } else if (ev.type === "error") {
          buf += `\n\n_[errore: ${ev.error}]_`;
          setTurns([...next, { role: "assistant", content: buf }]);
        }
      }
    } finally {
      cancelAnimationFrame(rafRef.current);
      setStreaming(false);
      setToolStatus(null);
      if (buf) {
        extractDraftFromAssistantText(buf);
        setTurns([
          ...next,
          { role: "assistant", content: buf, ui: pendingUi },
        ]);
      }
    }
  }

  async function send(text?: string): Promise<void> {
    const trimmed = (text ?? input).trim();
    if (!trimmed || streaming) return;
    if (!text) setInput("");

    const next: ChatTurn[] = [
      ...turns,
      { role: "user", content: trimmed },
    ];
    setTurns(next);
    setStreaming(true);

    const msgs = next.map((t) => ({ role: t.role, content: t.content }));
    await runStream(msgs, next);
  }

  function handleGenerativeSubmit(
    turnIdx: number,
    submission: GenerativeSubmission,
  ): void {
    extractDraftFromSubmission(submission);

    const updated = turns.map((t, i) =>
      i === turnIdx && t.ui ? { ...t, ui: { ...t.ui, submission } } : t,
    );

    const payload = JSON.stringify({
      kind: "generative_submission",
      component: turns[turnIdx]?.ui?.descriptor.component,
      data: submission.data,
    });

    const next: ChatTurn[] = [
      ...updated,
      { role: "user" as const, content: payload },
    ];
    setTurns(next);

    setStreaming(true);
    const msgs = next.map((t) => ({ role: t.role, content: t.content }));
    void runStream(msgs, next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3"
      >
        {turns.map((t, i) => {
          const isLastAssistant =
            t.role === "assistant" && i === turns.length - 1;
          const align = t.role === "user" ? "justify-end" : "justify-start";
          const isGenSubmission =
            t.role === "user" && t.content.startsWith('{"kind"');

          return (
            <div key={i} className={`flex flex-col ${align} gap-2`}>
              {t.role === "user" ? (
                <div className="flex justify-end">
                  <ChatBubble role="user" state="complete">
                    {isGenSubmission
                      ? renderUserContent(t.content)
                      : t.content}
                  </ChatBubble>
                </div>
              ) : isLastAssistant ? (
                <StreamingBubble raw={t.content} isStreaming={streaming} />
              ) : (
                <ChatBubble role="assistant" state="complete">
                  <MarkdownContent content={processContent(t.content).text} />
                </ChatBubble>
              )}
              {t.ui ? (
                <GenerativeRenderer
                  descriptor={t.ui.descriptor}
                  readOnly={!!t.ui.submission}
                  disabled={streaming}
                  initialSubmission={t.ui.submission}
                  onSubmit={(sub) => handleGenerativeSubmit(i, sub)}
                />
              ) : null}
            </div>
          );
        })}
        {toolStatus && (
          <p className="text-xs text-[var(--color-ink-muted)] italic px-2">
            {toolStatus}
          </p>
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
            placeholder="Chiedi all'agente..."
            disabled={streaming}
            aria-label="Scrivi all'agente Portali"
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

function renderUserContent(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      data?: { selectedSlugs?: string[]; name?: string; priceEur?: number };
    };
    if (parsed.data?.selectedSlugs) {
      return `Selezionati ${parsed.data.selectedSlugs.length} prodotti`;
    }
    if (parsed.data?.name) {
      return `Kit "${parsed.data.name}" a ${parsed.data.priceEur} EUR`;
    }
    const d = parsed.data as Record<string, unknown> | undefined;
    if (typeof d?.uploaded === "boolean") {
      return d.uploaded ? "Logo caricato" : "Logo saltato";
    }
  } catch {
    // fallback
  }
  return "Dati inviati";
}
