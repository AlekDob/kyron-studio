// Stato del portale in parole e colore del Pill. Condiviso tra pannello e drawer.
export const STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  review: "Da rivedere",
  approved: "Approvato",
  onboarded: "Live",
};

export const STATUS_VARIANT: Record<
  string,
  "neutral" | "warning" | "accent" | "tertiary"
> = {
  draft: "neutral",
  review: "warning",
  approved: "accent",
  onboarded: "tertiary",
};
