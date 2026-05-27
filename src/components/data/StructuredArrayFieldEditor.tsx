import { Plus, Trash2 } from "lucide-react";
import { DataDisclosure } from "@/components/data/DataDisclosure";
import { formatFieldName, type FieldDescriptor } from "@/lib/data-fields";

interface Props {
  field: FieldDescriptor;
}

export function StructuredArrayFieldEditor({ field }: Props) {
  const rows = field.extra?.arrayRows ?? [];
  const keys = field.extra?.arrayKeys ?? [];
  const localizedKeys = new Set(field.extra?.arrayLocalizedKeys ?? []);

  if (!keys.length) {
    return (
      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
        <span className="mb-3 block text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
          {formatFieldName(field.name)} <span className="lowercase opacity-60">(array)</span>
        </span>
        <textarea
          name={field.name}
          defaultValue={field.value}
          rows={6}
          className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
      <span className="mb-3 block text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">
        {formatFieldName(field.name)} <span className="lowercase opacity-60">(array)</span>
      </span>
      <input type="hidden" name={`__arrayEditable_${field.name}`} value="1" />
      <input type="hidden" name={`__arrayKeys_${field.name}`} value={JSON.stringify(keys)} />
      <input
        type="hidden"
        name={`__arrayLocalizedKeys_${field.name}`}
        value={JSON.stringify([...localizedKeys])}
      />

      <div className="grid gap-3">
        {rows.length ? (
          rows.map((row, index) => (
            <div
              key={row.id === undefined ? index : String(row.id)}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
            >
              <input type="hidden" name={`__arrayRow_${field.name}`} value={String(index)} />
              {row.id !== undefined ? (
                <input
                  type="hidden"
                  name={`${field.name}__${index}__id`}
                  value={String(row.id)}
                />
              ) : null}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                  Elemento {index + 1}
                </span>
                <label className="inline-flex items-center gap-1.5 text-xs text-red-600">
                  <input
                    type="checkbox"
                    name={`${field.name}__${index}__remove`}
                    value="1"
                    className="size-3.5 rounded border-[var(--color-line)]"
                  />
                  <Trash2 aria-hidden="true" className="size-3.5" />
                  Rimuovi
                </label>
              </div>
              <ArrayRowFields
                fieldName={field.name}
                rowKey={String(index)}
                keys={keys}
                localizedKeys={localizedKeys}
                values={row.cells}
              />
            </div>
          ))
        ) : (
          <span className="text-sm italic text-[var(--color-ink-muted)]">nessun elemento</span>
        )}

        <DataDisclosure
          summary={
            <span className="inline-flex items-center gap-2">
              <Plus aria-hidden="true" className="size-4" />
              Aggiungi elemento
            </span>
          }
        >
          <input type="hidden" name={`__arrayRow_${field.name}`} value="new" />
          <div className="mt-3 rounded-lg bg-[var(--color-paper-soft)] p-3">
            <ArrayRowFields
              fieldName={field.name}
              rowKey="new"
              keys={keys}
              localizedKeys={localizedKeys}
              values={{}}
            />
          </div>
        </DataDisclosure>
      </div>
    </section>
  );
}

function ArrayRowFields({
  fieldName,
  rowKey,
  keys,
  localizedKeys,
  values,
}: {
  fieldName: string;
  rowKey: string;
  keys: string[];
  localizedKeys: Set<string>;
  values: Record<string, string | { it: string; en: string }>;
}) {
  return (
    <div className="grid gap-3">
      {keys.map((key) => {
        const value = values[key];
        if (localizedKeys.has(key)) {
          const localized = typeof value === "object" && value ? value : { it: "", en: "" };
          return (
            <div key={key} className="grid gap-2">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
                {formatFieldName(key)}
              </span>
              <LocaleInput fieldName={fieldName} rowKey={rowKey} name={key} locale="it" value={localized.it} />
              <LocaleInput fieldName={fieldName} rowKey={rowKey} name={key} locale="en" value={localized.en} />
            </div>
          );
        }
        return (
          <label key={key} className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
              {formatFieldName(key)}
            </span>
            <input
              type="text"
              name={`${fieldName}__${rowKey}__${key}`}
              defaultValue={typeof value === "string" ? value : ""}
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
            />
          </label>
        );
      })}
    </div>
  );
}

function LocaleInput({
  fieldName,
  rowKey,
  name,
  locale,
  value,
}: {
  fieldName: string;
  rowKey: string;
  name: string;
  locale: "it" | "en";
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
        {locale.toUpperCase()}
      </span>
      <input
        type="text"
        name={`${fieldName}__${rowKey}__${name}__${locale}`}
        defaultValue={value}
        className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ink)]/20"
      />
    </label>
  );
}
