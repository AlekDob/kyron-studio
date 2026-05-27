import { DataDisclosure } from "@/components/data/DataDisclosure";
import { DataSelect } from "@/components/data/DataSelect";
import { formatFieldName, type FieldDescriptor } from "@/lib/data-fields";

interface Props {
  field: FieldDescriptor;
}

export function RelationFieldEditor({ field }: Props) {
  const rels = field.extra?.relations ?? [];
  const options = field.extra?.relationOptions ?? [];
  const editable = options.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
      <span className="block text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        {formatFieldName(field.name)}{" "}
        <span className="lowercase opacity-60">
          (relazione{field.type === "relations" ? "i" : ""})
        </span>
      </span>
      {editable ? <EditableRelation field={field} /> : <ReadonlyRelation rels={rels} />}
    </div>
  );
}

function EditableRelation({ field }: { field: FieldDescriptor }) {
  const currentIds = new Set(
    (field.extra?.relations ?? []).map((relation) => String(relation.id)),
  );
  const options = field.extra?.relationOptions ?? [];
  const current = options.filter((option) => currentIds.has(String(option.id)));
  const available = options.filter((option) => !currentIds.has(String(option.id)));

  return (
    <div className="space-y-3">
      <input type="hidden" name={`__relationEditable_${field.name}`} value="1" />
      {field.type === "relation" ? (
        <SingleRelationSelect field={field} options={options} />
      ) : (
        <MultiRelationPicker
          name={field.name}
          current={current}
          available={available}
        />
      )}
    </div>
  );
}

function SingleRelationSelect({
  field,
  options,
}: {
  field: FieldDescriptor;
  options: NonNullable<FieldDescriptor["extra"]>["relationOptions"];
}) {
  const selectedId = field.extra?.relations?.[0]?.id;
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
        Seleziona
      </span>
      <DataSelect
        name={field.name}
        defaultValue={selectedId === undefined ? "" : String(selectedId)}
      >
        <option value="">Nessuna relazione</option>
        {options?.map((option) => (
          <option key={String(option.id)} value={String(option.id)}>
            {option.label}
          </option>
        ))}
      </DataSelect>
    </label>
  );
}

function MultiRelationPicker({
  name,
  current,
  available,
}: {
  name: string;
  current: NonNullable<FieldDescriptor["extra"]>["relationOptions"];
  available: NonNullable<FieldDescriptor["extra"]>["relationOptions"];
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        {current?.length ? (
          current.map((option) => (
            <label
              key={String(option.id)}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                name={name}
                value={String(option.id)}
                defaultChecked
                className="size-4 rounded border-[var(--color-line)]"
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <span className="text-xs text-[var(--color-ink-muted)]">
                togli spunta per rimuovere
              </span>
            </label>
          ))
        ) : (
          <span className="text-sm italic text-[var(--color-ink-muted)]">nessuna</span>
        )}
      </div>
      {available?.length ? (
        <DataDisclosure summary="Aggiungi relazioni">
          <div className="mt-3 grid max-h-64 gap-2 overflow-auto pr-1">
            {available.map((option) => (
              <label
                key={String(option.id)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--color-paper-soft)]"
              >
                <input
                  type="checkbox"
                  name={name}
                  value={String(option.id)}
                  className="size-4 rounded border-[var(--color-line)]"
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </label>
            ))}
          </div>
        </DataDisclosure>
      ) : null}
    </div>
  );
}

function ReadonlyRelation({
  rels,
}: {
  rels: NonNullable<FieldDescriptor["extra"]>["relations"];
}) {
  if (!rels?.length) {
    return <span className="text-sm italic text-[var(--color-ink-muted)]">nessuna</span>;
  }
  const compact = rels.length > 3 && rels.every((relation) => !relation.label);
  if (compact) {
    return (
      <DataDisclosure summary={`${rels.length} elementi collegati`}>
        <ReadonlyRelationChips rels={rels} />
      </DataDisclosure>
    );
  }
  return <ReadonlyRelationChips rels={rels} />;
}

function ReadonlyRelationChips({
  rels = [],
}: {
  rels: NonNullable<FieldDescriptor["extra"]>["relations"];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 first:mt-0">
      {rels.map((relation) => (
        <span
          key={String(relation.id)}
          className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-xs"
        >
          <span className="font-mono text-[var(--color-ink-muted)]">
            #{relation.id}
          </span>
          {relation.label && relation.label !== `#${relation.id}` ? (
            <span className="truncate">{relation.label}</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}
