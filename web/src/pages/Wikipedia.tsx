import { useMemo } from "react";
import { DataTable, type Column } from "../components/DataTable";
import { NewBadge, SearchField, Segmented, SelectField, TagBadge } from "../components/ui";
import { countBy, dt, num, splitList } from "../lib/format";
import { useParam } from "../lib/route";
import type { Snapshot, WikipediaRow } from "../lib/types";

const columns: Column<WikipediaRow>[] = [
  { key: "titre", header: "Titre", sort: (r) => r.titre, cell: (r) => <><a href={r.url} target="_blank" rel="noreferrer" className="strong">{r.titre}</a> {r.nouveau && <NewBadge />}</> },
  { key: "wiki", header: "Wiki", sort: (r) => r.wiki, cell: (r) => r.wiki },
  { key: "pays", header: "Pays", sort: (r) => r.pays, cell: (r) => r.pays },
  { key: "portails", header: "Portail / WikiProject", cell: (r) => (r.statut === "sans portail" ? <TagBadge>à baliser · {r.critere}</TagBadge> : r.portails) },
  { key: "auteur", header: "Auteur", sort: (r) => r.auteur.toLowerCase(), cell: (r) => r.auteur },
  { key: "cree", header: "Créé (UTC)", sort: (r) => r.cree, cell: (r) => dt(r.cree), nowrap: true },
  { key: "octets", header: "Octets", sort: (r) => r.octets, cell: (r) => num(r.octets), align: "right" },
];

export function WikipediaPage({ snap }: { snap: Snapshot }) {
  const [q, setQ] = useParam("q");
  const [wiki, setWiki] = useParam("wiki", "tous");
  const [statut, setStatut] = useParam("statut");
  const [pays, setPays] = useParam("pays");
  const [nouveau, setNouveau] = useParam("nouveau");

  const all = snap.wikipedia;
  const paysOpts = useMemo(() => countBy(all, (r) => splitList(r.pays)), [all]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((r) =>
      (wiki === "tous" || r.wiki === wiki) &&
      (!statut || r.statut === statut) &&
      (!pays || splitList(r.pays).includes(pays)) &&
      (!nouveau || r.nouveau) &&
      (!needle || `${r.titre} ${r.auteur} ${r.qid}`.toLowerCase().includes(needle)));
  }, [all, q, wiki, statut, pays, nouveau]);

  const portail = all.filter((r) => r.statut === "portail").length;

  return (
    <div className="stack">
      <div className="section-head">
        <h2 className="h-section">Nouveaux articles Wikipédia</h2>
        <span className="muted">{all.length} articles · {portail} avec portail, {all.length - portail} à baliser</span>
      </div>
      <section className="card filters" aria-label="Filtres">
        <SearchField value={q} onChange={setQ} placeholder="Titre, auteur, QID…" />
        <Segmented label="Wiki" value={wiki} onChange={setWiki} options={[{ value: "tous", label: "Tous" }, { value: "FR", label: "FR" }, { value: "EN", label: "EN" }]} />
        <SelectField label="Statut" value={statut} onChange={setStatut} options={[{ value: "", label: "Tous" }, { value: "portail", label: "Avec portail" }, { value: "sans portail", label: "À baliser" }]} />
        <SelectField label="Pays" value={pays} onChange={setPays} options={[{ value: "", label: `Tous (${paysOpts.length})` }, ...paysOpts.map(([p, n]) => ({ value: p, label: `${p} (${n})` }))]} />
        {snap.meta.mode === "midi" && (
          <label className="check"><input type="checkbox" checked={!!nouveau} onChange={(e) => setNouveau(e.target.checked ? "1" : "")} /> Nouveaux depuis 07:00</label>
        )}
      </section>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        defaultSort={{ key: "cree", dir: "desc" }}
        csvName={`wikipedia_${snap.meta.id}.csv`}
        csv={(r) => ({ wiki: r.wiki, statut: r.statut, titre: r.titre, url: r.url, pays: r.pays, portails: r.portails, auteur: r.auteur, cree: r.cree, octets: r.octets, qid: r.qid, critere: r.critere })}
      />
    </div>
  );
}
