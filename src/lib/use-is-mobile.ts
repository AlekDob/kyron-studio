"use client";

import { useEffect, useState } from "react";

/** Stessa soglia del breakpoint `lg` di Tailwind, usato in tutta la shell. */
const MOBILE = "(max-width: 1023px)";

/**
 * Serve solo dove il mobile cambia una PROP e non una classe: `side` del Drawer
 * (bottom sheet vs pannello da destra) non e' esprimibile con una media query.
 * Per tutto il resto si usano le classi `lg:`.
 * Parte da `false`: in SSR non esiste una finestra e il desktop e' il default.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
