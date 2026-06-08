// Client per /api/org/* (proxy same-origin verso studio-server, admin-only).
// fetch-only, refetch manuale post-mutazione (come settings-api).
export type StudioRole = "admin" | "editor";

export interface StudioUser {
  id: string;
  email: string;
  role: StudioRole;
  isActive: boolean;
  invitedBy?: string | null;
}

const BASE = "/api/org/studio-users";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `errore ${res.status}`);
  }
  return data as T;
}

export async function listUsers(): Promise<StudioUser[]> {
  const res = await fetch(BASE, { cache: "no-store" });
  return (await parse<{ data: StudioUser[] }>(res)).data;
}

export async function createUser(input: {
  email: string;
  role: StudioRole;
}): Promise<StudioUser> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await parse<{ data: StudioUser }>(res)).data;
}

export async function updateUser(
  id: string,
  patch: { role?: StudioRole; isActive?: boolean },
): Promise<StudioUser> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return (await parse<{ data: StudioUser }>(res)).data;
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  await parse(res);
}
