import { redirect, notFound } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { getPortal } from "@/lib/gateway";
import { PortalsWorkspace } from "@/components/portals/PortalsWorkspace";
import { PortalDetail } from "@/components/portals/PortalDetail";
import { GatewayError } from "@/lib/gateway";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PortalDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(loginUrl());
  }

  const { slug } = await params;

  let portal;
  try {
    portal = await getPortal(slug);
  } catch (err) {
    if (err instanceof GatewayError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <PortalsWorkspace slug={slug}>
      <main className="px-8 py-12 max-w-3xl mx-auto">
        <header className="mb-8">
          <p className="eyebrow mb-2">
            <a
              href="/portals"
              className="text-[var(--color-accent)] hover:underline"
            >
              Portali
            </a>
            {" / "}
            {portal.nome}
          </p>
          <h1 className="text-3xl font-medium tracking-tight">
            {portal.nome}
          </h1>
          <p className="text-[var(--color-ink-muted)] mt-2 text-sm">
            {portal.city} ({portal.countryArea}) · {portal.productCount}{" "}
            prodotti · {portal.bundleCount} kit
          </p>
        </header>
        <PortalDetail portal={portal} />
      </main>
    </PortalsWorkspace>
  );
}
