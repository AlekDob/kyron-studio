"use client";

// Il pannello destro dei Portali (bozza in costruzione, dettaglio) si aggiorna
// guardando passare lo stream dell'agente: argomenti dei tool, risultati,
// card inviate e — quando l'agente non chiama tool — il testo che scrive.
// Logica spostata qui da PortalsChat, che ora e' un AgentChannel come gli altri.
import { useCallback, useRef } from "react";
import type { ChatStreamEvent } from "@studiofuturo/studio-core";
import type { GenerativeSubmission } from "@/components/chat/generative/types";
import type { PortalDraft } from "./PortalsWorkspace";
import type { PortalDetail } from "@/lib/gateway";

type Update = (updater: (prev: PortalDraft) => PortalDraft) => void;

interface Handlers {
  onEvent: (ev: ChatStreamEvent) => void;
  onSubmission: (sub: GenerativeSubmission) => void;
}

/** Le selezioni arrivano come oggetti: nel pannello servono etichette. */
function rowLabel(r: { slug: string; capacitySlug?: string }): string {
  return r.capacitySlug ? `${r.slug} (${r.capacitySlug})` : r.slug;
}

function fromToolArgs(update: Update, tool: string, args: unknown): void {
  const a = (args ?? {}) as Record<string, unknown>;
  const str = (k: string): string | undefined => (a[k] ? String(a[k]) : undefined);
  if (tool === "check_slug_availability" && a.slug) {
    update((d) => ({ ...d, slug: String(a.slug) }));
  }
  if (tool === "validate_school_data") {
    update((d) => ({
      ...d,
      slug: str("slug") ?? d.slug,
      provincia: str("countryArea") ?? d.provincia,
      codiceMeccanografico: str("codiceMeccanografico") ?? d.codiceMeccanografico,
      sitoUfficiale: str("sitoUfficiale") ?? d.sitoUfficiale,
    }));
  }
  if (tool === "save_pending_school") {
    const addr = a.schoolAddress as Record<string, string> | undefined;
    update((d) => ({
      ...d,
      nome: str("nome") ?? d.nome,
      slug: str("slug") ?? d.slug,
      sitoUfficiale: str("sitoUfficiale") ?? d.sitoUfficiale,
      codiceMeccanografico: str("codiceMeccanografico") ?? d.codiceMeccanografico,
      via: addr?.streetAddress1 ?? d.via,
      cap: addr?.postalCode ?? d.cap,
      city: addr?.city ?? d.city,
      provincia: addr?.countryArea ?? d.provincia,
      shipToSchool: typeof a.shipToSchool === "boolean" ? a.shipToSchool : d.shipToSchool,
    }));
  }
}

function fromSubmission(update: Update, sub: GenerativeSubmission): void {
  const data = sub.data as Record<string, unknown>;
  if (Array.isArray(data.selections)) {
    const rows = data.selections as { slug: string; capacitySlug?: string }[];
    update((d) => ({
      ...d,
      selectedProducts: rows.map(rowLabel),
      productDiscounts: Array.isArray(data.productDiscounts)
        ? (data.productDiscounts as PortalDraft["productDiscounts"])
        : d.productDiscounts,
    }));
  }
  if (data.name && data.priceEur != null) {
    const components = Array.isArray(data.components)
      ? (data.components as { slug: string; capacitySlug?: string }[]).map(rowLabel)
      : [];
    const bundle = {
      name: String(data.name),
      priceEur: Number(data.priceEur),
      components,
    };
    update((d) => ({ ...d, bundles: [...(d.bundles ?? []), bundle] }));
  }
  if (typeof data.uploaded === "boolean") {
    update((d) => ({
      ...d,
      logoUploaded: data.uploaded as boolean,
      logoFilename: data.uploaded ? String(data.filename) : undefined,
    }));
  }
}

/**
 * Nome e indirizzo li scrive l'agente in chat prima di chiamare
 * `save_pending_school`: senza questo il pannello resta vuoto mezza
 * conversazione. Euristica, non contratto: se cambia il prompt si perde solo
 * l'anticipo, i dati veri arrivano dai tool.
 */
function fromAssistantText(
  update: Update,
  onStartCreating: () => void,
  triggered: { current: boolean },
  text: string,
): void {
  const lower = text.toLowerCase();

  if (
    !triggered.current &&
    (lower.includes("nome ufficiale") ||
      lower.includes("nome della scuola") ||
      lower.includes("come si chiama") ||
      lower.includes("iniziamo") ||
      lower.includes("onboarding"))
  ) {
    triggered.current = true;
    onStartCreating();
  }

  const nameMatch = text.match(
    /(?:confermare che (?:è|e')|confermare.*?"([^"]+)"|il nome.*?"([^"]+)"|scuola.*?"([^"]+)")/i,
  );
  const name = nameMatch?.[1] ?? nameMatch?.[2] ?? nameMatch?.[3];
  if (name) update((d) => (d.nome ? d : { ...d, nome: name.trim() }));

  const addr = text.match(
    /(?:indirizzo|l'indirizzo)[^:]*?:\s*([^,]+),\s*(\d{5})\s+([A-Za-zÀ-ú\s]+?)\s*\((\w{2})\)/i,
  );
  if (addr) {
    update((d) => ({
      ...d,
      via: addr[1].trim(),
      cap: addr[2],
      city: addr[3].trim(),
      provincia: addr[4].toUpperCase(),
    }));
  }

  if (lower.includes("senza il sito") || (lower.includes("proceder") && lower.includes("sito"))) {
    update((d) => (d.sitoUfficiale ? d : { ...d, sitoUfficiale: "TBD" }));
  }
}

export function usePortalDraftSync(
  onDraftUpdate: Update,
  onStartCreating: () => void,
  onViewPortal: (portal: PortalDetail) => void,
): Handlers {
  const buf = useRef("");
  const triggered = useRef(false);

  const onEvent = useCallback(
    (ev: ChatStreamEvent): void => {
      if (ev.type === "delta") {
        buf.current += ev.delta;
        fromAssistantText(onDraftUpdate, onStartCreating, triggered, buf.current);
        return;
      }
      if (ev.type === "tool") {
        buf.current = "";
        fromToolArgs(onDraftUpdate, ev.tool, ev.args);
        return;
      }
      if (ev.type === "tool-result") {
        if (ev.tool === "save_pending_school") onDraftUpdate((d) => ({ ...d, saved: true }));
        const r = (ev.result ?? {}) as Record<string, unknown>;
        if (ev.tool === "get_portal" && r.portal) onViewPortal(r.portal as PortalDetail);
      }
    },
    [onDraftUpdate, onStartCreating, onViewPortal],
  );

  const onSubmission = useCallback(
    (sub: GenerativeSubmission): void => fromSubmission(onDraftUpdate, sub),
    [onDraftUpdate],
  );

  return { onEvent, onSubmission };
}
