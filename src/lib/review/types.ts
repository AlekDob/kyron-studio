// Source: cms/lib/review/types.ts (1:1 port for studio standalone)
// Annotation bundle schema condiviso fra studio (autore review) e
// agente Claude (applicatore). schemaVersion=1 stable contract.

export type RevNodeKind = "text" | "image" | "section";

export type AnnotationSource =
  | { kind: "jsx"; file: string; contentKey: string; locale: "it" | "en" }
  | {
      kind: "cms";
      ref:
        | { type: "global"; slug: string }
        | { type: "collection"; collection: "bandi" | "eventi"; docId: string };
      fieldPath: string;
      locale: "it" | "en";
    }
  | {
      // NEW per studio: cattura libera da iframe (selector CSS + URL pagina)
      kind: "dom";
      url: string;
      selector: string;
      locale: "it" | "en";
    };

export type AnnotationKind =
  | "edit-text"
  | "replace-image"
  | "comment"
  | "add-section"
  | "restructure";

export type AnnotationStatus =
  | "open"
  | "applied"
  | "rejected"
  | "needs-clarification";

export interface Annotation {
  id: string;
  urn: string;
  source: AnnotationSource;
  page: string;
  kind: AnnotationKind;
  original: { text?: string; assetSrc?: string };
  proposal: {
    text?: string;
    note?: string;
    newAssetHint?: string;
    position?: "before" | "after" | "replace";
  };
  status: AnnotationStatus;
  createdAt: string;
  reviewer: string;
}

export interface AnnotationBundle {
  schemaVersion: 1;
  generatedAt: string;
  baseRef: string;
  site: string;
  annotations: Annotation[];
}
