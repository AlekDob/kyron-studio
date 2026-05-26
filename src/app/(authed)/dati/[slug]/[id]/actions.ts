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
    if (f.type === "relation" || f.type === "relations") continue;
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
