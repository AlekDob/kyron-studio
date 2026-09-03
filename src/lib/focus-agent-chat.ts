// Porta il cursore nel campo della chat dell'agente della pagina. Serve ai
// punti in cui l'interfaccia dice "chiedilo all'agente": il salto lo deve fare
// il prodotto, non l'utente andando a cercare il campo.
export function focusAgentChat(): void {
  const focus = (): boolean => {
    const el = document.querySelector<HTMLInputElement>("[data-chat-composer] input");
    el?.focus();
    return Boolean(el);
  };
  if (focus()) return;
  // Su schermo stretto la chat vive dentro la bottom sheet: prima va aperta.
  document.querySelector<HTMLButtonElement>('button[aria-label^="Apri "]')?.click();
  setTimeout(focus, 260);
}
