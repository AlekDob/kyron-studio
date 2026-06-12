// Fuzzy match minimale senza dipendenze, per filtri client-side
// (es. ricerca portali nel breakdown Analytics).

// Normalizza per il match: lowercase, niente accenti.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Score del match: null = nessun match. Substring batte la sottosequenza,
// e prima compare nel target meglio e'.
export function fuzzyScore(query: string, target: string): number | null {
  const q = normalize(query.trim());
  const t = normalize(target);
  if (!q) return 0;
  const idx = t.indexOf(q);
  if (idx >= 0) return 1000 - idx;
  // Sottosequenza: tutte le lettere della query in ordine nel target
  // ("mssr" matcha "massari"). Penalizza i gap.
  let ti = 0;
  let score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    score += 10 - Math.min(9, found - ti);
    ti = found + 1;
  }
  return score;
}

// Filtra + ordina per score discendente; a parita' conserva l'ordine input.
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  text: (item: T) => string,
): T[] {
  if (!query.trim()) return items;
  return items
    .map((item, i) => ({ item, i, score: fuzzyScore(query, text(item)) }))
    .filter((x): x is { item: T; i: number; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.item);
}
