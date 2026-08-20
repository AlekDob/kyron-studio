"use client";

import { Blobatar } from "blobatar/react";
import type { ReactElement } from "react";
import { cn } from "@/lib/cn";

// Avatar dell'agente in chat. blobatar genera forma e colore in modo
// deterministico dal nome: ogni agente ha sempre la sua faccia e il suo colore,
// diverso dagli altri. La hue resta libera (e' quella che li distingue), il tone
// e' bloccato: senza lock alcuni nomi escono quasi neri e non si leggono.
// Statico di proposito: `animate` costringerebbe a SVG inline (~12 nodi per
// messaggio) per un'animazione che in una lista di chat non serve.
const AVATAR_TONE = 0.45;

export function ChatAvatar({
  name,
  size = 36,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}): ReactElement {
  return (
    <Blobatar
      name={name}
      size={size}
      tone={AVATAR_TONE}
      title={name}
      className={cn("shrink-0", className)}
    />
  );
}
