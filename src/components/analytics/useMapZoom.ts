import { useEffect, useRef, useState, type PointerEvent } from "react";

// Pan/zoom per SVG con viewBox fisso: wheel (desktop), drag (pan),
// pinch a due dita (mobile) e zoom programmatico per i pulsanti +/-.
// Trasformazione applicata a un <g>: translate(x,y) scale(k).

export interface MapTransform {
  k: number;
  x: number;
  y: number;
}

const MIN_K = 1;
const MAX_K = 14;
const IDENTITY: MapTransform = { k: 1, x: 0, y: 0 };

function zoomAt(t: MapTransform, px: number, py: number, factor: number): MapTransform {
  const k = Math.min(Math.max(t.k * factor, MIN_K), MAX_K);
  if (k === 1) return IDENTITY;
  const ratio = k / t.k;
  return { k, x: px - (px - t.x) * ratio, y: py - (py - t.y) * ratio };
}

export function useMapZoom(viewW: number, viewH: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [t, setT] = useState<MapTransform>(IDENTITY);
  // Pointer attivi (pan a 1 dito, pinch a 2) — ref: niente re-render sul move.
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  // Converte coordinate client -> coordinate viewBox.
  function toViewBox(clientX: number, clientY: number): [number, number] {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return [0, 0];
    return [
      ((clientX - rect.left) / rect.width) * viewW,
      ((clientY - rect.top) / rect.height) * viewH,
    ];
  }

  // Wheel via listener nativo non-passive: React non garantisce il
  // preventDefault (senza, zoomare scrolla la pagina).
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const [px, py] = toViewBox(e.clientX, e.clientY);
      setT((prev) => zoomAt(prev, px, py, Math.exp(-e.deltaY * 0.0018)));
    }
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewW, viewH]);

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    svgRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pts = pointers.current;
    if (pts.size === 1) {
      // Pan: delta in client px -> viewBox units.
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - prev.x) / rect.width) * viewW;
      const dy = ((e.clientY - prev.y) / rect.height) * viewH;
      setT((p) => (p.k === 1 ? p : { ...p, x: p.x + dx, y: p.y + dy }));
    } else if (pts.size === 2) {
      pinch(e, prev);
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  // Pinch: zoom sul midpoint proporzionale al rapporto delle distanze.
  function pinch(e: PointerEvent<SVGSVGElement>, prev: { x: number; y: number }) {
    const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)?.[1];
    if (!other) return;
    const dPrev = Math.hypot(prev.x - other.x, prev.y - other.y);
    const dNow = Math.hypot(e.clientX - other.x, e.clientY - other.y);
    if (dPrev === 0) return;
    const [px, py] = toViewBox((e.clientX + other.x) / 2, (e.clientY + other.y) / 2);
    setT((p) => zoomAt(p, px, py, dNow / dPrev));
  }

  const zoomStep = (factor: number) =>
    setT((p) => zoomAt(p, viewW / 2, viewH / 2, factor));

  return {
    svgRef,
    transform: t,
    zoomIn: () => zoomStep(1.6),
    zoomOut: () => zoomStep(1 / 1.6),
    reset: () => setT(IDENTITY),
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}
