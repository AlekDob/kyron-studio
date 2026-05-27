"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteRecord, updateRecord } from "@/lib/gateway";

interface FieldMeta {
  name: string;
  type: string;
}

export async function saveRecord(formData: FormData) {
  const slug = String(formData.get("__slug") ?? "");
  const id = String(formData.get("__id") ?? "");
  const fields = JSON.parse(
    String(formData.get("__fields") ?? "[]"),
  ) as FieldMeta[];

  const patch: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === "relation") {
      if (!isEditableRelation(formData, f.name)) continue;
      const value = String(formData.get(f.name) ?? "");
      patch[f.name] = value || null;
      continue;
    }
    if (f.type === "relations") {
      if (!isEditableRelation(formData, f.name)) continue;
      patch[f.name] = uniqueValues(formData.getAll(f.name));
      continue;
    }
    if (f.type === "array") {
      if (isEditableArray(formData, f.name)) {
        patch[f.name] = parseStructuredArray(formData, f.name);
        continue;
      }
    }
    if (f.type === "localized" || f.type === "localized-text") {
      patch[f.name] = {
        it: String(formData.get(`${f.name}__it`) ?? ""),
        en: String(formData.get(`${f.name}__en`) ?? ""),
      };
      continue;
    }
    const raw = formData.get(f.name);
    if (raw === null) continue;
    const value = typeof raw === "string" ? raw : "";
    if (f.type === "number") {
      patch[f.name] = value === "" ? null : Number(value);
    } else if (f.type === "json") {
      patch[f.name] = value === "" ? null : safeJsonParse(value);
    } else if (f.type === "date") {
      patch[f.name] = value === "" ? null : new Date(value).toISOString();
    } else if (f.type === "boolean") {
      patch[f.name] = value === "true";
    } else {
      patch[f.name] = value;
    }
  }

  await updateRecord(slug, id, patch);
  revalidatePath(`/dati/${slug}`);
  revalidatePath(`/dati/${slug}/${id}`);
}

export async function destroyRecord(formData: FormData) {
  const slug = String(formData.get("__slug") ?? "");
  const id = String(formData.get("__id") ?? "");
  await deleteRecord(slug, id);
  revalidatePath(`/dati/${slug}`);
  redirect(`/dati/${slug}`);
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function isEditableRelation(formData: FormData, name: string): boolean {
  return formData.get(`__relationEditable_${name}`) === "1";
}

function isEditableArray(formData: FormData, name: string): boolean {
  return formData.get(`__arrayEditable_${name}`) === "1";
}

function uniqueValues(values: FormDataEntryValue[]): string[] {
  const out = new Set<string>();
  values.forEach((value) => {
    if (typeof value !== "string" || !value) return;
    out.add(value);
  });
  return [...out];
}

function parseStructuredArray(formData: FormData, name: string): Record<string, unknown>[] {
  const keys = parseStringList(formData.get(`__arrayKeys_${name}`));
  const localizedKeys = new Set(parseStringList(formData.get(`__arrayLocalizedKeys_${name}`)));
  const rows = uniqueValues(formData.getAll(`__arrayRow_${name}`));

  return rows.flatMap((row) => {
    if (formData.get(`${name}__${row}__remove`) === "1") return [];

    const item: Record<string, unknown> = {};
    const id = String(formData.get(`${name}__${row}__id`) ?? "");
    if (id) item.id = id;

    let hasContent = false;
    for (const key of keys) {
      if (localizedKeys.has(key)) {
        const localized = {
          it: String(formData.get(`${name}__${row}__${key}__it`) ?? ""),
          en: String(formData.get(`${name}__${row}__${key}__en`) ?? ""),
        };
        item[key] = localized;
        if (localized.it.trim() || localized.en.trim()) hasContent = true;
        continue;
      }

      const value = String(formData.get(`${name}__${row}__${key}`) ?? "");
      item[key] = value;
      if (value.trim()) hasContent = true;
    }

    if (row === "new" && !hasContent) return [];
    return [item];
  });
}

function parseStringList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}
