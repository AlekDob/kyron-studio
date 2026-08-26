"use client";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { SPHERE_GRADIENT } from "@studiofuturo/studio-core";
import { Pill } from "@studiofuturo/studio-core";

const bubbleVariants = cva("flex w-fit max-w-[78%]", {
  variants: {
    role: {
      user: "ml-auto flex-col rounded-[var(--radius-bubble)] bg-[var(--color-paper-soft)] border border-[var(--color-line)] px-4 py-3 text-[var(--color-ink)]",
      // L'assistente non ha bolla: avatar + nome a sinistra e testo nudo, come
      // in Virgilio. La bolla la porta solo l'utente, cosi' si distinguono
      // senza colorare mezza schermata.
      assistant: "mr-auto flex-row items-start gap-3 text-[var(--color-ink)]",
      system:
        "mx-auto flex-col rounded-[var(--radius-pill)] bg-[var(--color-action-subtle)] px-3 py-1 text-xs text-[var(--color-ink-muted)]",
    },
  },
  defaultVariants: { role: "user" },
});

// Tre sfere del brand che respirano in sequenza: stessa gradiente del marchio
// nella sidebar, cosi' il loader parla la lingua del resto dello Studio.
function ThinkingIndicator(): ReactNode {
  return (
    <span
      className="inline-flex items-center gap-1.5 py-1.5"
      aria-label="Ragionamento in corso"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="chat-thinking-dot h-2 w-2 rounded-full"
          style={{
            background: SPHERE_GRADIENT,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

export interface ChatBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof bubbleVariants> {
  state?: "thinking" | "streaming" | "complete" | "error";
  /** Nome mostrato sopra la risposta e seed dell'avatar (solo role assistant). */
  agent?: string;
  onRetry?: () => void;
  children?: ReactNode;
}

export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  (
    {
      className,
      role,
      state = "complete",
      agent = "Agente Studio",
      onRetry,
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(bubbleVariants({ role }), className)}
      data-state={state}
      {...props}
    >
      {role === "assistant" && <ChatAvatar name={agent} className="mt-0.5" />}
      <div className="flex min-w-0 flex-col gap-1.5">
        {role === "assistant" && (
          <span className="text-[11px] font-medium leading-none text-[var(--color-ink-soft)]">
            {agent}
          </span>
        )}
        {state === "thinking" ? (
          <ThinkingIndicator />
        ) : (
          <div
            className={cn(
              "text-sm leading-relaxed",
              state === "streaming" &&
                "after:ml-0.5 after:inline-block after:h-[1em] after:w-px after:animate-pulse after:bg-current after:align-middle",
            )}
          >
            {children}
          </div>
        )}
        {state === "error" && (
          <div className="flex items-center gap-2">
            <Pill variant="critical" size="sm">
              Errore
            </Pill>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Riprova
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";
