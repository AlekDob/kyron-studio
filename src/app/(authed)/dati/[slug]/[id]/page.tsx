import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { GatewayError, getRecord, type PayloadDoc } from "@/lib/gateway";
import { DataWorkspace } from "@/components/data/DataWorkspace";
import { saveRecord, destroyRecord } from "./actions";

export const dynamic = "force-dynamic";

const HIDDEN_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "_status",
  "tenant",
]);

type FieldType =
  | "string"
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "localized"
  | "localized-text"
  | "relation"
  | "relations"
  | "json";

interface FieldDescriptor {
  name: string;
  type: FieldType;
  value: string;
  extra?: {
    it?: string;
    en?: string;
    relations?: { id: string | number; label: string }[];
  };
}

function isLocalizedObject(v: unknown): v is { it?: string; en?: string } {
  if (!v || typeof v !== "object") return false;
  const keys = Object.keys(v as object);
  if (keys.length === 0 || keys.length > 3) return false;
  return keys.every((k) => k === "it" || k === "en" || k === "fr");
}

function isRelation(v: unknown): v is { id: string | number } {
  return (
    !!v &&
    typeof v === "object" &&
    "id" in (v as Record<string, unknown>) &&
    ((v as { id: unknown }).id !== undefined)
  );
}

function relationLabel(rel: Record<string, unknown>): string {
  const name = rel.name;
  if (name && typeof name === "object" && "it" in name) {
    return String((name as { it: string }).it);
  }
  if (typeof name === "string") return name;
  if (typeof rel.titolo === "string") return rel.titolo;
  if (typeof rel.title === "string") return rel.title;
  if (typeof rel.slug === "string") return rel.slug;
  return `#${rel.id}`;
}

function detectField(name: string, value: unknown): FieldDescriptor {
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value))
      return { name, type: "date", value: value.slice(0, 10) };
    if (value.length > 120) return { name, type: "text", value };
    return { name, type: "string", value };
  }
  if (typeof value === "number")
    return { name, type: "number", value: String(value) };
  if (typeof value === "boolean")
    return { name, type: "boolean", value: String(value) };
  if (value === null || value === undefined)
    return { name, type: "string", value: "" };

  if (isLocalizedObject(value)) {
    const it = (value as { it?: string }).it ?? "";
    const en = (value as { en?: string }).en ?? "";
    const long = it.length > 120 || en.length > 120;
    return {
      name,
      type: long ? "localized-text" : "localized",
      value: "",
      extra: { it, en },
    };
  }

  if (Array.isArray(value)) {
    if (value.every((v) => isRelation(v))) {
      return {
        name,
        type: "relations",
        value: "",
        extra: {
          relations: (value as Record<string, unknown>[]).map((r) => ({
            id: r.id as string | number,
            label: relationLabel(r),
          })),
        },
      };
    }
    return { name, type: "json", value: JSON.stringify(value, null, 2) };
  }

  if (isRelation(value)) {
    return {
      name,
      type: "relation",
      value: "",
      extra: {
        relations: [
          {
            id: (value as { id: string | number }).id,
            label: relationLabel(value as Record<string, unknown>),
          },
        ],
      },
    };
  }

  return { name, type: "json", value: JSON.stringify(value, null, 2) };
}

