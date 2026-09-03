"use client";
// Le quattro tile in cima al pannello Prodotti. Stessa UI di Ordini (StatTile
// in taglia "sm" dentro TileRail): qui lo spazio e' mezzo schermo. Le due di
// stato sono anche il filtro stato, secondo click torna a tutti.
import type { ReactElement } from "react";
import { StatTile } from "@/components/dashboard/StatTile";
import { TileRail } from "@/components/dashboard/TileRail";
import type { ProductsData, ProductStatus } from "./products-filter";
import { STATUS_LABELS } from "./products-filter";

export function ProductsTiles({
  buckets,
  status,
  onStatus,
}: {
  buckets: ProductsData["buckets"];
  status: ProductStatus;
  onStatus: (status: ProductStatus) => void;
}): ReactElement {
  return (
    <TileRail cols="@3xl:grid-cols-2 @5xl:grid-cols-4">
      <StatTile
        tone="indaco"
        size="sm"
        label="Prodotti"
        value={String(buckets.total)}
        className="min-w-0"
        index={0}
      />
      <StatTile
        tone="menta"
        size="sm"
        label={STATUS_LABELS.pubblicati}
        value={String(buckets.published)}
        caption="su almeno un portale"
        className="min-w-0"
        index={1}
        active={status === "pubblicati"}
        onClick={() => onStatus(status === "pubblicati" ? "all" : "pubblicati")}
      />
      <StatTile
        tone="ambra"
        size="sm"
        label={STATUS_LABELS["non-pubblicati"]}
        value={String(buckets.unpublished)}
        caption="nessun portale"
        className="min-w-0"
        index={2}
        active={status === "non-pubblicati"}
        onClick={() => onStatus(status === "non-pubblicati" ? "all" : "non-pubblicati")}
      />
      <StatTile
        tone="rosa"
        size="sm"
        label="Venduti"
        value={String(buckets.sold)}
        caption="pezzi, tutto lo storico"
        className="min-w-0"
        index={3}
      />
    </TileRail>
  );
}
