"use client";

import { destroyRisorsa } from "@/app/(authed)/dati/risorse/actions";

// Conferma prima di eliminare: l'azione non e' reversibile e la risorsa sparisce
// anche dal sito pubblico.
export function DeleteRisorsaButton({ id }: { id: string }) {
  return (
    <form
      action={destroyRisorsa}
      onSubmit={(e) => {
        if (!confirm("Eliminare questa risorsa? L'operazione non si annulla.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="__id" value={id} />
      <button
        type="submit"
        className="text-xs uppercase tracking-wider text-red-600 hover:underline"
      >
        Elimina risorsa
      </button>
    </form>
  );
}
