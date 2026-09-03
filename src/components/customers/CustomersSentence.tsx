"use client";
// La testata dei Clienti e' una frase: "Ecco i clienti <periodo> di <agente>
// su <portale>". Stessi chip della testata Ordini (sentence-chips + Popover):
// il periodo e i filtri si cambiano a mano, e quando li scrive Bea dalla chat
// la frase si aggiorna da sola perche' legge lo stesso `filter`.
import { Sparkles } from "lucide-react";
import { Input, Popover } from "@/components/ui";
import { agentNameOf } from "@/components/shell/modules";
import { focusAgentChat } from "@/lib/focus-agent-chat";
import { Chip, Options } from "@/components/orders/sentence-chips";
import { PeriodPresets, periodPhrase } from "@/components/orders/orders-period";
import { agentName } from "@/components/orders/format";
import { isEmptySpec, specChips } from "@/lib/query-spec";
import type { CustomersFilter } from "./customers-filter";
import type { PortalOption } from "@/components/orders/orders-filter";

interface Props {
  filter: CustomersFilter;
  portals: PortalOption[];
  agents: string[];
  onChange: (patch: Partial<CustomersFilter>) => void;
}

function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });
}

function periodText(f: CustomersFilter): string {
  return periodPhrase(f.from, f.to) ?? `dal ${shortDate(f.from)} al ${shortDate(f.to)}`;
}

export function CustomersSentence({ filter, portals, agents, onChange }: Props) {
  const agent = agentNameOf("customers");
  const portalLabel =
    filter.portal === "all"
      ? "tutti i portali"
      : (portals.find((p) => p.slug === filter.portal)?.name ?? filter.portal);

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
      <span>Ecco i clienti che hanno ordinato</span>

      <Popover label="Periodo" trigger={<Chip tone="sky">{periodText(filter)}</Chip>}>
        {(close) => (
          <div className="flex flex-col gap-3">
            <PeriodPresets
              filter={filter}
              onChange={onChange}
              onPicked={close}
              className="flex flex-col items-start gap-1.5"
            />
            <div className="flex items-center gap-1.5 border-t border-[var(--color-line)] pt-3">
              <Input
                type="date"
                size="sm"
                aria-label="Da"
                className="w-[125px] appearance-none"
                value={filter.from}
                max={filter.to}
                onChange={(e) => onChange({ from: e.target.value || filter.from, source: "browse" })}
              />
              <span className="text-xs text-[var(--color-ink-muted)]">→</span>
              <Input
                type="date"
                size="sm"
                aria-label="A"
                className="w-[125px] appearance-none"
                value={filter.to}
                min={filter.from}
                onChange={(e) => onChange({ to: e.target.value || filter.to, source: "browse" })}
              />
            </div>
          </div>
        )}
      </Popover>

      <span>da</span>

      <Popover
        label="Agente"
        trigger={
          <Chip tone="violet">
            {filter.agent === "all" ? "tutti gli agenti" : agentName(filter.agent)}
          </Chip>
        }
      >
        {(close) => (
          <Options
            value={filter.agent}
            onPick={(v) => {
              onChange({ agent: v, source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Tutti gli agenti" },
              ...agents.map((a) => ({ value: a, label: agentName(a) })),
            ]}
          />
        )}
      </Popover>

      <span>su</span>

      <Popover label="Portale" trigger={<Chip tone="amber">{portalLabel}</Chip>}>
        {(close) => (
          <Options
            value={filter.portal}
            onPick={(v) => {
              onChange({ portal: v, source: "browse" });
              close();
            }}
            options={[
              { value: "all", label: "Tutti i portali" },
              ...portals.map((p) => ({ value: p.slug, label: p.name })),
            ]}
          />
        )}
      </Popover>

      {/* Filtro ricco scritto da Bea (es. "speso oltre 1000"): senza scriverlo
          la frase direbbe "tutti i portali" mentre la lista e' filtrata.
          Cliccandolo si torna ai filtri semplici. */}
      {!isEmptySpec(filter.spec) && (
        <>
          <span>con</span>
          <button type="button" onClick={() => onChange({ spec: null, source: "browse" })}>
            <Chip tone="emerald">{`${specChips(filter.spec).join(" · ")} ×`}</Chip>
          </button>
        </>
      )}

      {filter.query && (
        <>
          <span>che contengono</span>
          <button type="button" onClick={() => onChange({ query: "", source: "browse" })}>
            <Chip tone="indigo">{`“${filter.query}” ×`}</Chip>
          </button>
        </>
      )}

      <span>·</span>

      <button
        type="button"
        onClick={focusAgentChat}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-ink-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Sparkles size={13} aria-hidden="true" />
        oppure chiedi una ricerca a {agent}
      </button>
    </div>
  );
}
