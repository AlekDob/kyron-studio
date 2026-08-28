"use client";
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import type { OrderRow } from "@/lib/gateway";
import { OrderDetail, type OrderDetailHandlers } from "./OrderDetail";
import { formatDate, formatTime } from "./format";

interface OrderDrawerProps extends OrderDetailHandlers {
  order: OrderRow | null;
  onClose: () => void;
}

// Guscio mobile della scheda ordine: bottom sheet col contenuto di OrderDetail.
// Su desktop la scheda vive al centro del pannello (OrdersView) — un drawer da
// destra coprirebbe la chat, e l'agente deve vedere l'ordine mentre lo apre.
// Il Drawer del core porta animazione, Esc, scroll-lock e cache dei figli
// durante l'uscita: qui non serve nessuno stato locale.
export function OrderDrawer({ order, onClose, ...handlers }: OrderDrawerProps) {
  return (
    <Drawer open={Boolean(order)} onClose={onClose} side="bottom">
      {order && (
        <>
          <DrawerHeader
            eyebrow="Ordine"
            title={`#${order.number}`}
            meta={`${formatDate(order.created)} · ${formatTime(order.created)}`}
            onClose={onClose}
            closeLabel="Chiudi"
          />
          <OrderDetail order={order} {...handlers} />
        </>
      )}
    </Drawer>
  );
}
