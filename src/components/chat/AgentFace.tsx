"use client";

// La faccia di un agente, con gli occhi che seguono il mouse.
//
// `AgentAvatar` del core rende un `<img>` statico: dentro un'immagine il CSS
// della pagina non entra, quindi gli occhi non si possono muovere. Qui usiamo
// blobatar in modo animato (SVG inline, `<g class="mo-eyes">` raggiungibile) e
// spostiamo lo sguardo scrivendo due variabili CSS sull'elemento.
import { useEffect, useRef, type ReactElement, type RefObject } from "react";
import { Blobatar } from "@blobatar/react";
import { agentHue } from "@studiofuturo/studio-core";
import "blobatar/motion.css";

// Tone bloccato: senza lock alcuni nomi escono quasi neri (gotcha del core).
const AVATAR_TONE = 0.45;

// Un solo listener per tutta la pagina: in chat gli avatar sono decine.
const faces = new Set<SVGSVGElement>();
let frame = 0;
let px = 0;
let py = 0;

/** -1..1 quanto il mouse sta a destra/sotto rispetto al centro della faccia. */
function aim(): void {
  frame = 0;
  for (const el of faces) {
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    // Diviso 6 raggi: oltre un paio di schermi di distanza lo sguardo e' fermo
    // al massimo, sotto sembra che l'occhio scatti.
    const x = (px - (r.left + r.width / 2)) / (r.width * 3);
    const y = (py - (r.top + r.height / 2)) / (r.height * 3);
    el.style.setProperty("--gaze-x", String(Math.max(-1, Math.min(1, x))));
    el.style.setProperty("--gaze-y", String(Math.max(-1, Math.min(1, y))));
  }
}

function onMove(ev: PointerEvent): void {
  px = ev.clientX;
  py = ev.clientY;
  if (!frame) frame = requestAnimationFrame(aim);
}

/** Registra la faccia nel gruppo che segue il puntatore. */
function useGaze(enabled: boolean): RefObject<SVGSVGElement | null> {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    faces.add(el);
    if (faces.size === 1) window.addEventListener("pointermove", onMove);
    return () => {
      faces.delete(el);
      if (faces.size === 0) window.removeEventListener("pointermove", onMove);
    };
  }, [enabled]);
  return ref;
}

export function AgentFace({
  /** Seed del blob: l'id dell'agente, non l'etichetta (l'etichetta cambia). */
  seed,
  label,
  size = 36,
  className = "",
  gaze = false,
}: {
  seed: string;
  label?: string;
  size?: number;
  className?: string;
  /** Solo la faccia in testata segue il mouse: le altre restano ferme. */
  gaze?: boolean;
}): ReactElement {
  const ref = useGaze(gaze);
  return (
    <Blobatar
      ref={ref}
      name={seed}
      hue={agentHue(seed)}
      tone={AVATAR_TONE}
      size={size}
      title={label ?? seed}
      animate={gaze ? "always" : undefined}
      className={`${gaze ? "agent-gaze" : "agent-still"} shrink-0 ${className}`}
    />
  );
}
