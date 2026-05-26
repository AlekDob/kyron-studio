// Source: cms/lib/review/urn.ts (extended with kind:dom for studio iframe captures)
// URN deterministico che ancora un'annotazione alla sorgente DOM/dato.
//
//   kyron-rev://jsx/<file>#<contentKey>@<locale>
//   kyron-rev://cms/global/<slug>#<fieldPath>@<locale>
//   kyron-rev://cms/collection/<coll>/<docId>#<fieldPath>@<locale>
//   kyron-rev://dom/<urlEncoded>#<selectorEncoded>@<locale>   (studio)

import type { AnnotationSource } from "./types";

const PREFIX = "kyron-rev://";

export function buildUrn(source: AnnotationSource): string {
  if (source.kind === "jsx") {
    return `${PREFIX}jsx/${source.file}#${source.contentKey}@${source.locale}`;
  }
  if (source.kind === "dom") {
    return `${PREFIX}dom/${encodeURIComponent(source.url)}#${encodeURIComponent(source.selector)}@${source.locale}`;
  }
  const ref =
    source.ref.type === "global"
      ? `global/${source.ref.slug}`
      : `collection/${source.ref.collection}/${source.ref.docId}`;
  return `${PREFIX}cms/${ref}#${source.fieldPath}@${source.locale}`;
}

export function parseUrn(urn: string): AnnotationSource | null {
  if (!urn.startsWith(PREFIX)) return null;
  const body = urn.slice(PREFIX.length);
  const slash = body.indexOf("/");
  const hash = body.indexOf("#");
  if (slash < 0 || hash < 0 || hash < slash) return null;

  const kind = body.slice(0, slash);
  const refPart = body.slice(slash + 1, hash);
  const fieldAndLoc = body.slice(hash + 1);
  const at = fieldAndLoc.lastIndexOf("@");
  if (at < 0) return null;
  const fieldPath = fieldAndLoc.slice(0, at);
  const locale = fieldAndLoc.slice(at + 1);
  if (locale !== "it" && locale !== "en") return null;
  if (!fieldPath) return null;

  if (kind === "jsx") {
    if (!refPart) return null;
    return { kind: "jsx", file: refPart, contentKey: fieldPath, locale };
  }
  if (kind === "dom") {
    return {
      kind: "dom",
      url: decodeURIComponent(refPart),
      selector: decodeURIComponent(fieldPath),
      locale,
    };
  }
  if (kind === "cms") {
    const parts = refPart.split("/");
    if (parts[0] === "global" && parts[1]) {
      return { kind: "cms", ref: { type: "global", slug: parts[1] }, fieldPath, locale };
    }
    if (
      parts[0] === "collection" &&
      (parts[1] === "bandi" || parts[1] === "eventi") &&
      parts[2]
    ) {
      return {
        kind: "cms",
        ref: { type: "collection", collection: parts[1], docId: parts[2] },
        fieldPath,
        locale,
      };
    }
  }
  return null;
}
