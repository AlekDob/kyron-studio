"use client";
// Le quattro tile in cima al pannello Portali. Stessa UI di Ordini e Prodotti
// (StatTile in taglia "sm" dentro TileRail). Live e Bozze sono anche il filtro
// stato, secondo click torna a tutti.
import type { ReactElement } from "react";
import { StatTile } from "@/components/dashboard/StatTile";
import { TileRail } from "@/components/dashboard/TileRail";
import { STATUS_LABELS, type PortalsData, type PortalStatus } from "./portals-filter";

export function PortalsTiles({
  buckets,
  status,
  onStatus,
}: {
  buckets: PortalsData["buckets"];
  status: PortalStatus;
  onStatus: (status: PortalStatus) => void;
}): ReactElement {
  return (
    <TileRail cols="@3xl:grid-cols-2 @5xl:grid-cols-4">
      <StatTile
        tone="indaco"
        size="sm"
        label="Portali"
        value={String(buckets.total)}
        className="min-w-0"
        index={0}
      />
      <StatTile
        tone="menta"
        size="sm"
        label={STATUS_LABELS.live}
        value={String(buckets.live)}
        caption="online sullo shop"
        className="min-w-0"
        index={1}
        active={status === "live"}
        onClick={() => onStatus(status === "live" ? "all" : "live")}
      />
      <StatTile
        tone="ambra"
        size="sm"
        label={STATUS_LABELS.bozze}
        value={String(buckets.drafts)}
        caption="da finire"
        className="min-w-0"
        index={2}
        active={status === "bozze"}
        onClick={() => onStatus(status === "bozze" ? "all" : "bozze")}
      />
      <StatTile
        tone="rosa"
        size="sm"
        label="Kit"
        value={String(buckets.kits)}
        caption="configurati in tutto"
        className="min-w-0"
        index={3}
      />
    </TileRail>
  );
}
