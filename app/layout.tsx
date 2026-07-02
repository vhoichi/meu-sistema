import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu Sistema — Consumo Global de Álcool",
  description:
    "Dashboard privado para visualização do consumo global de álcool a partir de um arquivo CSV.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
