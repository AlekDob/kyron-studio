"use client";

import { useMemo } from "react";
import { geoMercator, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldTopo from "world-atlas/countries-110m.json";
import { Card } from "@/components/ui/Card";
import type { GeoCity } from "@/lib/analytics";
import { BarList } from "./BarList";
import { fmtInt } from "./format";

// Mappa visitatori: basemap world-atlas (offline, nel chunk /analytics) +
// dot per citta' dal GeoIP PostHog, raggio ~ sqrt(visitatori). A fianco la
// classifica delle citta'. Dati globali (cms + shop), non filtrati per origine.

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

function cityLabel(g: GeoCity): string {
  if (!g.city) return `Posizione non rilevata (${g.country || "?"})`;
  return g.country && g.country !== "IT" ? `${g.city} (${g.country})` : g.city;
}

interface VisitorsMapProps {
  geo: GeoCity[];
}

export function VisitorsMap({ geo }: VisitorsMapProps) {
  const dots = plottable(geo);
  const projection = useMemo(() => buildProjection(dots), [dots]);
  const path = geoPath(projection);
  const maxVisitors = dots[0]?.visitors || 1;

  if (geo.length === 0) return null;

  return (
    <Card padding="sm" className="px-5 py-4">
      <h2 className="text-sm font-medium mb-3">Citta' dei visitatori</h2>
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Mappa delle citta' dei visitatori"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper-soft)]"
        >
          {countries.features.map((f, i) => (
            <path
              key={f.id ?? i}
              d={path(f) ?? undefined}
              fill="var(--color-paper-muted)"
              stroke="var(--color-line)"
              strokeWidth={0.6}
            />
          ))}
          {dots.map((d) => {
            const pos = projection([d.lon, d.lat]);
            if (!pos) return null;
            return (
              <circle
                key={`${d.city}-${d.country}`}
                cx={pos[0]}
                cy={pos[1]}
                r={dotRadius(d.visitors, maxVisitors)}
                fill="var(--color-action)"
                fillOpacity={0.7}
                stroke="var(--color-paper)"
                strokeWidth={1}
              >
                <title>{`${cityLabel(d)} — ${fmtInt(d.visitors)} visitatori`}</title>
              </circle>
            );
          })}
        </svg>
        <BarList
          rows={geo
            .slice(0, 10)
            .map((g) => ({ label: cityLabel(g), count: g.visitors }))}
        />
      </div>
    </Card>
  );
}
