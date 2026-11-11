import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semauri Playground — Code in natural language",
  description: "Write, check, and run Semauri (.suri) in your browser, with syntax highlighting, examples, and an interactive console.",
  applicationName: "Semauri Playground",
  icons: { icon: "/semauri-logo.png", apple: "/semauri-logo.png" },
  openGraph: {
    title: "Semauri Playground",
    description: "Natural language meets programming.",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