function buildFields(doc: PayloadDoc): FieldDescriptor[] {
  return Object.entries(doc)
    .filter(([k]) => !HIDDEN_KEYS.has(k))
    .map(([name, value]) => detectField(name, value));
}

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function RecordEditPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const { slug, id } = await params;

  let doc: PayloadDoc;
  try {
    doc = await getRecord(slug, id);
  } catch (err) {
    if (err instanceof GatewayError && err.status === 404) notFound();
    throw err;
  }

  const fields = buildFields(doc);
  const fieldMeta = JSON.stringify(fields.map((f) => ({ name: f.name, type: f.type })));

  return (
    <DataWorkspace slug={slug} id={String(doc.id)}>
    <main className="px-8 py-12 max-w-3xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">Studio · Dati</Link>
          {" / "}
          <Link href={`/dati/${slug}`} className="hover:underline">{slug}</Link>
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          Record <span className="font-serif italic">#{String(doc.id)}</span>
        </h1>
      </header>

      <form action={saveRecord} className="space-y-5">
        <input type="hidden" name="__slug" value={slug} />
        <input type="hidden" name="__id" value={String(doc.id)} />
        <input type="hidden" name="__fields" value={fieldMeta} />

        {fields.map((f) => (
          <FieldInput key={f.name} field={f} />
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-[var(--color-line)]">
          <Link href={`/dati/${slug}`} className="text-sm text-[var(--color-ink-muted)] hover:underline">
            Annulla
          </Link>
          <button
            type="submit"
            className="rounded-full bg-[var(--color-ink)] text-[var(--color-paper)] px-5 py-2 text-sm font-medium hover:opacity-90"
          >
            Salva
          </button>
        </div>
      </form>

      <form action={destroyRecord} className="mt-12 pt-6 border-t border-[var(--color-line)]">
        <input type="hidden" name="__slug" value={slug} />
        <input type="hidden" name="__id" value={String(doc.id)} />
        <button
          type="submit"
          className="text-xs uppercase tracking-wider text-red-600 hover:underline"
        >
          Elimina record
        </button>
      </form>
    </main>
    </DataWorkspace>
  );
}

function FieldInput({ field }: { field: FieldDescriptor }) {
  const baseClass =
    "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20";

  if (field.type === "relation" || field.type === "relations") {
    const rels = field.extra?.relations ?? [];
    return (
      <div>
        <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
          {field.name}{" "}
          <span className="lowercase opacity-60">
            (relazione{field.type === "relations" ? "i" : ""})
          </span>
        </span>
        <div className="flex flex-wrap gap-2">
          {rels.length === 0 ? (
            <span className="text-sm text-[var(--color-ink-muted)] italic">
              nessuna
            </span>
          ) : (
            rels.map((r) => (
              <span
                key={String(r.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-1 text-xs"
              >
                <span className="text-[var(--color-ink-muted)]">#{r.id}</span>
                <span>{r.label}</span>
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  if (field.type === "localized" || field.type === "localized-text") {
    const long = field.type === "localized-text";
    return (
      <div>
        <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
          {field.name}{" "}
          <span className="lowercase opacity-60">(IT + EN)</span>
        </span>
        <div className="grid gap-2 md:grid-cols-2">
          <LocaleField
            name={`${field.name}__it`}
            locale="IT"
            value={field.extra?.it ?? ""}
            long={long}
            baseClass={baseClass}
          />
          <LocaleField
            name={`${field.name}__en`}
            locale="EN"
            value={field.extra?.en ?? ""}
            long={long}
            baseClass={baseClass}
          />
        </div>
      </div>
    );
  }

  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
        {field.name}{" "}
        <span className="lowercase opacity-60">({field.type})</span>
      </span>
      {field.type === "text" || field.type === "json" ? (
        <textarea
          name={field.name}
          defaultValue={field.value}
          rows={field.type === "json" ? 8 : 4}
          className={`${baseClass} ${field.type === "json" ? "font-mono" : ""}`}
        />
      ) : field.type === "boolean" ? (
        <select name={field.name} defaultValue={field.value} className={baseClass}>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      ) : (
        <input
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : "text"
          }
          name={field.name}
          defaultValue={field.value}
          className={baseClass}
        />
      )}
    </label>
  );
}

function LocaleField({
  name,
  locale,
  value,
  long,
  baseClass,
}: {
  name: string;
  locale: string;
  value: string;
  long: boolean;
  baseClass: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">
        {locale}
      </span>
      {long ? (
        <textarea
          name={name}
          defaultValue={value}
          rows={5}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          name={name}
          defaultValue={value}
          className={baseClass}
        />
      )}
    </label>
  );
}
