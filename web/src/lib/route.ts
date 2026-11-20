import { useCallback, useEffect, useState } from "react";

// Routage par hash : GitHub Pages ne sait pas réécrire les URL d'une SPA.
// Forme : #/wikipedia?wiki=FR&q=congo  → page + filtres partageables.

export type Page = "overview" | "wikipedia" | "wikidata" | "history" | "method";
const PAGES: Page[] = ["overview", "wikipedia", "wikidata", "history", "method"];

function parse(): { page: Page; params: URLSearchParams } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [path, query = ""] = raw.split("?");
  const page = (PAGES as string[]).includes(path) ? (path as Page) : "overview";
  return { page, params: new URLSearchParams(query) };
}

export function useRoute() {
  const [r, setR] = useState(parse);
  useEffect(() => {
    const on = () => setR(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}

export const href = (page: Page, params?: Record<string, string>) => {
  const q = params ? new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString() : "";
  return `#/${page}${q ? `?${q}` : ""}`;
};

/** Paramètre d'URL lié à un état : remplace l'entrée d'historique, sans recharger. */
export function useParam(name: string, fallback = "") {
  const { params } = useRoute();
  const value = params.get(name) ?? fallback;
  const set = useCallback(
    (v: string) => {
      const { page, params: p } = parse();
      if (v && v !== fallback) p.set(name, v);
      else p.delete(name);
      if (name !== "page") p.delete("page");
      const q = p.toString();
      history.replaceState(null, "", `#/${page}${q ? `?${q}` : ""}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    },
    [name, fallback],
  );
  return [value, set] as const;
}
