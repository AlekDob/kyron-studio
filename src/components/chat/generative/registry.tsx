"use client";

import { lazy, Suspense, type ReactElement } from "react";
import type {
  GenerativeDescriptor,
  GenerativeSubmission,
} from "./types";

// Lazy: ogni componente generativo e' un chunk separato. Domani aggiungiamo
// BundleBuilder, DiscountConfig, Summary qui senza toccare nessun altro file.
const ProductPicker = lazy(() =>
  import("./ProductPicker").then((m) => ({ default: m.ProductPicker })),
);
const BundleBuilder = lazy(() =>
  import("./BundleBuilder").then((m) => ({ default: m.BundleBuilder })),
);
const LogoUploader = lazy(() =>
  import("./LogoUploader").then((m) => ({ default: m.LogoUploader })),
);

const COMPONENT_REGISTRY: Record<
  string,
  React.ComponentType<Record<string, unknown>>
> = {
  ProductPicker: ProductPicker as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  BundleBuilder: BundleBuilder as unknown as React.ComponentType<
    Record<string, unknown>
  >,
  LogoUploader: LogoUploader as unknown as React.ComponentType<
    Record<string, unknown>
  >,
};

export function isRegisteredComponent(name: string): boolean {
  return name in COMPONENT_REGISTRY;
}

interface GenerativeRendererProps {
  descriptor: GenerativeDescriptor;
  readOnly?: boolean;
  disabled?: boolean;
  initialSubmission?: GenerativeSubmission | null;
  onSubmit?: (submission: GenerativeSubmission) => void;
}

export function GenerativeRenderer(props: GenerativeRendererProps): ReactElement {
  const { descriptor, readOnly, disabled, initialSubmission, onSubmit } = props;
  const Component = COMPONENT_REGISTRY[descriptor.component];

  if (!Component) {
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] p-3 text-xs text-[var(--color-ink-muted)]">
        Componente generativo sconosciuto: <code>{descriptor.component}</code>
      </div>
    );
  }

  const handleSubmit = (data: unknown): void => {
    onSubmit?.({
      id: descriptor.id,
      component: descriptor.component,
      data,
    });
  };

  const initialPropsFromSubmission =
    initialSubmission && initialSubmission.id === descriptor.id
      ? extractInitialProps(descriptor.component, initialSubmission.data)
      : {};

  return (
    <Suspense fallback={<GenerativeSkeleton />}>
      <Component
        {...descriptor.props}
        {...initialPropsFromSubmission}
        readOnly={readOnly ?? Boolean(initialSubmission)}
        disabled={disabled ?? false}
        onSubmit={handleSubmit}
      />
    </Suspense>
  );
}

function GenerativeSkeleton(): ReactElement {
  return (
    <div
      aria-busy="true"
      className="h-32 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)]"
    />
  );
}

function extractInitialProps(
  component: string,
  data: unknown,
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const d = data as Record<string, unknown>;
  if (component === "ProductPicker") {
    if (Array.isArray(d.selectedSlugs)) {
      return { initialSelection: d.selectedSlugs };
    }
  }
  if (component === "BundleBuilder") {
    const out: Record<string, unknown> = {};
    if (typeof d.name === "string") out.initialName = d.name;
    if (typeof d.priceEur === "number") out.initialPriceEur = d.priceEur;
    if (Array.isArray(d.components)) out.initialComponents = d.components;
    return out;
  }
  if (component === "LogoUploader") {
    if (typeof d.uploaded === "boolean") {
      return { initialUploaded: d.uploaded };
    }
  }
  return {};
}
