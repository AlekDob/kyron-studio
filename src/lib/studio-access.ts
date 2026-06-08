// Brain: feature-008-organization-users — risoluzione accesso + ruolo Studio.
// Fonte di verita': collection Payload `studio-users` via studio-server
// (/auth/resolve, pre-login, no cookie). Sostituisce la env var
// KYRON_REVIEW_EMAILS. Fallback bootstrap: se studio-server/DB e' irraggiungibile
// (o l'admin non e' ancora stato seedato), gli indirizzi in KYRON_ADMIN_EMAILS
// possono comunque entrare come admin — evita il lockout totale. Gli editor
// sono gestiti ESCLUSIVAMENTE dal DB (nessuna scorciatoia env).
const GATEWAY_URL = process.env.STUDIO_SERVER_URL ?? "http://localhost:8790";
const TENANT = process.env.STUDIO_TENANT ?? "kyron";

export type StudioRole = "admin" | "editor";
export interface StudioAccess {
  allowed: boolean;
  role: StudioRole | null;
}

function adminBootstrapFallback(normEmail: string): StudioAccess {
  const admins = (process.env.KYRON_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(normEmail)
    ? { allowed: true, role: "admin" }
    : { allowed: false, role: null };
}

export async function resolveStudioAccess(email: string): Promise<StudioAccess> {
  const norm = email.trim().toLowerCase();
  try {
    const res = await fetch(
      `${GATEWAY_URL}/auth/resolve?email=${encodeURIComponent(norm)}`,
      { headers: { "X-Tenant": TENANT }, cache: "no-store" },
    );
    if (res.ok) {
      const data = (await res.json()) as StudioAccess;
      if (data.allowed) return data;
    }
  } catch {
    // studio-server down → fallback bootstrap admin
  }
  return adminBootstrapFallback(norm);
}
