import type { Meta, Mode } from "./types";

const nf = new Intl.NumberFormat("fr-FR");
export const num = (n: number | null | undefined) => (n == null ? "—" : nf.format(n));

/** "2026-11-13T14:51:38Z" → "13/11 14:51" (UTC, comme les sources Wikimedia). */
export const dt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;
export const day = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export const passageLabel = (m: Mode) =>
  m === "matin" ? "Édition de 7h" : m === "midi" ? "Mise à jour de 13h" : "Passage manuel";

/** Frais si généré il y a moins de `hours` heures (le jeu passe toutes les 6 h ou 18 h). */
export function freshness(meta: Meta, hours = 20) {
  const ageH = (Date.now() - Date.parse(meta.genere)) / 36e5;
  return { stale: ageH > hours, ageH };
}

export function countBy<T>(rows: T[], key: (r: T) => string[]) {
  const m = new Map<string, number>();
  for (const r of rows) for (const k of key(r)) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export const splitList = (s: string) => (s && s !== "—" ? s.split(", ") : ["—"]);
