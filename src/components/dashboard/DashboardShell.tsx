"use client";
// Un periodo solo, in alto a destra, per ordini + fatturato + visite.
import { createContext, useContext, type ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import {
  DASHBOARD_RANGES,
  RangePicker,
  useStoredRange,
  type DashboardRange,
} from "./RangePicker";

const STORAGE_KEY = "studio.dashboard.range";

const RangeCtx = createContext<{
  range: DashboardRange;
  pick: (key: DashboardRange) => void;
} | null>(null);

export function useDashboardRange(): DashboardRange {
  const ctx = useContext(RangeCtx);
  if (!ctx) throw new Error("useDashboardRange: manca DashboardShell");
  return ctx.range;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [range, pick] = useStoredRange(STORAGE_KEY, DASHBOARD_RANGES, "all");

  return (
    <RangeCtx.Provider value={{ range, pick }}>
      <PageHeader
        eyebrow="Kyron"
        title="Dashboard"
        description="Ordini, portali e visite."
        actions={
          <RangePicker
            label="Scegli il periodo"
            options={DASHBOARD_RANGES}
            value={range}
            onPick={pick}
          />
        }
      />
      {children}
    </RangeCtx.Provider>
  );
}
