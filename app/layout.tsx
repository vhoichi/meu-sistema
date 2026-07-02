import type { Metadata } from "next";
import "./globals.css";
import ClickSpark from "@/components/reactbits/ClickSpark/ClickSpark";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo antes do primeiro paint, evitando flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
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
