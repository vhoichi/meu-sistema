import type { Metadata } from "next";
import "./globals.css";
import ClickSpark from "@/components/reactbits/ClickSpark/ClickSpark";

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
      <body>
        <ClickSpark
          sparkColor="#818cf8"
          sparkSize={9}
          sparkRadius={18}
          sparkCount={8}
          duration={450}
        >
          {children}
        </ClickSpark>
      </body>
    </html>
  );
}
