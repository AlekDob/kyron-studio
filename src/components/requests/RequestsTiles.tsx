"use client";
// Le tre tile in cima al pannello Richieste. Stessa UI delle tile Ordini e
// Clienti (StatTile taglia "sm"). Ogni tile e' anche il filtro stato: secondo
// click torna a tutte.
import type { ReactElement } from "react";
import { StatTile } from "@/components/dashboard/StatTile";
import { TileRail } from "@/components/dashboard/TileRail";
import type { RequestGroup } from "@/lib/requests";
import { GROUP_LABELS } from "./requests-filter";

const TONES = { todo: "ambra", doing: "indaco", done: "menta" } as const;

export function RequestsTiles({
  totals,
  group,
  onGroup,
}: {
  totals: Record<RequestGroup, number>;
  group: RequestGroup | "all";
  onGroup: (group: RequestGroup | "all") => void;
}): ReactElement {
  return (
    <TileRail cols="@3xl:grid-cols-3">
      {(["todo", "doing", "done"] as const).map((key, i) => (
        <StatTile
          key={key}
          tone={TONES[key]}
          size="sm"
          label={GROUP_LABELS[key]}
          value={String(totals[key])}
          className="min-w-0"
          index={i}
          active={group === key}
          onClick={() => onGroup(group === key ? "all" : key)}
        />
      ))}
    </TileRail>
  );
}
