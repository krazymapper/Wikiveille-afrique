import { useEffect, useState } from "react";
import type { HistoryRow, Meta, Snapshot, WikidataRow, WikipediaRow } from "./types";

const BASE = `${import.meta.env.BASE_URL}data/`;

async function getJSON<T>(path: string, bust: string): Promise<T> {
  // Le cache GitHub Pages dure ~10 min : on contourne avec la date de génération.
  const res = await fetch(`${BASE}${path}?v=${encodeURIComponent(bust)}`);
  if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function loadLatest(): Promise<Snapshot> {
  const meta = await getJSON<Meta>("latest/meta.json", String(Date.now()));
  const [wikipedia, wikidata] = await Promise.all([
    getJSON<WikipediaRow[]>("latest/wikipedia.json", meta.genere),
    getJSON<WikidataRow[]>("latest/wikidata.json", meta.genere),
  ]);
  return { meta, wikipedia, wikidata };
}

export const loadArchive = (id: string) => getJSON<Snapshot>(`archive/${id}.json`, id);
export const loadArchiveIndex = () => getJSON<string[]>("archive/index.json", String(Date.now())).catch(() => [] as string[]);
export const loadHistory = () => getJSON<HistoryRow[]>("historique.json", String(Date.now()));
export const excelUrl = `${BASE}latest/veille_afrique.xlsx`;

type State<T> = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; data: T };

/** Charge une ressource ; se relance quand `key` change. */
export function useAsync<T>(fn: () => Promise<T>, key: string): State<T> {
  const [s, set] = useState<State<T>>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    set({ status: "loading" });
    fn().then(
      (data) => alive && set({ status: "ready", data }),
      (e: unknown) => alive && set({ status: "error", error: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return s;
}
