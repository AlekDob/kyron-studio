"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Card } from "@/components/ui";
import { fmtEur } from "@/components/analytics/format";

interface PlanGroup {
  slug: string;
  aggregator: string;
  suggestedName?: string;
  subcategory: string;
  isNew: boolean;
  newVariants: Array<{ sku: string; name: string; priceEur: number }>;
  priceChanges: Array<{ sku: string; fromEur: number | null; toEur: number }>;
  unchanged: string[];
  warnings: string[];
}

export interface DaneaPlanData {
  channelSlug: string;
  groups: PlanGroup[];
  totals: {
    newProducts: number;
    newVariants: number;
    priceChanges: number;
    unchanged: number;
  };
  warnings: string[];
}

interface Mapping {
  aggregator: string;
  productName: string;
  slug: string;
  productTypeId: string;
  categorySlug: string;
}

interface Meta {
  productTypes: Array<{ id: string; name: string }>;
  categories: Array<{ slug: string; name: string }>;
}

export interface DaneaImportPlanProps {
  target: "prod" | "staging";
  importId?: string;
  plan: DaneaPlanData;
  onApplied?: () => void;
}

async function readError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { error?: string };
    return j.error ?? `Errore ${res.status}`;
  } catch {
    return `Errore ${res.status}`;
  }
}

