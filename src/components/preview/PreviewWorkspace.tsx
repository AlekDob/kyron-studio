"use client";

import { useState, useMemo, type ReactElement } from "react";
import { PreviewChat } from "./PreviewChat";
import { AnnotationsList } from "./AnnotationsList";
import type { Annotation } from "@/lib/review/types";

interface Props {
  initialUrl: string;
  userEmail: string;
}

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

export function PreviewWorkspace({
  initialUrl,
  userEmail,
}: Props): ReactElement {
  const [url, setUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const currentPath = useMemo(() => urlPath(url), [url]);

  function go(target?: string): void {
    const next = normalizeUrl(target ?? urlInput);
    setUrl(next);
    setUrlInput(next);
  }

  function addAnnotation(a: Annotation): void {
    setAnnotations((prev) => [...prev, a]);
  }

  function removeAnnotation(id: string): void {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }

  function clearAnnotations(): void {
    setAnnotations([]);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] h-screen overflow-hidden">
      <section className="flex flex-col min-h-0 border-r border-[var(--color-line)]">
        <header className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2 bg-[var(--color-paper-soft)]">
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
        </header>
        <div className="flex-1 min-h-0 bg-white">
          <iframe
            key={url}
            src={url}
            className="w-full h-full border-0"
            title="Anteprima kyronedu.it"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <aside className="flex flex-col min-h-0 h-screen overflow-hidden bg-[var(--color-paper-soft)]">
        <header className="border-b border-[var(--color-line)] px-5 py-3">
          <p className="eyebrow">Agente · Review Editor</p>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 font-mono truncate">
            {currentPath}
          </p>
        </header>

        <div className="flex-1 min-h-0 flex flex-col">
          <PreviewChat
            currentUrl={url}
            currentPath={currentPath}
            annotationsCount={annotations.length}
            onAdd={addAnnotation}
            reviewer={userEmail}
            onSendRequest={() => {
              /* triggered when agent asks; UI shows button in AnnotationsList */
            }}
          />
        </div>

        <AnnotationsList
          annotations={annotations}
          onRemove={removeAnnotation}
          onClear={clearAnnotations}
          site={url}
        />
      </aside>
    </div>
  );
}
