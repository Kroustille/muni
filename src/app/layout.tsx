import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Muni" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
