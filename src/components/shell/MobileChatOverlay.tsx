"use client";

import {
  useState,
  useCallback,
  useContext,
  createContext,
  type ReactNode,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "@/lib/use-is-mobile";

interface Props {
  children: ReactNode;
  label?: string;
  icon?: ReactElement;
  position?: "bottom-right" | "top-right";
}

// Chiudere la sheet spetta a chi ci sta dentro: una ricevuta cliccata deve
// far vedere quello che ha applicato, non restare coperta dalla chat. Su
// desktop l'overlay non monta e il contesto e' null.
const CloseContext = createContext<(() => void) | null>(null);

export function useCloseMobileChat(): (() => void) | null {
  return useContext(CloseContext);
}

/**
 * Pannello dell'agente su mobile: un FAB che apre una bottom sheet.
 * Brain: gotcha-drawer-non-portalato-dietro-overlay — il Drawer di studio-core fa
 * portal su body con z-index proprio (70/80), quindi i drawer di dettaglio
 * aperti da dentro il pannello si impilano SOPRA e non ci finiscono dietro.
 * Su desktop non monta affatto: il pannello vive nell'`aside` della pagina.
 */
export function MobileChatOverlay({
  children,
  label = "Chat",
  icon,
  position = "bottom-right",
}: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const close = useCallback(() => setOpen(false), []);

  // Niente `lg:hidden`: il backdrop del Drawer e' un nodo interno senza
  // className, si gatea smontando tutto. Allo resize verso desktop si chiude.
  if (!isMobile) return null;

  const fabStyle =
    position === "top-right"
      ? { top: "calc(env(safe-area-inset-top) + 60px)", right: "16px" }
      : { bottom: "calc(env(safe-area-inset-bottom) + 88px)", right: "16px" };

  return (
    <>
      {!open &&
        createPortal(
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Apri ${label}`}
            className="flex items-center justify-center rounded-full shadow-lg bg-[var(--color-accent)] text-[var(--color-paper)] hover:brightness-110 active:scale-95 transition-all"
            style={{
              position: "fixed",
              zIndex: 50,
              width: "48px",
              height: "48px",
              ...fabStyle,
            }}
          >
            {icon ?? <MessageCircle className="h-5 w-5" />}
          </button>,
          document.body,
        )}

      <Drawer open={open} onClose={close} side="bottom">
        <DrawerHeader title={label} onClose={close} closeLabel="Chiudi" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CloseContext.Provider value={close}>{children}</CloseContext.Provider>
        </div>
      </Drawer>
    </>
  );
}
