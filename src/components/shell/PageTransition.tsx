"use client";

// Velo di transizione tra pagine — stesso componente dello storefront
// (framer-motion non anima clip-path in questo setup Next 16 + React 19).
//
// Come funziona:
//  1. Click su link interno → naviga subito (router.push) e il velo copre.
//  2. Il velo resta pieno finché la route nuova non committa (usePathname):
//     lo swap dei contenuti avviene sotto il velo, niente flash.
//  3. Commit (o tetto HOLD_CAP_MS) → il velo defluisce verso l'alto.
// Le classi `.page-wipe--cover` / `--drain` stanno in globals.css.
// prefers-reduced-motion → nessun velo (gestito qui, non solo in CSS).

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

const HOLD_CAP_MS = 1500; // max attesa a copertura piena prima di drenare comunque

type Phase = "idle" | "cover" | "drain";

// Path interno navigabile, o null (esterni, anchor, mailto, download, API).
function internalHref(a: HTMLAnchorElement): string | null {
  const href = a.getAttribute("href");
  if (!href) return null;
  if (a.target && a.target !== "_self") return null;
  if (a.hasAttribute("download")) return null;
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname.startsWith("/api/")) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return `${url.pathname}${url.search}`;
}

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const [covered, setCovered] = useState(false); // copertura completata
  const [ready, setReady] = useState(false); // route nuova committata (o cap)
  const targetRef = useRef<string | null>(null);
  const capRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = internalHref(a);
      if (!href) return;
      e.preventDefault();
      targetRef.current = href.split("?")[0];
      router.push(href);
      setCovered(false);
      setReady(false);
      setPhase("cover");
      window.clearTimeout(capRef.current);
      capRef.current = window.setTimeout(() => setReady(true), HOLD_CAP_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(capRef.current);
    };
  }, [router]);

  // La route nuova è committata quando il pathname diventa quello target.
  useEffect(() => {
    if (phase !== "idle" && targetRef.current && pathname === targetRef.current) {
      window.clearTimeout(capRef.current);
      setReady(true);
    }
  }, [pathname, phase]);

  useEffect(() => {
    if (phase === "cover" && covered && ready) setPhase("drain");
  }, [phase, covered, ready]);

  // Failsafe: se `animationend` non arriva (tab in background, animazione
  // interrotta) il velo si toglie comunque invece di restare a coprire.
  useEffect(() => {
    if (phase === "idle") return;
    const t = window.setTimeout(() => setPhase("idle"), HOLD_CAP_MS + 1000);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "idle") return null;

  // Portal sul body: un `fixed` dentro un antenato con backdrop-blur/transform
  // verrebbe ancorato a quell'antenato invece che al viewport.
  return createPortal(
    <div
      className={`page-wipe page-wipe--${phase}`}
      aria-hidden
      onAnimationEnd={() => {
        if (phase === "cover") setCovered(true);
        else setPhase("idle");
      }}
    />,
    document.body,
  );
}
