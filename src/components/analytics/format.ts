// Formattatori condivisi del modulo Analytics (it-IT, EUR).

const intFmt = new Intl.NumberFormat("it-IT");
const eurFmt = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const pctFmt = new Intl.NumberFormat("it-IT", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function fmtInt(n: number): string {
  return intFmt.format(n);
}

export function fmtEur(n: number): string {
  return eurFmt.format(n);
}

export function fmtPct(ratio: number): string {
  return pctFmt.format(ratio);
}
