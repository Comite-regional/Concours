import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Concours PDL - Comité Régional Pays de la Loire",
  description: "Concours et résultats du Comité Régional de Tir à l'Arc Pays de la Loire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={geist.className}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
