"use client";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { Pill } from "./Pill";

const bubbleVariants = cva("inline-flex w-fit max-w-[78%] flex-col gap-2", {
  variants: {
    role: {
      user: "ml-auto rounded-[var(--radius-bubble)] bg-[var(--color-paper-soft)] border border-[var(--color-line)] px-4 py-3 text-[var(--color-ink)]",
      assistant: "mr-auto text-[var(--color-ink)]",
      system:
        "mx-auto rounded-[var(--radius-pill)] bg-[var(--color-action-subtle)] px-3 py-1 text-xs text-[var(--color-ink-muted)]",
    },
  },
  defaultVariants: { role: "user" },
});

function ThinkingIndicator(): ReactNode {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)]"
      aria-label="Ragionamento in corso"
    >
      <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--color-line)] border-t-[var(--color-ink-muted)] animate-spin" />
      Ragionamento
    </span>
  );
}

export interface ChatBubbleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof bubbleVariants> {
  state?: "thinking" | "streaming" | "complete" | "error";
  onRetry?: () => void;
  children?: ReactNode;
}

export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, role, state = "complete", onRetry, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(bubbleVariants({ role }), className)}
      data-state={state}
      {...props}
    >
      {state === "thinking" ? (
        <ThinkingIndicator />
      ) : (
        <div
          className={cn(
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
  ),
);
ChatBubble.displayName = "ChatBubble";
