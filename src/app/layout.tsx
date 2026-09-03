import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Doto, Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});


// Font a puntini per le cifre grandi dei KPI.
const doto = Doto({
  subsets: ["latin"],
  weight: "600",
  display: "swap",
  variable: "--font-numeric",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Studio — Kyron",
  description: "Hub admin Kyron",
  robots: { index: false, follow: false },
};

// Tema prima del paint: script sincrono, niente flash bianco su dark.
// Stessa logica di applyTheme in ThemeSection — chiave assente = "Sistema".
const THEME_INIT = `(function(){try{var t=localStorage.getItem("kyron-studio-theme");if(t!=="dark"&&t!=="light")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le variabili font stanno su <html>: --font-sans e --font-dots le risolvono
  // da :root, non da body.
  return (
    // suppressHydrationWarning: THEME_INIT scrive data-theme prima dell'hydration,
    // React vedrebbe un attributo che il server non ha reso. Solo su <html>.
    <html
      lang="it"
      className={`${geist.variable} ${doto.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
      </body>
    </html>
  );
}