export function DaneaImportPlan({
  target,
  importId,
  plan,
  onApplied,
}: DaneaImportPlanProps): ReactElement {
  const t = plan.totals;
  const newGroups = useMemo(
    () => plan.groups.filter((g) => g.newVariants.length > 0),
    [plan.groups],
  );
  const [meta, setMeta] = useState<Meta | null>(null);
  const [portals, setPortals] = useState<Array<{ slug: string; nome: string }>>([]);
  const [maps, setMaps] = useState<Mapping[]>([]);
  const [step, setStep] = useState<"map" | "after">("map");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [pickedPortals, setPickedPortals] = useState<string[]>([]);

  useEffect(() => {
    if (!importId) return;
    void fetch(`/api/products/import/${importId}/plan?channel=${plan.channelSlug}&target=${target}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        return res.json() as Promise<{
          mappings: Mapping[];
          meta: Meta;
          portals: Array<{ slug: string; nome: string }>;
          createdSlugs: string[];
        }>;
      })
      .then((json) => {
        setMeta(json.meta);
        setPortals(json.portals);
        const fallbackType = json.meta.productTypes[0]?.id ?? "";
        const fallbackCat = json.meta.categories[0]?.slug ?? "";
        setMaps(
          json.mappings.length
            ? json.mappings
            : newGroups.map((g) => ({
                aggregator: g.aggregator,
                productName: g.suggestedName || g.aggregator,
                slug: g.slug,
                productTypeId: fallbackType,
                categorySlug: fallbackCat,
              })),
        );
        if (json.createdSlugs.length) setStep("after");
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, [importId, plan.channelSlug, target, newGroups]);

  async function apply(): Promise<void> {
    if (!importId) return;
    setBusy(true);
    setError(null);
    try {
      const put = await fetch(`/api/products/import/${importId}/mappings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: maps }),
      });
      if (!put.ok) throw new Error(await readError(put));
      const res = await fetch(`/api/products/import/${importId}/apply?target=${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelSlug: plan.channelSlug, confirm: true }),
      });
      if (!res.ok) throw new Error(await readError(res));
      setStep("after");
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadImages(files: FileList | null): Promise<void> {
    if (!importId || !files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      for (const f of files) form.append("file", f);
      const res = await fetch(`/api/products/import/${importId}/images?target=${target}`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(await readError(res));
      const json = (await res.json()) as { unmatched: string[] };
      setUnmatched(json.unmatched ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function apple(): Promise<void> {
    if (!importId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/import/${importId}/apple?target=${target}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await readError(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function publish(): Promise<void> {
    if (!importId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/import/${importId}/publish?target=${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelSlug: plan.channelSlug }),
      });
      if (!res.ok) throw new Error(await readError(res));
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function addPortals(): Promise<void> {
    if (!importId || pickedPortals.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/import/${importId}/portals?target=${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalSlugs: pickedPortals, confirm: true }),
      });
      if (!res.ok) throw new Error(await readError(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="md">
      <Card.Header>
        <h3 className="text-sm font-medium">
          Import Danea — {plan.channelSlug}
          {target === "staging" && " (staging)"}
        </h3>
      </Card.Header>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
        {t.newProducts} prodotti nuovi · {t.newVariants} varianti nuove · {t.priceChanges}{" "}
        prezzi diversi · {t.unchanged} invariati
      </p>

      {step === "map" &&
        newGroups.map((g) => {
          const m = maps.find((x) => x.aggregator === g.aggregator);
          return (
            <div key={g.aggregator} className="mt-3 border-t border-[var(--color-line)] pt-2">
              <p className="text-xs text-[var(--color-ink)]">
                {g.suggestedName || g.aggregator}
                <span className="text-[var(--color-ink-muted)]"> · {g.isNew ? "nuovo" : "esistente"}</span>
              </p>
              {g.newVariants.map((v) => (
                <p key={v.sku} className="mt-1 text-xs text-[var(--color-ink-soft)]">
                  + {v.name} · {v.sku} · {fmtEur(v.priceEur)}
                </p>
              ))}
              {importId && m && meta && (
                <div className="mt-2 grid gap-1">
                  <input
                    className="rounded border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs"
                    value={m.productName}
                    onChange={(e) =>
                      setMaps((prev) =>
                        prev.map((x) =>
                          x.aggregator === g.aggregator ? { ...x, productName: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="Nome in negozio"
                  />
                  <input
                    className="rounded border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs"
                    value={m.slug}
                    onChange={(e) =>
                      setMaps((prev) =>
                        prev.map((x) =>
                          x.aggregator === g.aggregator ? { ...x, slug: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="slug"
                  />
                  <select
                    className="rounded border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs"
                    value={m.productTypeId}
                    onChange={(e) =>
                      setMaps((prev) =>
                        prev.map((x) =>
                          x.aggregator === g.aggregator ? { ...x, productTypeId: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    {meta.productTypes.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded border border-[var(--color-line)] bg-transparent px-2 py-1 text-xs"
                    value={m.categorySlug}
                    onChange={(e) =>
                      setMaps((prev) =>
                        prev.map((x) =>
                          x.aggregator === g.aggregator ? { ...x, categorySlug: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    {meta.categories.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}

      {plan.groups
        .filter((g) => g.newVariants.length === 0)
        .map((g) => (
          <div key={g.slug} className="mt-2 text-xs text-[var(--color-ink-muted)]">
            {g.aggregator}: {g.priceChanges.length} prezzi diversi (piano prezzi), {g.unchanged.length}{" "}
            invariati
          </div>
        ))}

      {step === "after" && (
        <div className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <p className="text-xs text-[var(--color-ink)]">Prodotti creati, non pubblicati.</p>
          <label className="block text-xs text-[var(--color-ink-muted)]">
            Foto (file o zip, nome = Codice Danea)
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.zip"
              className="mt-1 block w-full text-xs"
              onChange={(e) => void uploadImages(e.target.files)}
            />
          </label>
          {unmatched.length > 0 && (
            <p className="text-xs text-[var(--color-ink-soft)]">Non associati: {unmatched.join(", ")}</p>
          )}
          <button type="button" className="text-xs underline" disabled={busy} onClick={() => void apple()}>
            Prendi da Apple (solo …/A)
          </button>
          <button
            type="button"
            className="block text-xs underline"
            disabled={busy}
            onClick={() => void publish()}
          >
            Metti sul negozio ({plan.channelSlug})
          </button>
          <p className="text-xs text-[var(--color-ink-muted)]">Aggiungi ai portali</p>
          <div className="max-h-32 overflow-y-auto">
            {portals.map((p) => (
              <label key={p.slug} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={pickedPortals.includes(p.slug)}
                  onChange={() =>
                    setPickedPortals((cur) =>
                      cur.includes(p.slug) ? cur.filter((s) => s !== p.slug) : [...cur, p.slug],
                    )
                  }
                />
                {p.nome}
              </label>
            ))}
          </div>
          <button type="button" className="text-xs underline" disabled={busy} onClick={() => void addPortals()}>
            Aggiungi ai selezionati
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-[var(--color-danger, #a33)]">{error}</p>}

      {importId && step === "map" && newGroups.length > 0 && (
        <button
          type="button"
          disabled={busy || !maps.length}
          onClick={() => void apply()}
          className="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs"
        >
          {busy ? "Creo…" : "Conferma e crea (non pubblicati)"}
        </button>
      )}

      {!importId && (
        <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
          Conferma i nomi sulla card, poi crea. I prezzi diversi restano al piano prezzi.
        </p>
      )}
    </Card>
  );
}
