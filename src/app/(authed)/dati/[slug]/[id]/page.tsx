import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import {
  GatewayError,
  getRecord,
  listRecords,
  type PayloadDoc,
} from "@/lib/gateway";
import { DataDisclosure } from "@/components/data/DataDisclosure";
import { DataSelect } from "@/components/data/DataSelect";
import { DataWorkspace } from "@/components/data/DataWorkspace";
import { RelationFieldEditor } from "@/components/data/RelationFieldEditor";
import { StructuredArrayFieldEditor } from "@/components/data/StructuredArrayFieldEditor";
import {
  buildFields,
  formatFieldName,
  pickRecordTitle,
  relationOption,
  type FieldDescriptor,
  type RelationOption,
} from "@/lib/data-fields";
import { saveRecord, destroyRecord } from "./actions";

export const dynamic = "force-dynamic";

const RELATION_OPTION_LIMIT = 100;

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

  const fields = await withRelationOptions(buildFields(doc));
  const fieldMeta = JSON.stringify(fields.map((f) => ({ name: f.name, type: f.type })));
  const recordTitle = pickRecordTitle(doc);

  return (
    <DataWorkspace slug={slug} id={String(doc.id)}>
    <main className="px-5 py-8 sm:px-8 lg:px-10 max-w-4xl mx-auto">
      <header className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-5">
        <p className="eyebrow mb-2">
          <Link href="/dati" className="hover:underline">Studio · Dati</Link>
          {" / "}
          <Link href={`/dati/${slug}`} className="hover:underline">{slug}</Link>
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          {recordTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Record #{String(doc.id)} · modifica i campi semplici, ispeziona relazioni e contenuti strutturati.
        </p>
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

async function withRelationOptions(
  fields: FieldDescriptor[],
): Promise<FieldDescriptor[]> {
  const targets = [
    ...new Set(fields.map((field) => field.relationTarget).filter(isString)),
  ];
  const optionMap = new Map<string, RelationOption[]>();
  await Promise.all(
    targets.map(async (target) => {
      const list = await listRecords(target, { limit: RELATION_OPTION_LIMIT });
      optionMap.set(target, list.data.map(relationOption));
    }),
  );
  return fields.map((field) => {
    if (!field.relationTarget) return field;
    return {
      ...field,
      extra: {
        ...field.extra,
        relationOptions: optionMap.get(field.relationTarget) ?? [],
      },
    };
  });
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function FieldInput({ field }: { field: FieldDescriptor }) {
  const baseClass =
    "w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20";
  const fieldShell =
    "rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4";
  const labelClass =
    "block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3";

  if (field.type === "relation" || field.type === "relations") {
    return <RelationFieldEditor field={field} />;
  }

  if (field.type === "localized" || field.type === "localized-text") {
    const long = field.type === "localized-text";
    return (
      <div className={fieldShell}>
        <span className={labelClass}>
          {formatFieldName(field.name)}{" "}
          <span className="lowercase opacity-60">(IT + EN)</span>
        </span>
        <div className="grid gap-3">
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

  if (field.type === "localized-rich") {
    return <StructuredLocalizedField field={field} />;
  }

  if (field.type === "array") {
    return <StructuredArrayFieldEditor field={field} />;
  }

  return (
    <label className={`block ${fieldShell}`}>
      <span className={labelClass}>
        {formatFieldName(field.name)}{" "}
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
        <DataSelect name={field.name} defaultValue={field.value}>
          <option value="true">true</option>
          <option value="false">false</option>
        </DataSelect>
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

function StructuredLocalizedField({ field }: { field: FieldDescriptor }) {
  const locales = field.extra?.locales ?? [];
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
      <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {formatFieldName(field.name)} <span className="lowercase opacity-60">(rich text)</span>
      </span>
      <div className="grid gap-3">
        {locales.map((locale) => (
          <DataDisclosure
            key={locale.locale}
            summary={
              <span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                  {locale.locale}
                </span>
                <span className="mt-1 block text-sm leading-6 text-[var(--color-ink)]">
                  {locale.preview}
                </span>
              </span>
            }
          >
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-[var(--color-paper-muted)] p-3 text-xs leading-5 text-[var(--color-ink-muted)]">
              {locale.json}
            </pre>
          </DataDisclosure>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--color-ink-muted)]">
        Campo strutturato Payload: anteprima leggibile, modifica diretta disabilitata per evitare corruzioni.
      </p>
    </section>
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
