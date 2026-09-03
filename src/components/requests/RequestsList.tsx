"use client";
// Lista richieste. L'ordine e' quello che arriva da Linear: ultima toccata
// prima, cosi' quello che si muove sta in cima.
import type { RequestRow } from "@/lib/requests";
import { RequestListRow } from "./RequestListRow";
import { Slides } from "@/components/animate-ui/primitives/effects/slide";

export function RequestsList({
  requests,
  onSelect,
}: {
  requests: RequestRow[];
  onSelect: (request: RequestRow) => void;
}) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)]">
      {/* Le righe entrano a scalare: quando Ivo cambia il filtro si vede che la
          lista si e' rifatta, invece di cambiare di scatto. */}
      <Slides asChild direction="up" offset={10} holdDelay={28}>
        {requests.map((r) => (
          <li key={r.id}>
            <RequestListRow request={r} onSelect={onSelect} />
          </li>
        ))}
      </Slides>
    </ul>
  );
}
