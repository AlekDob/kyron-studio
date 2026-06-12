"use client";

import { useMemo } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { Card } from "@/components/ui/Card";
import type { GeoCity } from "@/lib/analytics";
import { BarList } from "./BarList";
import { fmtInt } from "./format";
import { useMapZoom } from "./useMapZoom";

// Mappa visitatori: basemap world-atlas (offline, nel chunk /analytics) +
// dot per citta' dal GeoIP PostHog, raggio ~ sqrt(visitatori). A fianco la
// classifica delle citta'. Dati globali (cms + shop), non filtrati per origine.
// Zoom: wheel/pinch/pulsanti via useMapZoom; dot e stroke contro-scalati
// cosi' a zoom alto i punti non coprono la mappa.

const W = 700;
const H = 400;

// world-atlas non porta i tipi: cast una volta sola qui.
const topo = worldTopo as unknown as Topology<{
  countries: GeometryCollection;
}>;
const countries = feature(topo, topo.objects.countries);

// Le citta' plottabili: GeoIP a volte da' solo il paese (city null) con un
// centroide nazionale — in mappa sarebbe un dot fuorviante, resta solo in lista.
function plottable(geo: GeoCity[]): GeoCity[] {
  return geo.filter((g) => g.city !== null && g.lat !== 0 && g.lon !== 0);
}

// Proiezione fit sui dot con zoom clampato: con 1 sola citta' fitExtent
// degenera (scale infinito), e senza dot si centra sull'Italia.
function buildProjection(dots: GeoCity[]): GeoProjection {
  const proj = geoMercator();
  if (dots.length === 0) {
    return proj.center([12.5, 42]).scale(700).translate([W / 2, H / 2]);
  }
  proj.fitExtent(
    [
      [30, 30],
      [W - 30, H - 30],
    ],
    {
      type: "FeatureCollection",
      features: dots.map((d) => ({
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [d.lon, d.lat] },
      })),
    },
  );
  const scale = proj.scale();
  if (!Number.isFinite(scale) || scale > 1100 || scale < 350) {
    const cx = dots.reduce((s, d) => s + d.lon, 0) / dots.length;
    const cy = dots.reduce((s, d) => s + d.lat, 0) / dots.length;
    proj
      .scale(Math.min(Math.max(Number.isFinite(scale) ? scale : 700, 350), 1100))
      .center([cx, cy])
      .translate([W / 2, H / 2]);
  }
  return proj;
}

function dotRadius(visitors: number, max: number): number {
  return 4 + 10 * Math.sqrt(visitors / max);
}

// Arrotonda a 2 decimali: la trigonometria della proiezione differisce
// nell'ultima cifra tra Node (SSR) e browser -> hydration mismatch.
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function cityLabel(g: GeoCity): string {
  if (!g.city) return `Posizione non rilevata (${g.country || "?"})`;
  return g.country && g.country !== "IT" ? `${g.city} (${g.country})` : g.city;
}

interface VisitorsMapProps {
  geo: GeoCity[];
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] shadow-sm transition-colors hover:text-[var(--color-ink)]"
    >
      {children}
    </button>
  );
}

export function VisitorsMap({ geo }: VisitorsMapProps) {
  const dots = plottable(geo);
  const projection = useMemo(() => buildProjection(dots), [dots]);
  const path = geoPath(projection);
  // Stessa ragione di round2: path string identiche tra SSR e client.
  (path as unknown as { digits?: (n: number) => unknown }).digits?.(2);
  const maxVisitors = dots[0]?.visitors || 1;
  const { svgRef, transform, zoomIn, zoomOut, reset, handlers } = useMapZoom(W, H);
  const k = transform.k;

  if (geo.length === 0) return null;

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Citta' dei visitatori</h2>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="relative">
          <svg
            ref={svgRef}
            {...handlers}
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label="Mappa delle citta' dei visitatori"
            className="w-full cursor-grab touch-none select-none rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] active:cursor-grabbing"
          >
            <g transform={`translate(${transform.x},${transform.y}) scale(${k})`}>
              {countries.features.map((f, i) => (
                <path
                  key={f.id ?? i}
                  d={path(f) ?? undefined}
                  fill="var(--color-paper-muted)"
                  stroke="var(--color-line)"
                  strokeWidth={0.6 / k}
                />
              ))}
              {dots.map((d) => {
                const pos = projection([d.lon, d.lat]);
                if (!pos) return null;
                return (
                  <circle
                    key={`${d.city}-${d.country}`}
                    cx={round2(pos[0])}
                    cy={round2(pos[1])}
                    r={round2(dotRadius(d.visitors, maxVisitors) / Math.sqrt(k))}
                    fill="var(--color-action)"
                    fillOpacity={0.7}
                    stroke="var(--color-paper)"
                    strokeWidth={1 / k}
                  >
                    <title>{`${cityLabel(d)} — ${fmtInt(d.visitors)} visitatori`}</title>
                  </circle>
                );
              })}
            </g>
          </svg>
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <ZoomButton label="Aumenta zoom" onClick={zoomIn}>
              <Plus className="h-4 w-4" />
            </ZoomButton>
            <ZoomButton label="Riduci zoom" onClick={zoomOut}>
              <Minus className="h-4 w-4" />
            </ZoomButton>
            {k > 1 && (
              <ZoomButton label="Reset zoom" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </ZoomButton>
            )}
          </div>
        </div>
        <BarList
          rows={geo
            .slice(0, 10)
            .map((g) => ({ label: cityLabel(g), count: g.visitors }))}
        />
      </div>
    </Card>
  );
}
