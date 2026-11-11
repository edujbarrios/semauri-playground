import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semauri Playground — Programa en lenguaje natural",
  description: "Escribe, comprueba y ejecuta Semauri (.suri) en el navegador. El editor oficial en línea con resaltado, ejemplos y consola.",
  applicationName: "Semauri Playground",
  icons: { icon: "/semauri-logo.png", apple: "/semauri-logo.png" },
  openGraph: {
    title: "Semauri Playground",
    description: "El lenguaje natural se encuentra con la programación.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080D10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
