// Contrat de données produit par collector/veille.py (schema 1).

export type Mode = "matin" | "midi" | "manuel";

export interface Meta {
  schema: 1;
  id: string; // "2026-11-13_midi"
  debut: string; // ISO UTC
  fin: string;
  genere: string;
  mode: Mode;
  coupure: string; // "" hors mode midi
  totaux: { fr: number; en: number; wd: number };
  compteurs: {
    fr: number;
    en: number;
    wd_humains: number;
    wd_bots: number;
    a_baliser: number;
    nouveaux: number | null;
  };
  requetes_api: number;
}

export interface WikipediaRow {
  id: string;
  wiki: "FR" | "EN";
  statut: "portail" | "sans portail";
  titre: string;
  url: string;
  cree: string;
  auteur: string;
  octets: number;
  pays: string;
  portails: string;
  qid: string;
  critere: string;
  nouveau: boolean;
}

export type Createur = "humain" | "humain (outil de masse)" | "bot";

export interface WikidataRow {
  qid: string;
  url: string;
  libelle: string;
  description: string;
  nature: string;
  cree: string;
  auteur: string;
  createur: Createur;
  pays: string;
  critere: string;
  confiance: "haute" | "moyenne";
  nouveau: boolean;
}

export interface HistoryRow {
  id: string;
  jour: string;
  passage: Mode;
  debut: string;
  fin: string;
  fr: number;
  en: number;
  wd_humains: number;
  wd_bots: number;
  a_baliser: number;
  total_fr?: number | null;
  total_en?: number | null;
  total_wd?: number | null;
}

export interface Snapshot {
  meta: Meta;
  wikipedia: WikipediaRow[];
  wikidata: WikidataRow[];
}
