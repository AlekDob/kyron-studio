"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Popover generico. Il contenuto va in un portal su body con position:fixed,
// non absolute: dentro il drawer prodotti il contenitore scrolla e un absolute
// verrebbe tagliato in basso, e l'aside ha un transform (quindi un fixed figlio
// si ancorerebbe all'aside, non alla finestra). Portal + coordinate dal rect del
// trigger = visibile sempre. Si chiude su click fuori, Escape e scroll.
export function Popover({
  trigger,
  label,
  children,
}: {
  trigger: ReactNode;
  /** aria-label del bottone: il trigger e' spesso solo un pallino colorato */
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; up: boolean } | null>(null);

  useEffect(() => {
    if (!box) return;
    const close = () => setBox(null);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [box]);

  function toggle() {
    if (box) return setBox(null);
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

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-expanded={Boolean(box)}
        onClick={toggle}
        className="cursor-pointer"
      >
        {trigger}
      </button>
      {box &&
        createPortal(
          <>
            <div
              aria-hidden
              onClick={() => setBox(null)}
              className="fixed inset-0 z-[60]"
            />
            <div
              role="dialog"
              className="studio-row-in fixed z-[61] min-w-[200px] max-w-[260px] rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-modal)]"
              style={{
                top: box.top,
                left: box.left,
                transform: box.up ? "translateY(-100%)" : undefined,
              }}
            >
              {children}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
