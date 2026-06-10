import crypto from "node:crypto";
import { cookies } from "next/headers";

const GATEWAY_URL = process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";
const TENANT = process.env.STUDIO_TENANT ?? "kyron";

function secret(): string {
  return (
    process.env.KYRON_REVIEW_SECRET ||
    process.env.PAYLOAD_SECRET ||
    "kyron-review-insecure-dev"
  );
}

function signDevCookie(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Date.now() + 60 * 60 * 1000 }),
    "utf8",
  ).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

async function buildCookieHeader(): Promise<string> {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.STUDIO_DEV_USER
  ) {
    return `kyron-rev=${signDevCookie(process.env.STUDIO_DEV_USER)}`;
  }
  const store = await cookies();
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export class GatewayError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Esportata per i moduli feature (es. lib/analytics.ts): unico punto
// auth-aware verso studio-server (cookie kyron-rev + X-Tenant).
export async function gatewayFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("X-Tenant", TENANT);
  headers.set("Cookie", await buildCookieHeader());
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new GatewayError(res.status, text || res.statusText);
  }
  return (await res.json()) as T;
}

export interface CollectionSummary {
  slug: string;
  label: { it: string; en: string };
  description: { it: string; en: string };
  purpose: "manage" | "inbox" | "library";
  editable: boolean;
  count: number;
}

export interface PayloadDoc {
  id: number | string;
  [key: string]: unknown;
}

export interface RecordListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordList {
  data: PayloadDoc[];
  meta: RecordListMeta;
  collection: CollectionSummary;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const body = await gatewayFetch<{ data: CollectionSummary[] }>(
    "/api/v1/collections",
  );
  return body.data;
}

export async function listRecords(
  slug: string,
  params: { page?: number; limit?: number; q?: string } = {},
): Promise<RecordList> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return gatewayFetch<RecordList>(
    `/api/v1/collections/${slug}${qs ? `?${qs}` : ""}`,
  );
}

export async function getRecord(
  slug: string,
  id: string,
): Promise<PayloadDoc> {
  const body = await gatewayFetch<{ data: PayloadDoc }>(
    `/api/v1/collections/${slug}/${id}`,
  );
  return body.data;
}

export async function updateRecord(
  slug: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<PayloadDoc> {
  const body = await gatewayFetch<{ data: PayloadDoc }>(
    `/api/v1/collections/${slug}/${id}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
  return body.data;
}

export async function deleteRecord(slug: string, id: string): Promise<void> {
  await gatewayFetch(`/api/v1/collections/${slug}/${id}`, {
    method: "DELETE",
  });
}

export interface PortalSummary {
  slug: string;
  nome: string;
  city: string;
  countryArea: string;
  status: string;
  collectedBy: string;
  // Email dell'agente Studio che ha richiesto l'onboarding (vuoto se sconosciuto).
  requestedBy: string;
  collectedAt: string;
  bundleCount: number;
  productCount: number;
}

export async function listPortals(): Promise<PortalSummary[]> {
  return gatewayFetch<PortalSummary[]>("/api/v1/portals");
}

export interface SaleorProduct {
  slug: string;
  name: string;
  priceEur: number;
  category: string;
  imageUrl?: string;
}

export async function listSaleorCatalog(): Promise<SaleorProduct[]> {
  return gatewayFetch<SaleorProduct[]>("/api/v1/portals/_catalog");
}

export interface PortalDetail extends PortalSummary {
  sitoUfficiale: string;
  codiceMeccanografico: string;
  schoolAddress: Record<string, unknown>;
  branding: { nome: string; logoUrl: string | null };
  shipToSchool: boolean;
  shippingMethodLabel: string;
  shippingPriceEur: number;
  catalog: {
    visibleSlugs: string[];
    visibleVariants?: Array<{ productSlug: string; attribute: string; value: string }>;
    hiddenSlugs: string[];
    productDiscounts?: Array<{
      slug: string;
      capacity?: string | null;
      kind: "percent" | "eur";
      value: number;
    }>;
    heroOutsideBundle?: boolean;
    accessoriesOutsideBundle?: boolean;
  };
  bundles: Array<{
    slug: string;
    name: string;
    finalPriceEur: number;
    components: Array<Record<string, unknown>>;
  }>;
}

export async function getPortal(slug: string): Promise<PortalDetail> {
  return gatewayFetch<PortalDetail>(`/api/v1/portals/${slug}`);
}

export async function updatePortal(
  slug: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; slug: string; updatedFields: string[] }> {
  return gatewayFetch(`/api/v1/portals/${slug}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function deletePortal(
  slug: string,
): Promise<{ ok: boolean; slug: string }> {
  return gatewayFetch(`/api/v1/portals/${slug}`, { method: "DELETE" });
}

// Upload logo: multipart server-side (NO Content-Type manuale → fetch imposta
// il boundary). Non usa gatewayFetch (che forza application/json sul body).
export async function uploadPortalLogo(
  slug: string,
  form: FormData,
): Promise<{ ok: boolean; filename: string }> {
  const headers = new Headers();
  headers.set("X-Tenant", TENANT);
  headers.set("Cookie", await buildCookieHeader());
  const res = await fetch(`${GATEWAY_URL}/api/v1/portals/${slug}/logo`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new GatewayError(res.status, txt || "logo upload failed");
  }
  return res.json();
}

export async function updatePortalCatalog(
  slug: string,
  visibleSlugs: string[],
): Promise<{ ok: boolean; slug: string; total: number }> {
  return gatewayFetch(`/api/v1/portals/${slug}/catalog`, {
    method: "PUT",
    body: JSON.stringify({ visibleSlugs }),
  });
}

export interface BundlePatch {
  name?: string;
  finalPriceEur?: number;
  components?: Array<{
    productSlug: string;
    selection: { kind: "variant"; variantSku: string };
  }>;
}

export async function updateBundle(
  slug: string,
  bundleSlug: string,
  patch: BundlePatch,
): Promise<{
  ok: boolean;
  slug: string;
  bundleSlug: string;
  updatedFields: string[];
}> {
  return gatewayFetch(`/api/v1/portals/${slug}/bundles/${bundleSlug}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function removeBundle(
  slug: string,
  bundleSlug: string,
): Promise<{ ok: boolean; slug: string; bundleSlug: string; total: number }> {
  return gatewayFetch(`/api/v1/portals/${slug}/bundles/${bundleSlug}`, {
    method: "DELETE",
  });
}
