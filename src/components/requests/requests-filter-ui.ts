// Il colore di ogni tipo di richiesta si decide QUI, una volta sola: lo usano
// la riga della lista, la scheda e la card della bozza in chat.
import type { PillProps } from "@/components/ui";

type PillVariant = NonNullable<PillProps["variant"]>;

export const LABEL_TONES: Record<string, PillVariant> = {
  Bug: "critical",
  Feature: "accent",
  Improvement: "tertiary",
  Article: "neutral",
};
