"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { PreviewChat } from "./PreviewChat";
import { AnnotationsList } from "./AnnotationsList";
import { ModeToggle } from "./ModeToggle";
import { MobileChatOverlay } from "@/components/shell/MobileChatOverlay";
import type { Annotation } from "@/lib/review/types";

interface Props {
  initialUrl: string;
  userEmail: string;
}

// Target di selezione inoltrato dal cms ReviewOverlay via postMessage.
// Vive in React state lato studio; la chat lo riceve come prop, lo
// mostra come chip nel composer, e lo include nel context dell'agente.
export interface SectionContext {
  outline: string;
  images: Array<{ src: string; alt: string }>;
}

export interface PendingTarget {
  urn: string | null;
  nodeKind: "text" | "image" | "section" | "page" | "gap";
  page: string;
  currentText?: string;
  assetSrc?: string;
  selector?: string;
  sectionContext?: SectionContext;
}

interface HoverRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PARENT_ORIGINS = [
  "https://staging.kyronedu.it",
  "https://kyronedu.it",
  "http://localhost:3000",
];

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "https://staging.kyronedu.it/";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `https://staging.kyronedu.it${trimmed}`;
  }
  return `https://${trimmed}`;
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return "/";
  }
}

function isCmsOrigin(origin: string): boolean {
  return PARENT_ORIGINS.includes(origin);
}

