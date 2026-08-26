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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Le variabili font stanno su <html>: --font-sans e --font-dots le risolvono
  // da :root, non da body.
  return (
    <html lang="it" className={`${geist.variable} ${doto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
