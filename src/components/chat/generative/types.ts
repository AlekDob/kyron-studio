// WS04 — Generative UI descriptor (decision-015).
// Lo studio-server emette tool result con campo `_ui` che il client
// estrae via questo helper e renderizza dal registry.

import { z } from "zod";

export const generativeDescriptorSchema = z.object({
  component: z.string().min(1),
  props: z.record(z.string(), z.unknown()),
  id: z.string().min(1),
});

export type GenerativeDescriptor = z.infer<typeof generativeDescriptorSchema>;

export function extractGenerativeDescriptor(
  result: unknown,
): GenerativeDescriptor | null {
  if (!result || typeof result !== "object") return null;
  const ui = (result as { _ui?: unknown })._ui;
  const parsed = generativeDescriptorSchema.safeParse(ui);
  return parsed.success ? parsed.data : null;
}

export interface GenerativeSubmission {
  id: string;
  component: string;
  data: unknown;
}
