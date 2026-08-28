"use client";
import { useEffect, type ComponentType } from "react";
import {
  ChevronLeft,
  ClipboardList,
  Package,
  StickyNote,
  User,
  Wallet,
} from "lucide-react";
import type { OrderRow } from "@/lib/gateway";
import { EditableLines } from "./EditableLines";
import { OrderComms } from "./OrderComms";
import { Section, SectionIcon, type Tone } from "./detail-section";
import { IdentityTab, MoneyTab } from "./OrderSections";
import { StatusBadges } from "./StatusBadges";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { Slide } from "@/components/animate-ui/primitives/effects/slide";
import { StatusSelector, NoteSection } from "./OrderBlocks";
import { ORDER_TABS, type OrderTab } from "./orders-filter";
import { formatDate, formatTime } from "./format";

export interface OrderDetailHandlers {
  onStatusChange: (id: string, status: string) => void;
  onTeacherCardAcquired: (id: string) => void;
  onBankTransferPaid: (id: string) => void;
  onResidualPaid: (id: string) => void;
  onNoteSaved: (id: string, note: string) => void;
  onVatSaved: (id: string, vat: string) => void;
  onPaymentTotalSaved: (id: string, override: number | null) => void;
  onVatReliefValidated: (id: string, status: string) => void;
}

export type { OrderTab };

const TAB_META: Record<
  OrderTab,
  { label: string; icon: ComponentType<{ size?: number }>; tone: Tone }
> = {
  cliente: { label: "Cliente", icon: User, tone: "indigo" },
  pagamento: { label: "Pagamento", icon: Wallet, tone: "emerald" },
  prodotti: { label: "Prodotti", icon: Package, tone: "amber" },
  note: { label: "Note", icon: StickyNote, tone: "violet" },
};

interface Props extends OrderDetailHandlers {
  order: OrderRow;
  /** Presente = scheda inline al centro: disegna la barra indietro e ascolta Esc. */
  onBack?: () => void;
  /** Tab attivo: vive nel workspace perche' lo cambia anche Nico dalla chat. */
  tab: OrderTab;
  onTabChange: (tab: OrderTab) => void;
}

// Contenuto della scheda ordine, senza guscio: al centro del pannello su
// desktop, dentro la bottom sheet su mobile. Il drawer non serve piu' perche'
// coprirebbe la chat, e l'agente deve vedere l'ordine mentre lo apre.
export function OrderDetail({ order, onBack, tab, onTabChange, ...h }: Props) {
  // Esc chiudeva la scheda quando era un Drawer: inline va rimesso a mano.
  useEffect(() => {
    if (!onBack) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  return (
    // Entra da destra: la scheda prende il posto della lista, e il movimento
    // dice da dove arriva. Offset piccolo, e' un pannello non una slide.
    <Slide direction="right" offset={18} className="flex h-full min-h-0 flex-1 flex-col">
      {onBack && <BackBar order={order} onBack={onBack} />}

      <Tabs
        value={tab}
        onValueChange={(v) => onTabChange(v as OrderTab)}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 px-6 pt-4">
          <TabsList variant="line" className="h-auto w-full justify-start gap-1">
            {ORDER_TABS.map((k) => (
              <TabsTrigger key={k} value={k} className="flex-none gap-2 px-2.5 py-1.5">
                <SectionIcon icon={TAB_META[k].icon} tone={TAB_META[k].tone} size={24} />
                {TAB_META[k].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {/* Lo stato lavorazione sta fuori dai tab: e' l'azione piu' frequente
              e cambiarla non deve costare un giro di navigazione. */}
          <div className="mb-6">
            {/* I badge pagamento stanno qui, non nei tab: sono lo stato dell'ordine,
                e l'operatore li deve vedere da qualunque sezione. */}
            <Section
              title="Stato lavorazione"
              icon={ClipboardList}
              tone="slate"
              action={<StatusBadges order={order} />}
            >
              <StatusSelector order={order} onStatusChange={h.onStatusChange} />
            </Section>
          </div>

          <TabsContent value="cliente" className="flex flex-col gap-6">
            <IdentityTab order={order} />
          </TabsContent>

          <TabsContent value="pagamento" className="flex flex-col gap-6">
            <MoneyTab order={order} {...h} />
          </TabsContent>

          {/* Prodotti (Parte C2 + decision-019): EditableLines sceglie la modalita'
              — modifica reale (ordine bozza), cambio colore come annotazione (ordine
              confermato non spedito) o sola lettura (spedito/chiuso). */}
          <TabsContent value="prodotti" className="flex flex-col gap-6">
            <Section title="Prodotti" icon={Package} tone="amber">
              <EditableLines order={order} />
            </Section>
          </TabsContent>

          <TabsContent value="note" className="flex flex-col gap-6">
            <Section title="Note" icon={StickyNote} tone="violet">
              <NoteSection order={order} onSaved={h.onNoteSaved} />
            </Section>
            {/* Parte B: FootNotes Danea + mail gia' partite per questo ordine. */}
            <Section title="Comunicazioni inviate" icon={ClipboardList} tone="violet">
              <OrderComms orderNumber={order.number} />
            </Section>
          </TabsContent>
        </div>
      </Tabs>
    </Slide>
  );
}

// Barra indietro della scheda inline: sostituisce la X del DrawerHeader.
function BackBar({ order, onBack }: { order: OrderRow; onBack: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-line)] px-5 py-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-sm text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-paper-muted)] hover:text-[var(--color-ink)]"
      >
        <ChevronLeft size={16} />
        Ordini
      </button>
      <span className="text-[var(--color-line-strong)]">/</span>
      <p className="text-base font-semibold">#{order.number}</p>
      <p className="text-xs text-[var(--color-ink-muted)]">
        {formatDate(order.created)} · {formatTime(order.created)}
      </p>
    </div>
  );
}
