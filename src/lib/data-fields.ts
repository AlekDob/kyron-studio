import type { PayloadDoc } from "@/lib/gateway";

export type FieldType =
  | "string"
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "array"
  | "localized"
  | "localized-text"
  | "localized-rich"
  | "relation"
  | "relations"
  | "json";

export interface RelationValue {
  id: string | number;
  label: string;
}

export interface RelationOption extends RelationValue {
  slug?: string;
}

export interface StructuredArrayRow {
  id?: string | number;
  cells: Record<string, string | { it: string; en: string }>;
}

export interface FieldDescriptor {
  name: string;
  type: FieldType;
  value: string;
  relationTarget?: string;
  extra?: {
    it?: string;
    en?: string;
    relations?: RelationValue[];
    relationOptions?: RelationOption[];
    arrayRows?: StructuredArrayRow[];
    arrayKeys?: string[];
    arrayLocalizedKeys?: string[];
    locales?: Array<{ locale: string; preview: string; json: string }>;
  };
}

const HIDDEN_KEYS = new Set(["id", "createdAt", "updatedAt", "_status", "tenant"]);

const RELATION_TARGETS: Record<string, string> = {
  brand: "brands",
  categories: "product-categories",
  heroImage: "media",
  parentProduct: "products",
  related: "products",
};

export function buildFields(doc: PayloadDoc): FieldDescriptor[] {
  return Object.entries(doc)
    .filter(([key]) => !HIDDEN_KEYS.has(key))
    .map(([name, value]) => detectField(name, value));
}

export function formatFieldName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

export function isLocalizedObject(value: unknown): value is { it?: string; en?: string } {
  if (!value || typeof value !== "object") return false;
  const keys = Object.keys(value as object);
  if (keys.length === 0 || keys.length > 3) return false;
  return keys.every((key) => key === "it" || key === "en" || key === "fr");
}

export function parseLocalizedString(value: string): { it?: string; en?: string } | null {
  if (!value.trim().startsWith("{")) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isLocalizedObject(parsed)) return null;
    return parsed as { it?: string; en?: string };
  } catch {
    return null;
  }
}

export function relationLabel(record: Record<string, unknown>): string {
  const name = record.name;
  if (name && typeof name === "object" && "it" in name) {
    return String((name as { it: unknown }).it);
  }
  if (typeof name === "string") return localizedStringLabel(name);
  const title = record.title;
  if (title && typeof title === "object" && "it" in title) {
    return String((title as { it: unknown }).it);
  }
  if (typeof record.titolo === "string") return localizedStringLabel(record.titolo);
  if (typeof record.title === "string") return localizedStringLabel(record.title);
  if (typeof record.slug === "string") return record.slug;
  return `#${record.id}`;
}

export function pickRecordTitle(doc: PayloadDoc): string {
  for (const key of ["titolo", "title", "name", "nome", "slug", "email"]) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return localizedStringLabel(value);
    if (isLocalizedObject(value)) {
      const label = value.it ?? value.en;
      if (typeof label === "string" && label.trim()) return label;
    }
  }
  return `Record #${String(doc.id)}`;
}

export function relationOption(doc: PayloadDoc): RelationOption {
  return {
    id: doc.id,
    label: relationLabel(doc),
    slug: typeof doc.slug === "string" ? doc.slug : undefined,
  };
}

function localizedStringLabel(value: string): string {
  const localized = parseLocalizedString(value);
  return localized?.it ?? localized?.en ?? value;
}

function detectField(name: string, value: unknown): FieldDescriptor {
  if (typeof value === "string") return stringField(name, value);
  if (typeof value === "number") return { name, type: "number", value: String(value) };
  if (typeof value === "boolean") return { name, type: "boolean", value: String(value) };
  if (value === null || value === undefined) return { name, type: "string", value: "" };
  if (isLocalizedObject(value)) return localizedField(name, value);
  if (Array.isArray(value)) return arrayField(name, value);
  if (isRelation(value)) return relationField(name, value);
  return { name, type: "json", value: JSON.stringify(value, null, 2) };
}

function stringField(name: string, value: string): FieldDescriptor {
  const localized = parseLocalizedString(value);
  if (localized) return detectField(name, localized);
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return { name, type: "date", value: value.slice(0, 10) };
  }
  return { name, type: value.length > 120 ? "text" : "string", value };
}

