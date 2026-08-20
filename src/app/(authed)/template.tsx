// template.tsx si rimonta a ogni navigazione: il contenuto nuovo entra in
// dissolvenza mentre il velo (PageTransition) defluisce. La shell con la
// sidebar sta nel layout e resta ferma. Animazione in `globals.css`.

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter h-full">{children}</div>;
}
