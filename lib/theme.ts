"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "theme";
const ATTRIBUTE = "data-theme";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute(ATTRIBUTE) === "light"
    ? "light"
    : "dark";
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute(ATTRIBUTE, "light");
  } else {
    document.documentElement.removeAttribute(ATTRIBUTE);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem localStorage (ex.: navegação privada): o tema não persiste entre visitas.
  }
}

/**
 * Tema atual (dark/light) sincronizado com o atributo data-theme do <html>.
 * Um MutationObserver mantém todos os componentes que usam este hook em
 * sincronia mesmo quando o tema é alterado por outra instância do toggle.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readTheme());
    setMounted(true);

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [ATTRIBUTE],
    });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, mounted, toggleTheme };
}

/** Script inline injetado no <head> para aplicar o tema salvo antes do
 * primeiro paint, evitando o "flash" do tema errado. Sem interpolação de
 * dados externos — string estática, segura para dangerouslySetInnerHTML. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'){document.documentElement.setAttribute('${ATTRIBUTE}','light');}}catch(e){}})();`;