function localizedField(name: string, value: { it?: unknown; en?: unknown }): FieldDescriptor {
  const it = value.it ?? "";
  const en = value.en ?? "";
  if (![it, en].every((locale) => typeof locale === "string")) {
    return {
      name,
      type: "localized-rich",
      value: "",
      extra: {
        locales: [
          { locale: "IT", preview: compactPreview(it), json: JSON.stringify(it, null, 2) },
          { locale: "EN", preview: compactPreview(en), json: JSON.stringify(en, null, 2) },
        ],
      },
    };
  }
  const itText = String(it);
  const enText = String(en);
  return {
    name,
    type: itText.length > 120 || enText.length > 120 ? "localized-text" : "localized",
    value: "",
    extra: { it: itText, en: enText },
  };
}

function arrayField(name: string, value: unknown[]): FieldDescriptor {
  const relationTarget = RELATION_TARGETS[name];
  if (relationTarget && value.every((item) => isRelation(item))) {
    return relationsField(
      name,
      value.map((item) => ({
        id: item.id,
        label: relationLabel(item as Record<string, unknown>),
      })),
    );
  }
  if (relationTarget && value.every((item) => isRelationId(item))) {
    return relationsField(name, value.map((id) => ({ id, label: "" })));
  }
  const rows = structuredRows(value);
  if (rows?.length) {
    const keys = arrayKeys(rows);
    return {
      name,
      type: "array",
      value: JSON.stringify(value, null, 2),
      extra: {
        arrayRows: rows,
        arrayKeys: keys,
        arrayLocalizedKeys: localizedArrayKeys(rows, keys),
      },
    };
  }
  return { name, type: "json", value: JSON.stringify(value, null, 2) };
}

function relationField(name: string, value: { id: string | number }): FieldDescriptor {
  return {
    name,
    type: "relation",
    value: "",
    relationTarget: RELATION_TARGETS[name],
    extra: {
      relations: [
        {
          id: value.id,
          label: relationLabel(value as Record<string, unknown>),
        },
      ],
    },
  };
}

function relationsField(name: string, relations: RelationValue[]): FieldDescriptor {
  return {
    name,
    type: "relations",
    value: "",
    relationTarget: RELATION_TARGETS[name],
    extra: { relations },
  };
}

function structuredRows(value: unknown[]): StructuredArrayRow[] | null {
  const rows: StructuredArrayRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;

    const cells: StructuredArrayRow["cells"] = {};
    for (const [key, cell] of Object.entries(item)) {
      if (key === "id") continue;
      if (isLocalizedObject(cell)) {
        cells[key] = {
          it: typeof cell.it === "string" ? cell.it : "",
          en: typeof cell.en === "string" ? cell.en : "",
        };
        continue;
      }
      if (!isStructuredScalar(cell)) return null;
      cells[key] = scalarPreview(cell);
    }

    const record = item as Record<string, unknown>;
    const id = record.id;
    rows.push({
      id: typeof id === "string" || typeof id === "number" ? id : undefined,
      cells,
    });
  }
  return rows;
}

function arrayKeys(rows: StructuredArrayRow[]): string[] {
  const keys = new Set<string>();
  rows.forEach((row) => {
    Object.keys(row.cells).forEach((key) => keys.add(key));
  });
  return [...keys];
}

function localizedArrayKeys(rows: StructuredArrayRow[], keys: string[]): string[] {
  return keys.filter((key) =>
    rows.some((row) => {
      const value = row.cells[key];
      return !!value && typeof value === "object";
    }),
  );
}

function scalarPreview(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return localizedStringLabel(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "";
}

function isStructuredScalar(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isRelation(value: unknown): value is { id: string | number } {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in (value as Record<string, unknown>) &&
    (value as { id: unknown }).id !== undefined
  );
}

function isRelationId(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function previewValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(previewValue).join(" ");
  if (!value || typeof value !== "object") return "";
  const record = value as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if ("children" in record) return previewValue(record.children);
  return Object.values(record).map(previewValue).filter(Boolean).join(" ");
}

function compactPreview(value: unknown): string {
  const preview = previewValue(value).replace(/\s+/g, " ").trim();
  if (!preview) return "Contenuto strutturato";
  return preview.length > 280 ? `${preview.slice(0, 280)}...` : preview;
}
