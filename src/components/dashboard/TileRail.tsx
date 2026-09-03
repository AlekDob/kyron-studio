import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Fila di tile. Su schermo stretto (telefono, iPad, o il pannello Ordini con la
// chat a fianco) diventa un carosello orizzontale con snap: impilate in colonna
// mangiavano mezza pagina prima di far vedere i dati. Quando lo spazio c'e'
// torna una griglia normale.
//
// Le soglie sono container query, non breakpoint di viewport: quello che conta
// e' la larghezza del contenitore, che qui e' spesso meta' finestra.
const RAIL =
  "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 " +
  // La barra di scorrimento sotto le tile e' rumore: lo scroll si capisce dalla
  // tile tagliata al bordo.
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "[&>*]:w-[62%] [&>*]:shrink-0 [&>*]:snap-start @lg:[&>*]:w-[38%] @2xl:[&>*]:w-[30%]";

const GRID = "@3xl:grid @3xl:snap-none @3xl:overflow-visible @3xl:pb-0 @3xl:[&>*]:w-auto";

export function TileRail({
  children,
  /** Classi delle colonne oltre la soglia, es. "@3xl:grid-cols-4". */
  cols,
  className,
}: {
  children: ReactNode;
  cols: string;
  className?: string;
}) {
  return (
    // Il container va dichiarato su un antenato: un elemento non e' il container
    // di se stesso, quindi servono due div.
    <div className={cn("@container min-w-0", className)}>
      <div className={cn(RAIL, GRID, cols)}>{children}</div>
    </div>
  );
}
