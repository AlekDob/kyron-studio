import { NextRequest, NextResponse } from "next/server";

const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL ?? "https://kyronedu.it/api";

interface PendingSchoolDoc {
  slug: string;
  nome: string;
  sitoUfficiale?: string;
  codiceMeccanografico?: string;
  schoolAddress?: Record<string, unknown>;
  branding?: { nome?: string };
  shipToSchool?: boolean;
  shippingMethodLabel?: string;
  shippingPriceEur?: number;
  catalog?: { visibleSlugs?: unknown; hiddenSlugs?: unknown };
  bundles?: unknown[];
}

function toMarkdown(doc: PendingSchoolDoc): string {
  const fm = {
    slug: doc.slug,
    nome: doc.nome,
    sitoUfficiale: doc.sitoUfficiale ?? "TBD",
    codiceMeccanografico: doc.codiceMeccanografico ?? "TBD",
    schoolAddress: doc.schoolAddress ?? {},
    branding: { nome: doc.branding?.nome ?? doc.nome, logo: "TBD" },
    shipToSchool: doc.shipToSchool ?? true,
    shippingMethodLabel: doc.shippingMethodLabel ?? "Consegna a scuola",
    shippingPriceEur: doc.shippingPriceEur ?? 0,
    catalog: doc.catalog ?? { visibleSlugs: [], hiddenSlugs: [] },
    bundles: doc.bundles ?? [],
    status: "draft",
  };
  const frontmatter = Object.entries(fm)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---\n${frontmatter}\n---\n\n# ${doc.nome}\n\nDescriptor scuola esportato da Studio.\nCopiare in kyron-ecommerce/documentation/schools/${doc.slug}.md ed eseguire:\n\n\`\`\`bash\ncd /Personal/kyron-ecommerce/seed\nnpx tsx onboard-school.ts --school ${doc.slug}\n\`\`\`\n`;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const apiKey = process.env.STUDIO_PAYLOAD_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "STUDIO_PAYLOAD_API_KEY not configured" },
      { status: 500 },
    );
  }

  const res = await fetch(`${PAYLOAD_API_URL}/pending-schools/${id}`, {
    headers: { Authorization: `users API-Key ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "payload fetch failed" }, { status: res.status });
  }
  const doc = (await res.json()) as PendingSchoolDoc;

  return new NextResponse(toMarkdown(doc), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${doc.slug}.md"`,
    },
  });
}
