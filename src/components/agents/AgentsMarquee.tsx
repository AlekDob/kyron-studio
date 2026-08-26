"use client";

// Riga di agenti che scorre in loop, senza fine visibile: la lista e' stampata
// DUE volte e l'animazione trasla di meta' larghezza, cosi' quando riparte da
// zero il primo agente e' esattamente dove stava il primo della copia. Nessun
// salto, nessun timer JS.
//
// Lo spazio tra le card e' padding DENTRO la card, non `gap`: col gap la meta'
// esatta della pista non e' -50% (manca mezzo gap) e il loop scatta di 6px.
//
// Keyframes in un <style> qui e non in globals.css: le regole nuove in fondo a
// globals.css a volte non arrivano nel chunk servito da Turbopack (gotcha
// turbopack-stale-globals-css) e non vale un rm -rf .next per 6 righe.
import { useRef, type ReactElement, type ReactNode } from "react";

const CSS = `
@keyframes studio-agents-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
[data-agents-marquee] > div {
  animation: studio-agents-marquee var(--marquee-duration) linear infinite;
}
[data-agents-marquee]:hover > div,
[data-agents-marquee]:focus-within > div {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  [data-agents-marquee] > div { animation: none; }
  [data-agents-marquee] { overflow-x: auto; }
}
`;

export function AgentsMarquee({ children }: { children: ReactNode }): ReactElement {
  const count = useRef(0);
  // ~7s per agente: abbastanza lento da leggere la card mentre passa.
  count.current = Array.isArray(children) ? children.length : 1;
  const duration = `${Math.max(count.current, 1) * 7}s`;

  return (
    <>
      <style>{CSS}</style>
      <div
        data-agents-marquee
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)]"
      >
        <div className="flex w-max" style={{ "--marquee-duration": duration } as React.CSSProperties}>
          {children}
          {/* copia: serve solo a coprire il vuoto durante il ritorno a zero */}
          <div aria-hidden="true" className="flex">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
