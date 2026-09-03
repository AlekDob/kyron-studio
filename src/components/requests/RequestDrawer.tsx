"use client";
// Guscio mobile della scheda richiesta: bottom sheet con lo stesso contenuto.
// Su desktop la scheda vive al centro del pannello (RequestsView) — un drawer
// da destra coprirebbe la chat, e Ivo deve restare visibile.
import { Drawer, DrawerHeader } from "@studiofuturo/studio-core";
import type { RequestRow } from "@/lib/requests";
import { RequestDetail } from "./RequestDetail";

export function RequestDrawer({
  request,
  onClose,
}: {
  request: RequestRow | null;
  onClose: () => void;
}) {
  return (
    <Drawer open={Boolean(request)} onClose={onClose} side="bottom">
      {request && (
        <>
          <DrawerHeader
            eyebrow={request.identifier}
            title={request.title}
            meta={request.state}
            onClose={onClose}
            closeLabel="Chiudi"
          />
          <RequestDetail request={request} />
        </>
      )}
    </Drawer>
  );
}
