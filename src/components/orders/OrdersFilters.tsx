"use client";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui";

// Filtri ordini. Le DATE vivono nell'URL (refetch server-side per periodo);
// PORTALE e AGENTE sono stato client (filtro istantaneo sul payload, no refetch).

export interface PortalOption {
  slug: string;
  name: string;
}

// Preset periodo: calcolano from/to in locale (il giorno "oggi" e' quello
// dell'operatore, non UTC). "Sempre" parte dal primo ordine Kyron.
const EPOCH = "2026-01-01";

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function presetRange(key: string): [string, string] {
  const now = new Date();
  const today = iso(now);
  switch (key) {
    case "oggi":
      return [today, today];
    case "ieri": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return [iso(y), iso(y)];
    }
    case "mese":
      return [iso(new Date(now.getFullYear(), now.getMonth(), 1)), today];
    case "mese-scorso":
      return [
        iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      ];
    default:
      return [EPOCH, today];
  }
}

const PRESETS: Array<{ key: string; label: string }> = [
  { key: "oggi", label: "Oggi" },
  { key: "ieri", label: "Ieri" },
  { key: "mese", label: "Mese corrente" },
  { key: "mese-scorso", label: "Mese scorso" },
  { key: "sempre", label: "Tutti" },
];

interface OrdersFiltersProps {
  from: string;
  to: string;
  portal: string; // channelSlug | "all"
  agent: string; // local-part | "all"
  portals: PortalOption[];
  agents: string[];
  onPortalChange: (value: string) => void;
  onAgentChange: (value: string) => void;
}

export function OrdersFilters({
  from,
  to,
  portal,
  agent,
  portals,
  agents,
  onPortalChange,
  onAgentChange,
}: OrdersFiltersProps) {
  const router = useRouter();

  function pushDates(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams({ from: nextFrom, to: nextTo });
    router.push(`/orders?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const [pf, pt] = presetRange(p.key);
          const active = pf === from && pt === to;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => pushDates(pf, pt)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                active
                  ? "border-transparent bg-[var(--color-ink)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Da">
        <Input
          type="date"
          size="sm"
          className="min-w-0 appearance-none"
          value={from}
          max={to}
          onChange={(e) => pushDates(e.target.value || from, to)}
        />
      </Field>
      <Field label="A">
        <Input
          type="date"
          size="sm"
          className="min-w-0 appearance-none"
          value={to}
          min={from}
          onChange={(e) => pushDates(from, e.target.value || to)}
        />
      </Field>
      <Field label="Portale">
        <Select
          className="h-8 text-sm"
          value={portal}
          onChange={(e) => onPortalChange(e.target.value)}
        >
          <option value="all">Tutti i portali</option>
          {portals.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Agente">
        <Select
          className="h-8 text-sm"
          value={agent}
          onChange={(e) => onAgentChange(e.target.value)}
        >
          <option value="all">Tutti gli agenti</option>
          {agents.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--color-ink-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
