import { redirect } from "next/navigation";
import { getCurrentUser, loginUrl } from "@/lib/auth";
import { listRequests } from "@/lib/requests";
import { RequestsWorkspace } from "@/components/requests/RequestsWorkspace";
import { RequestsEmptyState } from "@/components/requests/RequestsEmptyState";
import {
  REQUEST_LABELS,
  emptyFilter,
  type RequestsFilter,
} from "@/components/requests/requests-filter";

export const metadata = { title: "Richieste — Studio" };

// Le richieste del team (feature 022). I ticket vivono su Linear: qui non c'e'
// nessuna copia, la lista e' quello che c'e' la'. Come Ordini e Clienti, i
// filtri stanno nell'URL: un filtro e' un link condivisibile e il tasto
// indietro del browser funziona.
//
// Differenza: il filtro si applica in pagina, non lato server. I ticket sono un
// centinaio e arrivano tutti insieme, rifare il giro di rete per un chip
// sarebbe solo attesa in piu'.

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const GROUPS = ["todo", "doing", "done"] as const;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function readFilter(params: Record<string, string | string[] | undefined>): RequestsFilter {
  const group = one(params.group);
  const label = one(params.label);
  return {
    ...emptyFilter(),
    group: (GROUPS as readonly string[]).includes(group)
      ? (group as RequestsFilter["group"])
      : "all",
    label: (REQUEST_LABELS as readonly string[]).includes(label)
      ? (label as RequestsFilter["label"])
      : "all",
    query: one(params.q),
    mine: one(params.mine) === "1",
  };
}

export default async function RequestsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl());

  const filter = readFilter(await searchParams);

  let requests = null;
  try {
    requests = (await listRequests()).requests;
  } catch {
    requests = null;
  }

  if (!requests) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <RequestsEmptyState variant="error" />
      </main>
    );
  }

  return <RequestsWorkspace requests={requests} filter={filter} userEmail={user.email} />;
}