export function PreviewWorkspace({
  initialUrl,
  userEmail,
}: Props): ReactElement {
  const [url, setUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [pendingTarget, setPendingTarget] = useState<PendingTarget | null>(
    null,
  );
  const [hoverRect, setHoverRect] = useState<HoverRect | null>(null);
  const [selectionRect, setSelectionRect] = useState<HoverRect | null>(null);
  const [selectMode, setSelectMode] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentPath = useMemo(() => urlPath(url), [url]);

  function go(target?: string): void {
    const next = normalizeUrl(target ?? urlInput);
    setUrl(next);
    setUrlInput(next);
    setPendingTarget(null);
    setHoverRect(null);
    setSelectionRect(null);
  }

  const addAnnotation = useCallback((a: Annotation) => {
    setAnnotations((prev) => {
      const isDupe = prev.some(
        (x) =>
          x.kind === a.kind &&
          x.page === a.page &&
          x.proposal.text === a.proposal.text &&
          x.proposal.note === a.proposal.note,
      );
      return isDupe ? prev : [...prev, a];
    });
    setPendingTarget(null);
    setSelectionRect(null);
  }, []);

  function removeAnnotation(id: string): void {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  function clearAnnotations(): void {
    setAnnotations([]);
  }

  // Bridge postMessage: ack handshake, ricezione select/hover dal cms.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!isCmsOrigin(e.origin)) return;
      const data = e.data as
        | {
            type?: string;
            target?: PendingTarget & { sectionContext?: SectionContext };
            rect?: HoverRect;
            urn?: string | null;
          }
        | null;
      if (!data || typeof data.type !== "string") return;

      if (data.type === "kyron-rev:hello" && e.source) {
        (e.source as Window).postMessage(
          { type: "kyron-rev:ack", v: 1 },
          e.origin,
        );
        return;
      }
      if (data.type === "kyron-rev:select" && data.target) {
        setPendingTarget(data.target);
        setSelectionRect(data.rect ?? null);
        return;
      }
      if (data.type === "kyron-rev:hover") {
        setHoverRect(data.urn ? data.rect ?? null : null);
        return;
      }
      if (data.type === "kyron-rev:clear") {
        setPendingTarget(null);
        setSelectionRect(null);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const toggleMode = useCallback(() => {
    const next = !selectMode;
    setSelectMode(next);
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: "kyron-rev:mode", mode: next ? "select" : "browse" },
      "*",
    );
  }, [selectMode]);

  const dismissPending = useCallback(() => {
    setPendingTarget(null);
    setSelectionRect(null);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] h-full overflow-hidden">
      <section className="flex flex-col min-h-0 border-r border-[var(--color-line)] overflow-hidden">
        <header className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2 bg-[var(--color-paper-soft)] shrink-0">
          <p className="eyebrow shrink-0">Anteprima</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              go();
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://staging.kyronedu.it/..."
              className="flex-1 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-xs font-mono outline-none focus:border-[var(--color-ink)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--color-action)] text-[var(--color-paper)] px-4 py-1.5 text-xs font-medium hover:bg-[var(--color-action-hover)] transition-colors"
            >
              Vai
            </button>
          </form>
          <ModeToggle active={selectMode} onToggle={toggleMode} />
        </header>
        <div className="flex-1 min-h-0 bg-white relative">
          <iframe
            ref={iframeRef}
            key={url}
            src={url}
            className="w-full h-full border-0"
            title="Anteprima kyronedu.it"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {selectMode && hoverRect && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded border-2 border-[var(--color-action)]/40 bg-[var(--color-action)]/5 transition-all duration-100"
              style={{
                top: hoverRect.top,
                left: hoverRect.left,
                width: hoverRect.width,
                height: hoverRect.height,
              }}
            />
          )}
          {selectMode && selectionRect && (
            <div
              aria-hidden
              className="pointer-events-none absolute rounded border-2 border-[var(--color-action)] bg-[var(--color-action)]/10 shadow-[0_0_0_4px_rgba(0,0,0,0.04)]"
              style={{
                top: selectionRect.top,
                left: selectionRect.left,
                width: selectionRect.width,
                height: selectionRect.height,
              }}
            />
          )}
        </div>
      </section>

      {/* Desktop aside */}
      <aside className="hidden lg:flex flex-col min-h-0 h-full overflow-hidden bg-[var(--color-paper-soft)]">
        <ReviewPanel
          currentUrl={url}
          currentPath={currentPath}
          annotations={annotations}
          pendingTarget={pendingTarget}
          onDismissPending={dismissPending}
          onAdd={addAnnotation}
          onRemove={removeAnnotation}
          onClear={clearAnnotations}
          reviewer={userEmail}
        />
      </aside>

      {/* Mobile FAB + fullscreen overlay */}
      <MobileChatOverlay label="Review Editor">
        <ReviewPanel
          currentUrl={url}
          currentPath={currentPath}
          annotations={annotations}
          pendingTarget={pendingTarget}
          onDismissPending={dismissPending}
          onAdd={addAnnotation}
          onRemove={removeAnnotation}
          onClear={clearAnnotations}
          reviewer={userEmail}
        />
      </MobileChatOverlay>
    </div>
  );
}

function ReviewPanel({
  currentUrl,
  currentPath,
  annotations,
  pendingTarget,
  onDismissPending,
  onAdd,
  onRemove,
  onClear,
  reviewer,
}: {
  currentUrl: string;
  currentPath: string;
  annotations: Annotation[];
  pendingTarget: PendingTarget | null;
  onDismissPending: () => void;
  onAdd: (a: Annotation) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  reviewer: string;
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="border-b border-[var(--color-line)] px-5 py-3 shrink-0">
        <p className="eyebrow">Agente · Review Editor</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-1 font-mono truncate">
          {currentPath}
        </p>
      </header>
      <div className="flex-1 min-h-0 flex flex-col">
        <PreviewChat
          currentUrl={currentUrl}
          currentPath={currentPath}
          annotationsCount={annotations.length}
          pendingTarget={pendingTarget}
          onDismissPending={onDismissPending}
          onAdd={onAdd}
          reviewer={reviewer}
          onSendRequest={() => {}}
        />
      </div>
      <AnnotationsList
        annotations={annotations}
        onRemove={onRemove}
        onClear={onClear}
        site={currentUrl}
      />
    </div>
  );
}
