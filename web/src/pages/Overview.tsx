import { Card, Kpi, NewBadge, Empty } from "../components/ui";
import { BarList, StackedBars } from "../components/charts";
import { useAsync, loadHistory } from "../lib/data";
import { countBy, day, dt, num, splitList } from "../lib/format";
import { href } from "../lib/route";
import type { Snapshot, WikipediaRow } from "../lib/types";

export function Overview({ snap, keep }: { snap: Snapshot; keep?: Record<string, string> }) {
  const { meta, wikipedia, wikidata } = snap;
  const c = meta.compteurs;
  const humans = wikidata.filter((r) => r.createur !== "bot");
  const hist = useAsync(loadHistory, "hist");

  const lists: { title: string; rows: WikipediaRow[]; link: Record<string, string> }[] = [
    { title: "Derniers articles FR", rows: wikipedia.filter((r) => r.wiki === "FR" && r.statut === "portail"), link: { wiki: "FR", statut: "portail" } },
    { title: "Derniers articles EN", rows: wikipedia.filter((r) => r.wiki === "EN" && r.statut === "portail"), link: { wiki: "EN", statut: "portail" } },
    { title: "À baliser (sans portail)", rows: wikipedia.filter((r) => r.statut === "sans portail"), link: { statut: "sans portail" } },
  ];

  return (
    <div className="stack">
      <section aria-label="Indicateurs clés" className="kpis">
        <Kpi label="Wikipédia FR — portail africain" value={num(c.fr)} sub={`sur ${num(meta.totaux.fr)} créations`} />
        <Kpi label="Wikipédia EN — portail / WikiProject" value={num(c.en)} sub={`sur ${num(meta.totaux.en)} créations`} />
        <Kpi label="Wikidata — humains" value={num(c.wd_humains)} sub={`sur ${num(meta.totaux.wd)} créations`} />
        <Kpi label="Wikidata — bots" value={num(c.wd_bots)} sub="listés à part" />
        <Kpi label="À baliser (sans portail)" value={num(c.a_baliser)} sub="FR + EN, via Wikidata" />
        {c.nouveaux != null && <Kpi label="Nouveaux depuis 07:00" value={num(c.nouveaux)} sub="toutes listes" />}
      </section>

      <div className="row">
        <Card title="Articles africains par passage de 7h" className="grow-2">
          {hist.status === "ready" ? (
            <StackedBars
              series={[{ name: "Wikipédia FR", color: "var(--series-1)" }, { name: "Wikipédia EN", color: "var(--series-2)" }]}
              points={hist.data.filter((h) => h.passage === "matin").slice(-14).map((h) => ({ label: day(h.jour), title: h.jour, parts: [h.fr, h.en] }))}
            />
          ) : <Empty>{hist.status === "error" ? "Historique indisponible." : "Chargement…"}</Empty>}
        </Card>
        <Card title="Wikidata humains — top pays" className="grow-1" action={<a href={href("wikidata", keep)}>Voir les {num(humans.length)} →</a>}>
          <BarList rows={countBy(humans, (r) => splitList(r.pays))} onPick={(p) => (location.hash = href("wikidata", { ...keep, pays: p }))} />
        </Card>
      </div>

      <div className="grid-3">
        {lists.map((l) => (
          <Card key={l.title} title={l.title} action={<a href={href("wikipedia", { ...keep, ...l.link })}>Tout voir</a>}>
            {l.rows.length ? (
              <ul className="feed">
                {l.rows.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <div><a href={r.url} target="_blank" rel="noreferrer">{r.titre}</a> {r.nouveau && <NewBadge />}</div>
                    <span className="muted small">{l.link.statut === "sans portail" ? `${r.wiki} · ` : ""}{r.pays} · {r.auteur} · {dt(r.cree)}</span>
                  </li>
                ))}
              </ul>
            ) : <Empty>Aucun article sur la période.</Empty>}
          </Card>
        ))}
      </div>
    </div>
  );
}
