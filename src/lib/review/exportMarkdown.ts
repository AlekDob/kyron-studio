// Source: cms/lib/review/exportMarkdown.ts (1:1 port + kind:dom rendering)
// Serializza il bundle in markdown ibrido (umano + JSON contract).

import type { Annotation, AnnotationBundle } from "./types";

export function buildBundle(
  annotations: Annotation[],
  baseRef: string,
  site: string,
): AnnotationBundle {
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseRef,
    site,
    annotations,
  };
}

function srcLine(a: Annotation): string {
  const s = a.source;
  if (s.kind === "jsx") {
    return `jsx \`${s.file}\` → \`${s.contentKey}\` (${s.locale})`;
  }
  if (s.kind === "dom") {
    return `dom \`${s.url}\` → \`${s.selector}\` (${s.locale})`;
  }
  const ref =
    s.ref.type === "global"
      ? `global \`${s.ref.slug}\``
      : `collection \`${s.ref.collection}/${s.ref.docId}\``;
  return `cms ${ref} → \`${s.fieldPath}\` (${s.locale})`;
}

export function bundleToMarkdown(bundle: AnnotationBundle): string {
  const lines: string[] = [];
  lines.push(`# Revisione Kyron — ${bundle.generatedAt}`);
  lines.push("");
  lines.push(`- Sito: \`${bundle.site}\``);
  lines.push(`- Riferimento build: \`${bundle.baseRef}\``);
  lines.push(`- Annotazioni: ${bundle.annotations.length}`);
  lines.push("");

  bundle.annotations.forEach((a, i) => {
    lines.push(`## ${i + 1}. [${a.kind}] ${a.page}`);
    lines.push("");
    lines.push(`- Sorgente: ${srcLine(a)}`);
    if (a.original.text) lines.push(`- Testo attuale: ${a.original.text}`);
    if (a.original.assetSrc) lines.push(`- Immagine attuale: \`${a.original.assetSrc}\``);
    if (a.proposal.text) lines.push(`- Proposta: ${a.proposal.text}`);
    if (a.proposal.newAssetHint)
      lines.push(`- Immagine desiderata: ${a.proposal.newAssetHint}`);
    if (a.proposal.position) lines.push(`- Posizione: ${a.proposal.position}`);
    if (a.proposal.note) lines.push(`- Nota: ${a.proposal.note}`);
    lines.push(`- Revisore: ${a.reviewer} · ${a.createdAt}`);
    lines.push("");
  });

  lines.push("---");
  lines.push("");
  lines.push("<!-- BUNDLE-JSON: non modificare, usato dall'agente -->");
  lines.push("```json");
  lines.push(JSON.stringify(bundle, null, 2));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

export function parseBundleFromMarkdown(md: string): AnnotationBundle {
  const m = md.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) throw new Error("blocco JSON del bundle non trovato nel markdown");
  const parsed = JSON.parse(m[1]) as AnnotationBundle;
  if (parsed.schemaVersion !== 1) {
    throw new Error(`schemaVersion non supportata: ${parsed.schemaVersion}`);
  }
  return parsed;
}
