import { useMemo } from "react";
import { DataTable, type Column } from "../components/DataTable";
import { Card, NewBadge, SearchField, Segmented, SelectField } from "../components/ui";
import { BarList } from "../components/charts";
import { countBy, dt, num, splitList } from "../lib/format";
import { useParam } from "../lib/route";
import type { Snapshot, WikidataRow } from "../lib/types";

const columns: Column<WikidataRow>[] = [
  { key: "libelle", header: "Élément", sort: (r) => r.libelle.toLowerCase(), cell: (r) => (
    <>
      <a href={r.url} target="_blank" rel="noreferrer" className="strong">{r.libelle}</a> {r.nouveau && <NewBadge />}
      <div className="muted small clamp">{r.libelle === r.qid ? "sans libellé" : r.qid}{r.description ? ` · ${r.description}` : ""}</div>
    </>
  ) },
  { key: "nature", header: "Nature", sort: (r) => r.nature, cell: (r) => r.nature || "—" },
  { key: "pays", header: "Pays", sort: (r) => r.pays, cell: (r) => r.pays },
  { key: "auteur", header: "Auteur", sort: (r) => r.auteur.toLowerCase(), cell: (r) => r.auteur },
  { key: "critere", header: "Critère", cell: (r) => <span className="small">{r.critere}{r.confiance === "moyenne" ? " (moyenne)" : ""}</span> },
  { key: "cree", header: "Créé (UTC)", sort: (r) => r.cree, cell: (r) => dt(r.cree), nowrap: true },
];

type Kind = "humain" | "outil" | "bot" | "tous";
const matchKind = (r: WikidataRow, k: Kind) =>
  k === "tous" || (k === "bot" ? r.createur === "bot" : k === "outil" ? r.createur === "humain (outil de masse)" : r.createur === "humain");

export function WikidataPage({ snap }: { snap: Snapshot }) {
  const [q, setQ] = useParam("q");
  const [kind, setKind] = useParam("createur", "humain");
  const [pays, setPays] = useParam("pays");
  const [nature, setNature] = useParam("nature");
  const [confiance, setConfiance] = useParam("confiance");

  const all = snap.wikidata;
  const n = (k: Kind) => all.filter((r) => matchKind(r, k)).length;
  const base = useMemo(() => all.filter((r) => matchKind(r, kind as Kind)), [all, kind]);
  const paysOpts = useMemo(() => countBy(base, (r) => splitList(r.pays)), [base]);
  const natOpts = useMemo(() => countBy(base, (r) => [r.nature || "—"]), [base]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return base.filter((r) =>
      (!pays || splitList(r.pays).includes(pays)) &&
      (!nature || (r.nature || "—") === nature) &&
      (!confiance || r.confiance === confiance) &&
      (!needle || `${r.libelle} ${r.qid} ${r.auteur} ${r.description}`.toLowerCase().includes(needle)));
  }, [base, q, pays, nature, confiance]);

  return (
    <div className="stack">
      <div className="section-head">
        <h2 className="h-section">Nouveaux éléments Wikidata en Afrique</h2>
        <span className="muted">{num(all.length)} éléments sur {num(snap.meta.totaux.wd)} créations</span>
      </div>
      <section className="card filters" aria-label="Filtres">
        <SearchField value={q} onChange={setQ} placeholder="Libellé, QID, auteur…" />
        <Segmented label="Créateur" value={kind as Kind} onChange={setKind} options={[
          { value: "humain", label: `Humains ${n("humain")}` },
          { value: "outil", label: `Outil de masse ${n("outil")}` },
          { value: "bot", label: `Bots ${n("bot")}` },
          { value: "tous", label: "Tous" },
        ]} />
        <SelectField label="Nature (P31)" value={nature} onChange={setNature} options={[{ value: "", label: "Toutes" }, ...natOpts.slice(0, 60).map(([k, v]) => ({ value: k, label: `${k} (${v})` }))]} />
        <SelectField label="Pays" value={pays} onChange={setPays} options={[{ value: "", label: "Tous" }, ...paysOpts.map(([k, v]) => ({ value: k, label: `${k} (${v})` }))]} />
        <SelectField label="Confiance" value={confiance} onChange={setConfiance} options={[{ value: "", label: "Toutes" }, { value: "haute", label: "Haute" }, { value: "moyenne", label: "Moyenne (coordonnées)" }]} />
      </section>
      <div className="row">
        <div className="grow-wide">
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.qid}
            defaultSort={{ key: "cree", dir: "desc" }}
            csvName={`wikidata_${snap.meta.id}.csv`}
            csv={(r) => ({ qid: r.qid, libelle: r.libelle, description: r.description, nature: r.nature, pays: r.pays, auteur: r.auteur, createur: r.createur, critere: r.critere, confiance: r.confiance, cree: r.cree })}
          />
        </div>
        <aside className="grow-1 stack">
          <Card title="Par auteur"><BarList rows={countBy(rows, (r) => [r.auteur])} onPick={(a) => setQ(a)} /></Card>
          <Card title="Par nature (P31)"><BarList rows={countBy(rows, (r) => [r.nature || "—"])} onPick={setNature} /></Card>
        </aside>
      </div>
    </div>
  );
}
