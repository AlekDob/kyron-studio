"use client";

// Riga di agenti che scorre in loop, senza fine visibile: la lista e' stampata
// DUE volte e quando lo scroll arriva a meta' pista torna a zero. Le due meta'
// sono identiche, quindi il salto non si vede.
//
// Perche' scrollLeft e non un'animazione CSS con translateX: il contenitore
// deve restare scorrevole a mano (trackpad e dito). Con translateX servirebbe
// overflow-hidden e lo scroll dell'utente non esisterebbe.
import { useEffect, useRef, type ReactElement, type ReactNode } from "react";

/** Velocita' del giro: una card ogni ~7 secondi. */
const SPEED_PX_S = 33;
/** Quanto sta ferma dopo che hai smesso di scorrere. */
const IDLE_MS = 1500;

// Barra di scorrimento nascosta: la riga si muove da sola, una scrollbar che
// va e viene fa sfarfallare il layout.
const CSS = `
[data-agents-marquee] { scrollbar-width: none; -ms-overflow-style: none; }
[data-agents-marquee]::-webkit-scrollbar { display: none; }
`;

export function AgentsMarquee({ children }: { children: ReactNode }): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const hovering = useRef(false);
  const lastPoke = useRef(0);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let prev = 0;
    let pos = el.scrollLeft;

    const step = (now: number): void => {
      const dt = prev ? (now - prev) / 1000 : 0;
      prev = now;
      const half = el.scrollWidth / 2;
      const mine = !hovering.current && now - lastPoke.current > IDLE_MS;
      // Quando guida l'utente teniamo il conto ma non tocchiamo scrollLeft:
      // scriverlo durante l'inerzia del dito la spezzerebbe.
      pos = mine ? pos + dt * SPEED_PX_S : el.scrollLeft;
      if (half > 0 && pos >= half) pos -= half;
      if (mine || pos !== el.scrollLeft) el.scrollLeft = pos;
      raf = requestAnimationFrame(step);
    };

    // Il giro parte solo quando la riga e' a schermo e si ferma quando esce.
    // Senza questo il loop scrive scrollLeft 60 volte al secondo per sempre, e
    // ogni scrittura ridisegna la lastra col blur che sta sotto il contenuto —
    // anche con la dashboard scrollata via o la riga fuori dal viewport.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) {
          prev = 0; // senza reset il primo dt vale tutta la pausa e la riga salta
          raf = requestAnimationFrame(step);
        }
        return;
      }
      cancelAnimationFrame(raf);
      raf = 0;
    });
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const poke = (): void => {
    lastPoke.current = performance.now();
  };

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={box}
        data-agents-marquee
        onPointerEnter={(e) => {
          // Solo il mouse "sta sopra": col dito il pointerenter resta appiccicato
          // dopo il tap e la riga non ripartirebbe piu'.
          if (e.pointerType === "mouse") hovering.current = true;
        }}
        onPointerLeave={() => {
          hovering.current = false;
        }}
        onWheel={poke}
        onTouchStart={poke}
        onTouchMove={poke}
        className="overflow-x-auto overscroll-x-contain [mask-image:linear-gradient(to_right,transparent,black_40px,black_calc(100%-40px),transparent)]"
      >
        <div className="flex w-max">
          {children}
          {/* copia: copre il vuoto quando lo scroll torna a zero */}
          <div aria-hidden="true" className="flex">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
