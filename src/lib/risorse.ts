// Opzioni dei select della collection Payload `Risorse`.
// Copia consapevole di `cms/components/risorse/risorseLabels.ts`: studio e cms
// sono repo separati, non c'e' import possibile. Se aggiungi un valore in
// `cms/collections/Risorse.ts`, aggiornalo anche qui (e viceversa).

export interface Option {
  value: string;
  label: string;
}

const opts = (map: Record<string, string>): Option[] =>
  Object.entries(map).map(([value, label]) => ({ value, label }));

export const CATEGORIE = opts({
  cataloghi: "Cataloghi Kyron",
  brochure: "Brochure",
  matrici: "Matrici e tabelle",
  "progetti-finanziamenti": "Progetti per i bandi",
  "materiali-didattici": "Materiali didattici",
});

export const AMBITI = opts({
  apple: "Apple in Education",
  google: "Google for Education",
  adobe: "Adobe in Education",
  jamf: "Jamf",
  canva: "Canva",
  wacebo: "Wacebo",
  smartarreda: "SmartArreda",
  inclusione: "Inclusione",
  laboratori: "Laboratori",
  formazione: "Formazione",
  bandi: "Bandi e finanziamenti",
});

export const DESTINATARI = opts({
  dirigente: "Dirigente scolastico",
  dsga: "DSGA",
  docente: "Docente",
  genitore: "Genitore / Famiglia",
});

export const TIPI_FILE = opts({
  pdf: "PDF da scaricare",
  sfogliabile: "Sfogliabile online (link)",
  zip: "Pacchetto ZIP",
  link: "Link esterno",
});

// pdf/zip vogliono un file caricato, sfogliabile/link un URL.
export const TIPI_CON_FILE = ["pdf", "zip"];

export interface MediaRef {
  id: string;
  filename: string;
  url: string;
}

export interface Localized {
  it: string;
  en: string;
}

export interface RisorsaValues {
  id: string;
  titolo: Localized;
  slug: string;
  descrizioneBreve: Localized;
  descrizioneEstesa: Localized;
  meta: Localized;
  categoria: string;
  ambiti: string[];
  destinatari: string[];
  tipoFile: string;
  url: string;
  file: MediaRef | null;
  copertina: MediaRef | null;
  dataAggiornamento: string;
  inEvidenza: boolean;
  ordine: string;
  pubblicata: boolean;
}

function loc(value: unknown): Localized {
  if (typeof value === "string") return { it: value, en: "" };
  if (value && typeof value === "object") {
    const v = value as { it?: unknown; en?: unknown };
    return {
      it: typeof v.it === "string" ? v.it : "",
      en: typeof v.en === "string" ? v.en : "",
    };
  }
  return { it: "", en: "" };
}

function media(value: unknown): MediaRef | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { id?: unknown; filename?: unknown; url?: unknown };
  if (v.id == null) return null;
  return {
    id: String(v.id),
    filename: typeof v.filename === "string" ? v.filename : "",
    url: typeof v.url === "string" ? v.url : "",
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
}

export const EMPTY_RISORSA: RisorsaValues = {
  id: "",
  titolo: { it: "", en: "" },
  slug: "",
  descrizioneBreve: { it: "", en: "" },
  descrizioneEstesa: { it: "", en: "" },
  meta: { it: "", en: "" },
  categoria: CATEGORIE[0].value,
  ambiti: [],
  destinatari: [],
  tipoFile: "pdf",
  url: "",
  file: null,
  copertina: null,
  dataAggiornamento: "",
  inEvidenza: false,
  ordine: "",
  pubblicata: true,
};

// Il doc arriva da Payload con locale=all: i campi localizzati sono {it,en} e i
// media sono oggetti espansi (depth=1).
export function toRisorsaValues(doc: Record<string, unknown>): RisorsaValues {
  return {
    id: String(doc.id ?? ""),
    titolo: loc(doc.titolo),
    slug: typeof doc.slug === "string" ? doc.slug : "",
    descrizioneBreve: loc(doc.descrizioneBreve),
    descrizioneEstesa: loc(doc.descrizioneEstesa),
    meta: loc(doc.meta),
    categoria: typeof doc.categoria === "string" ? doc.categoria : "",
    ambiti: strings(doc.ambiti),
    destinatari: strings(doc.destinatari),
    tipoFile: typeof doc.tipoFile === "string" ? doc.tipoFile : "pdf",
    url: typeof doc.url === "string" ? doc.url : "",
    file: media(doc.file),
    copertina: media(doc.copertina),
    dataAggiornamento:
      typeof doc.dataAggiornamento === "string"
        ? doc.dataAggiornamento.slice(0, 10)
        : "",
    inEvidenza: doc.inEvidenza === true,
    ordine: doc.ordine == null ? "" : String(doc.ordine),
    pubblicata: doc._status !== "draft",
  };
}

export function labelOf(options: Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

// Slug proposto dal titolo: minuscole, accenti via, trattini.
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
