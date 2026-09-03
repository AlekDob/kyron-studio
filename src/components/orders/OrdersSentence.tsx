"use client";
// La testata degli Ordini e' una frase: "Ecco gli ordini <periodo> di <agente>
// su <portale>". Le parti dinamiche sono chip colorati che aprono un popover
// per cambiarle a mano.
//
// La frase e' lo specchio del filtro corrente, non una copia: quando Nico
// filtra dalla chat scrive lo stesso `filter` (via URL), quindi i chip si
// aggiornano da soli e si legge a parole cosa sta guardando l'agente.
import { Sparkles } from "lucide-react";
import { Input, Popover } from "@/components/ui";
import { agentNameOf } from "@/components/shell/modules";
import { focusAgentChat } from "@/lib/focus-agent-chat";
import { Chip, Options } from "./sentence-chips";
import { PeriodPresets, periodPhrase } from "./orders-period";
import { agentName } from "./format";
import { isEmptySpec, specChips } from "@/lib/query-spec";
import type { OrdersFilter, PortalOption } from "./orders-filter";

interface Props {
  filter: OrdersFilter;
  portals: PortalOption[];
  agents: string[];
  onChange: (patch: Partial<OrdersFilter>) => void;
}

/** Data breve per il periodo su misura: "1 gen". */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function periodText(filter: OrdersFilter): string {
  return (
    periodPhrase(filter.from, filter.to) ??
    `dal ${shortDate(filter.from)} al ${shortDate(filter.to)}`
  );
}

export function OrdersSentence({ filter, portals, agents, onChange }: Props) {
  const agent = agentNameOf("orders");
  const portalLabel =
    filter.portal === "all"
      ? "tutti i portali"
      : (portals.find((p) => p.slug === filter.portal)?.name ?? filter.portal);

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm text-[var(--color-ink-soft)]">
      <span>Ecco gli ordini</span>

      <Popover label="Periodo" trigger={<Chip tone="sky">{periodText(filter)}</Chip>}>
        {(close) => (
          <div className="flex flex-col gap-3">
            <PeriodPresets
              filter={filter}
              onChange={onChange}
              onPicked={close}
              className="flex flex-col items-start gap-1.5"
            />
            {/* Periodo su misura: le due date restano a disposizione, ma dentro
                il popover invece che occupare la testata. */}
            <div className="flex items-center gap-1.5 border-t border-[var(--color-line)] pt-3">
              <Input
                type="date"
                size="sm"
                aria-label="Da"
                className="w-[125px] appearance-none"
                value={filter.from}
                max={filter.to}
                onChange={(e) =>
                  onChange({ from: e.target.value || filter.from, source: "browse" })
                }
              />
              <span className="text-xs text-[var(--color-ink-muted)]">→</span>
              <Input
                type="date"
                size="sm"
                aria-label="A"
                className="w-[125px] appearance-none"
                value={filter.to}
                min={filter.from}
                onChange={(e) =>
                  onChange({ to: e.target.value || filter.to, source: "browse" })
                }
              />
            </div>
          </div>
        )}
      </Popover>

      <span>di</span>

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

      {/* Filtro ricco scritto da Nico (es. "portaleNome contiene majorana"):
          non entra nei tre chip perche' non e' uno slug ne' un agente, ma senza
          scriverlo la frase direbbe "tutti i portali" mentre la lista mostra un
          portale solo. Cliccandolo si torna ai filtri semplici. */}
      {!isEmptySpec(filter.spec) && (
        <>
          <span>con</span>
          <button type="button" onClick={() => onChange({ spec: null, source: "browse" })}>
            <Chip tone="emerald">{`${specChips(filter.spec).join(" · ")} ×`}</Chip>
          </button>
        </>
      )}

      {/* Cercato da Nico: si vede nella frase, altrimenti la lista sarebbe
          filtrata e non si capirebbe da cosa. Cliccandolo si azzera. */}
      {filter.query && (
        <>
          <span>che contengono</span>
          <button type="button" onClick={() => onChange({ query: "", source: "browse" })}>
            <Chip tone="indigo">{`“${filter.query}” ×`}</Chip>
          </button>
        </>
      )}

      <span>·</span>

      {/* La ricerca libera non e' piu' un campo: la fa l'agente, che sa cercare
          per numero, cliente o transazione Stripe. Il link porta il cursore
          nella sua chat, cosi' si scrive subito invece di cercare dove farlo. */}
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
