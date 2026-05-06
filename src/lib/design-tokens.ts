/**
 * Design Tokens per l'applicazione.
 * Questi valori corrispondono alle variabili CSS in globals.css e tailwind.config.ts.
 * Usare questi costanti quando è necessario passare un colore come stringa (es. in Recharts).
 */

export const COLORS = {
  brand: {
    yellow: "#FFFD66", // hsl(59 100% 70%)
    green: "#ACE504",  // hsl(74 96% 46%)
    cyan: "#005A71",   // hsl(192 100% 22%)
    pink: "#EC4899",   // hsl(340 73% 55%)
    orange: '#E08700',
  },
  functional: {
    win: "#ACE504",
    loss: "#f43f5e",
    draw: "#94a3b8",
    cardYellow: "#FAC815",
    cardRed: "#DC2626",
  },
  charts: {
    primary: (isDark: boolean) => isDark ? "#ACE504" : "#0080FF",
    text: (isDark: boolean) => isDark ? "#ffffff" : "#000000",
    grid: (isDark: boolean) => isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  }
};

import { useEffect, useState } from "react";

/**
 * Hook per ottenere i colori dei grafici in base al tema corrente.
 */
export function useChartColors() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const dotColor = isDark ? COLORS.brand.orange : "#2563eb"; // Blue for light, Neon orange for dark
  const glowColor = isDark ? "rgba(172,229,4,0.4)" : "rgba(37,99,235,0.3)";
  const textColor = isDark ? "#ffffff" : "#000000";

  return { isDark, dotColor, glowColor, textColor };
}
