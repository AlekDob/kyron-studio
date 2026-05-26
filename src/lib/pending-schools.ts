import { cookies } from "next/headers";

export interface PendingSchool {
  id: string;
  slug: string;
  nome: string;
  status: "draft" | "review" | "approved" | "onboarded";
  collectedBy: "agent" | "manual";
  createdAt: string;
  updatedAt: string;
}

const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL ?? "https://kyronedu.it/api";

// Studio auth e' basata su kyron-rev cookie HMAC, non sul cookie Payload nativo.
// Per leggere PendingSchools server-side da Studio serve un Payload API key
// (service-to-service). Setup in Day 2: creare un Payload user "studio-service"
// con role admin + API key in STUDIO_PAYLOAD_API_KEY env. Vedi feature 028.
// Fallback dev: forward cookie kyron-rev (Payload non lo accetta, ritorna 403).

export async function fetchPendingSchools(): Promise<PendingSchool[]> {
  const apiKey = process.env.STUDIO_PAYLOAD_API_KEY;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers["Authorization"] = `users API-Key ${apiKey}`;
  } else {
    const cookieStore = await cookies();
    headers["Cookie"] = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
  }

  const res = await fetch(
    `${PAYLOAD_API_URL}/pending-schools?sort=-createdAt&limit=100`,
    { headers, cache: "no-store" },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { docs: PendingSchool[] };
  return data.docs ?? [];
}
