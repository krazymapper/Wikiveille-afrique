import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "wikiveille-theme";

const systemTheme = (): Theme => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function savedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

/** Bascule clair / sombre. Sans choix enregistré, le site suit le réglage du système. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());
  const [chosen, setChosen] = useState(() => savedTheme() !== null);

  useEffect(() => {
    if (chosen) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
  }, [theme, chosen]);

  // Suit le système tant que l'utilisateur n'a rien choisi.
  useEffect(() => {
    if (chosen || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [chosen]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setChosen(true);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* navigation privée : le choix vaut pour la session */
    }
  };

  const label = theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre";
  return (
    <button type="button" className="btn theme-toggle" onClick={toggle} aria-label={label} title={label}>
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
