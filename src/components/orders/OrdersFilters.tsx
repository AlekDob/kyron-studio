"use client";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui";

// Filtri ordini. Le DATE vivono nell'URL (refetch server-side per periodo);
// PORTALE e AGENTE sono stato client (filtro istantaneo sul payload, no refetch).

export interface PortalOption {
  slug: string;
  name: string;
}

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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Field label="Da">
        <Input
          type="date"
          size="sm"
          value={from}
          max={to}
          onChange={(e) => pushDates(e.target.value || from, to)}
        />
      </Field>
      <Field label="A">
        <Input
          type="date"
          size="sm"
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
