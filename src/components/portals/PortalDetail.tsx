"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  MapPin,
  Truck,
  Globe,
  Hash,
  Check,
  X,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Pill } from "@/components/ui";
import { Section as BaseSection } from "@/components/orders/drawer-primitives";
import { EnablePortalButton } from "./EnablePortalButton";
import { PortalCatalogSections } from "./PortalCatalogSections";
import { STATUS_LABEL, STATUS_VARIANT } from "./portal-status";
import { buildComponent, componentProductSlug, componentLabel } from "./bundle-components";
import type { PortalDetail as PortalDetailType, SaleorProduct } from "@/lib/gateway";

const EURO = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

interface Props {
  portal: PortalDetailType;
  onChanged?: () => void;
}

export function PortalDetail({ portal, onChanged }: Props) {
  const addr = portal.schoolAddress as Record<string, string>;
  const variant = STATUS_VARIANT[portal.status] ?? "neutral";
  const label = STATUS_LABEL[portal.status] ?? portal.status;

  const patchPortal = useCallback(
    async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/portals/${portal.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [portal.slug, onChanged],
  );

  const patchCatalog = useCallback(
    async (visibleSlugs: string[]) => {
      const res = await fetch(`/api/portals/${portal.slug}/catalog`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleSlugs }),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [portal.slug, onChanged],
  );

  return (
    <div className="divide-y divide-[var(--color-line)]">
      <Section title="Pubblicazione">
        <EnablePortalButton
          slug={portal.slug}
          status={portal.status}
          onDone={onChanged}
        />
      </Section>

      <Section title="Informazioni">
        <Row icon={<Hash className="h-4 w-4" />} label="Slug">
          <code className="text-xs text-[var(--color-ink-muted)]">
            {portal.slug}
          </code>
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Nome">
          <InlineText value={portal.nome} onSave={(v) => patchPortal({ nome: v })} />
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Stato">
          <Pill variant={variant} size="sm">{label}</Pill>
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Sito">
          <InlineText
            value={portal.sitoUfficiale === "TBD" ? "" : portal.sitoUfficiale}
            placeholder="https://..."
            onSave={(v) => patchPortal({ sitoUfficiale: v || "TBD" })}
          />
        </Row>
        <Row icon={<Hash className="h-4 w-4" />} label="Cod. MIUR">
          <InlineText
            value={portal.codiceMeccanografico}
            onSave={(v) => patchPortal({ codiceMeccanografico: v })}
          />
        </Row>
        {portal.requestedBy ? (
          <Row icon={<User className="h-4 w-4" />} label="Richiesto da">
            <span className="text-xs text-[var(--color-ink-muted)]">
              {portal.requestedBy}
            </span>
          </Row>
        ) : null}
      </Section>

      <Section title="Indirizzo">
        <Row icon={<MapPin className="h-4 w-4" />} label="Via">
          <InlineText
            value={addr.streetAddress1 ?? ""}
            onSave={(v) => patchPortal({ streetAddress1: v })}
          />
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="CAP">
          <InlineText
            value={addr.postalCode ?? ""}
            onSave={(v) => patchPortal({ postalCode: v })}
          />
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="Citta'">
          <InlineText
            value={addr.city ?? ""}
            onSave={(v) => patchPortal({ city: v })}
          />
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="Prov.">
          <InlineText
            value={addr.countryArea ?? ""}
            onSave={(v) =>
              patchPortal({ countryArea: v.toUpperCase().slice(0, 2) })
            }
          />
        </Row>
      </Section>

      <Section title="Spedizione">
        <Row icon={<Truck className="h-4 w-4" />} label="A scuola">
          <button
            type="button"
            onClick={() => patchPortal({ shipToSchool: !portal.shipToSchool })}
            className="text-xs underline-offset-2 hover:underline text-[var(--color-ink)]"
          >
            {portal.shipToSchool ? "Si" : "No"}
          </button>
        </Row>
        <Row icon={<Truck className="h-4 w-4" />} label="Metodo">
          {portal.shippingMethodLabel}
        </Row>
        <Row icon={<Truck className="h-4 w-4" />} label="Costo">
          {EURO.format(portal.shippingPriceEur)}
        </Row>
      </Section>

      <Section title="Logo">
        {portal.branding?.logoUrl ? (
          <img
            src={portal.branding.logoUrl}
            alt={`Logo ${portal.nome}`}
            className="h-16 w-16 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] object-contain p-1"
          />
        ) : (
          <p className="text-xs text-[var(--color-ink-muted)]">
            Nessun logo caricato.
          </p>
        )}
      </Section>

      <PortalCatalogSections portal={portal} onSaveCatalog={patchCatalog} />

      <Section title={`Kit (${portal.bundles.length})`}>
        {portal.bundles.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-muted)]">
            Nessun kit. Chiedi all&apos;agente di aggiungerne uno.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {portal.bundles.map((b) => (
              <BundleCard
                key={b.slug}
                slug={portal.slug}
                bundle={b}
                onChanged={onChanged}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// Le card con bordo sono sparite: sezioni separate da una linea, come nel drawer
// del catalogo. Il titolo e i colori arrivano da drawer-primitives (unica fonte).
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-5">
      <BaseSection title={title}>{children}</BaseSection>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[var(--color-ink-muted)]">{icon}</span>
      <span className="text-[var(--color-ink-muted)] min-w-[90px] text-xs">
        {label}
      </span>
      <span className="text-[var(--color-ink)] flex-1 min-w-0">{children}</span>
    </div>
  );
}

function InlineText({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder?: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = useCallback(async () => {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "errore");
    } finally {
      setBusy(false);
    }
  }, [draft, value, onSave]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left w-full truncate hover:underline underline-offset-2 decoration-[var(--color-line)]"
      >
        {value || (
          <span className="text-[var(--color-ink-muted)] italic">
            {placeholder ?? "—"}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={draft}
        placeholder={placeholder}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="flex-1 min-w-0 text-sm bg-[var(--color-paper-soft)] border border-[var(--color-line)] rounded px-2 py-0.5 focus:outline-none focus:border-[var(--color-ink)]"
      />
      <button
        type="button"
        onClick={commit}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(false);
        }}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {err ? (
        <span className="text-[10px] text-[var(--color-critical)]">{err}</span>
      ) : null}
    </div>
  );
}

function BundleCard({
  slug,
  bundle,
  onChanged,
}: {
  slug: string;
  bundle: PortalDetailType["bundles"][number];
  onChanged?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [available, setAvailable] = useState<SaleorProduct[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // I componenti raw del kit (jsonb Payload). Si trattano VERBATIM: aggiungere o
  // rimuovere un componente non deve toccare la `selection` degli altri (era il
  // bug che riscriveva tutto a variantSku=slug). Brain: gotcha-portal-kit-slug-mismatch.
  const components = (bundle.components ?? []) as Array<Record<string, unknown>>;
  const presentSlugs = new Set(
    components.map(componentProductSlug).filter(Boolean),
  );

  const callPut = useCallback(
    async (patch: Record<string, unknown>) => {
      const res = await fetch(`/api/portals/${slug}/bundles/${bundle.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    },
    [slug, bundle.slug, onChanged],
  );

  // Rimuove SOLO il componente col productSlug dato; gli altri restano verbatim.
  const removeComponent = async (productSlug: string) => {
    setBusy(true);
    try {
      const next = components.filter(
        (c) => componentProductSlug(c) !== productSlug,
      );
      await callPut({ components: next });
    } finally {
      setBusy(false);
    }
  };

  const loadAvailable = async () => {
    if (available) return;
    const res = await fetch("/api/portals/_catalog");
    if (res.ok) setAvailable((await res.json()) as SaleorProduct[]);
  };

  // Costruisce la selection canonica dallo SKU/taglio REALE della riga catalogo
  // (mai dallo slug) e la appende, lasciando intatti i componenti esistenti.
  const addComponent = async (row: SaleorProduct) => {
    const built = buildComponent(row);
    if (!built) return;
    setBusy(true);
    try {
      await callPut({ components: [...components, built] });
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const removeBundle = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/portals/${slug}/bundles/${bundle.slug}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      onChanged?.();
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const candidates = (available ?? []).filter((p) => !presentSlugs.has(p.slug));

  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--color-line)] p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <InlineText value={bundle.name} onSave={(v) => callPut({ name: v })} />
        </div>
        <InlinePrice
          value={bundle.finalPriceEur}
          onSave={(v) => callPut({ finalPriceEur: v })}
        />
        <button
          type="button"
          onClick={removeBundle}
          disabled={busy}
          className={`p-1 ${confirmDelete ? "text-[var(--color-critical)]" : "text-[var(--color-ink-muted)] hover:text-[var(--color-critical)]"}`}
          title={confirmDelete ? "Conferma" : "Rimuovi kit"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
        {components.map((c, i) => {
          const cslug = componentProductSlug(c);
          return (
            <span
              key={`${cslug}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-paper-muted)] text-[10px] text-[var(--color-ink-soft)]"
            >
              {componentLabel(c)}
              <button
                type="button"
                onClick={() => removeComponent(cslug)}
                disabled={busy}
                className="hover:text-[var(--color-ink)]"
                aria-label={`Rimuovi ${cslug}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setAdding((v) => !v);
            loadAvailable();
          }}
          disabled={busy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-[var(--color-line)] text-[10px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          <Plus className="h-2.5 w-2.5" /> Componente
        </button>
      </div>
      {adding ? (
        <div className="mt-2 border border-[var(--color-line)] rounded-[var(--radius-control)] bg-[var(--color-paper-soft)] max-h-40 overflow-y-auto">
          {available === null ? (
            <p className="text-xs text-[var(--color-ink-muted)] p-2">
              Caricamento...
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)] p-2">
              Nessun altro prodotto disponibile.
            </p>
          ) : (
            candidates.map((p) => {
              const buildable = buildComponent(p) !== null;
              return (
                <button
                  key={p.id ?? p.slug}
                  type="button"
                  onClick={() => addComponent(p)}
                  disabled={busy || !buildable}
                  title={
                    buildable
                      ? undefined
                      : "Prodotto multi-variante: scegli un taglio specifico"
                  }
                  className="w-full flex justify-between items-center px-2 py-1.5 text-left text-xs hover:bg-[var(--color-paper-muted)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-[var(--color-ink)] truncate">{p.name}</span>
                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)] shrink-0 ml-2">
                    {p.capacitySlug ?? p.variantSku ?? p.slug}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
      {confirmDelete ? (
        <p className="text-[10px] text-[var(--color-critical)] mt-1">
          Premi di nuovo il cestino per confermare.
        </p>
      ) : null}
    </div>
  );
}

function InlinePrice({
  value,
  onSave,
}: {
  value: number;
  onSave: (next: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = async () => {
    const n = Number(draft.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      setEditing(false);
      setDraft(String(value));
      return;
    }
    if (n === value) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onSave(n);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-sm tabular-nums text-[var(--color-ink)] hover:underline underline-offset-2 shrink-0"
      >
        {EURO.format(value)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={draft}
        disabled={busy}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setEditing(false);
          }
        }}
        className="w-20 text-sm tabular-nums bg-[var(--color-paper-soft)] border border-[var(--color-line)] rounded px-2 py-0.5 focus:outline-none focus:border-[var(--color-ink)]"
      />
      <span className="text-xs text-[var(--color-ink-muted)]">EUR</span>
      <button
        type="button"
        onClick={commit}
        disabled={busy}
        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] p-1"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
