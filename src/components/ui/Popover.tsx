"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

// Popover generico. Il contenuto va in un portal su body con position:fixed,
// non absolute: dentro il drawer prodotti il contenitore scrolla e un absolute
// verrebbe tagliato in basso, e l'aside ha un transform (quindi un fixed figlio
// si ancorerebbe all'aside, non alla finestra). Portal + coordinate dal rect del
// trigger = visibile sempre. Si chiude su click fuori, Escape e scroll.
export function Popover({
  trigger,
  label,
  children,
  panelClassName,
}: {
  trigger: ReactNode;
  /** aria-label del bottone: il trigger e' spesso solo un pallino colorato */
  label: string;
  /** Funzione se il contenuto deve chiudere il popover (es. una scelta). */
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Larghezza/padding del pannello quando il default (max 260px) sta stretto. */
  panelClassName?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; up: boolean } | null>(null);
  // Chrome desktop ritargetta il pointer sull'overlay appena montato (copre il
  // trigger). Lo stesso gesto chiuderebbe subito. Safari iOS non lo fa.
  const hold = useRef(false);

  useEffect(() => {
    if (!box) return;
    const close = () => setBox(null);
    const onScroll = (e: Event) => {
      const t = e.target;
      if (!(t instanceof Node) || !ref.current) return;
      // Il marquee agenti scrive scrollLeft a ogni frame. Chrome notifica
      // quello in capture su window; Safari iOS no. Non sposta il trigger.
      if (t !== document && t !== document.documentElement && !t.contains(ref.current)) {
        return;
      }
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [box]);

  function place() {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    // Sotto il trigger, allineato a destra; se non c'e' spazio va sopra.
    const up = window.innerHeight - r.bottom < 220;
    setBox({
      top: up ? r.top - 6 : r.bottom + 6,
      left: Math.min(r.left, window.innerWidth - 240),
      up,
    });
  }

  function toggle() {
    if (box) return setBox(null);
    hold.current = true;
    const release = () => {
      hold.current = false;
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    place();
  }

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-expanded={Boolean(box)}
        // Apre su pointerdown e non su click: dentro le tile del cruscotto il
        // trigger vive in un pannello con tilt 3D + `whileHover` (y/scale), che
        // lo sposta sotto il cursore tra la pressione e il rilascio. mousedown e
        // mouseup cadono su due nodi diversi e il `click` va all'antenato
        // comune — al bottone non arriva mai. Da mobile (nessun hover, bersaglio
        // fermo) funzionava. Un solo evento = immune al bersaglio in movimento.
        onPointerDown={toggle}
        // Tastiera: Enter/Spazio non emettono pointerdown, e un click vero da
        // puntatore qui arriverebbe doppio (detail > 0).
        onClick={(e) => {
          if (e.detail === 0) toggle();
        }}
        className="cursor-pointer"
      >
        {trigger}
      </button>
      {box &&
        createPortal(
          <>
            <div
              aria-hidden
              onPointerDown={() => {
                if (hold.current) return;
                setBox(null);
              }}
              className="fixed inset-0 z-[60]"
            />
            <div
              role="dialog"
              className={cn(
                "studio-row-in fixed z-[61] min-w-[200px] max-w-[260px] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-modal)]",
                panelClassName,
              )}
              style={{
                top: box.top,
                left: box.left,
                transform: box.up ? "translateY(-100%)" : undefined,
              }}
            >
              {typeof children === "function" ? children(() => setBox(null)) : children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
