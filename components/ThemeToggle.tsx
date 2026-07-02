"use client";

import { useTheme } from "@/lib/theme";

interface ThemeToggleProps {
  /** "fixed": flutua no canto superior direito da tela (usado no login,
   * onde não há topbar). "inline": botão normal para ser colocado dentro
   * de um container já posicionado, como a topbar do dashboard. */
  variant?: "fixed" | "inline";
}

export default function ThemeToggle({ variant = "fixed" }: ThemeToggleProps) {
  const { theme, mounted, toggleTheme } = useTheme();
  const label = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
  const className = `theme-toggle ${
    variant === "inline" ? "theme-toggle--inline" : "theme-toggle--fixed"
  }`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={label}
      title={label}
    >
      {mounted ? (theme === "dark" ? "☀️" : "🌙") : null}
    </button>
  );
}
