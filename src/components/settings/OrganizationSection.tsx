"use client";
// Brain: feature-008-organization-users — gestione utenti Studio (admin-only).
// Lista utenti autorizzati a studio.kyronedu.it con ruolo admin/editor; invito
// (l'utente poi entra da solo via OTP), cambio ruolo, attiva/disattiva, rimozione.
// L'autorizzazione reale e' lato studio-server: qui la UI assume gia' un admin.
import { useEffect, useState } from "react";
import { Button, Input, Select, Pill } from "@/components/ui";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type StudioUser,
  type StudioRole,
} from "@/lib/org-api";

interface Props {
  currentEmail: string;
}

export function OrganizationSection({ currentEmail }: Props) {
  const [users, setUsers] = useState<StudioUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setUsers(await listUsers());
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow mb-3">Organizzazione</p>
        <h2 className="text-3xl font-semibold tracking-tight">
          Utenti <span className="font-serif italic">&amp; ruoli</span>
        </h2>
        <p className="mt-3 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Chi puo' accedere allo Studio. Gli admin gestiscono utenti, connessioni
          AI, modelli e MCP. Gli editor usano tutto il resto.
        </p>
      </header>

      <InviteForm onInvited={reload} />

      {error && (
        <p className="text-sm text-[var(--color-critical)]">{error}</p>
      )}

      {loading ? (
        <p className="text-sm text-[var(--color-ink-muted)]">Caricamento…</p>
      ) : (
        <ul className="divide-y divide-[var(--color-line)] rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]">
          {users.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isSelf={u.email === currentEmail.trim().toLowerCase()}
              onChanged={reload}
              onError={setError}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Form invito -----------------------------------------------------------

function InviteForm({ onInvited }: { onInvited: () => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StudioRole>("editor");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await createUser({ email: email.trim(), role });
      setEmail("");
      setRole("editor");
      await onInvited();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-muted)] p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="eyebrow mb-1.5 block">Email</label>
        <Input
          type="email"
          placeholder="nome@kyronedu.it"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="sm:w-40">
        <label className="eyebrow mb-1.5 block">Ruolo</label>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as StudioRole)}
        >
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      <Button type="submit" loading={busy}>
        Invita
      </Button>
      {err && (
        <p className="text-sm text-[var(--color-critical)] sm:self-center">
          {err}
        </p>
      )}
    </form>
  );
}

// --- Riga utente -----------------------------------------------------------

function UserRow({
  user,
  isSelf,
  onChanged,
  onError,
}: {
  user: StudioUser;
  isSelf: boolean;
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--color-ink)]">
          {user.email}
          {isSelf && (
            <span className="ml-2 text-xs text-[var(--color-ink-muted)]">
              (tu)
            </span>
          )}
        </p>
        {!user.isActive && (
          <Pill variant="critical" size="sm" className="mt-1">
            disattivato
          </Pill>
        )}
      </div>

      <Select
        className="w-32"
        value={user.role}
        disabled={busy}
        onChange={(e) =>
          run(() => updateUser(user.id, { role: e.target.value as StudioRole }))
        }
      >
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </Select>

      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => run(() => updateUser(user.id, { isActive: !user.isActive }))}
      >
        {user.isActive ? "Disattiva" : "Riattiva"}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={busy || isSelf}
        onClick={() => {
          if (confirm(`Rimuovere ${user.email}?`)) {
            void run(() => deleteUser(user.id));
          }
        }}
      >
        Rimuovi
      </Button>
    </li>
  );
}
