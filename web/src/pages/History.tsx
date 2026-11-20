import { Card, Empty } from "../components/ui";
import { StackedBars } from "../components/charts";
import { DataTable } from "../components/DataTable";
import { useAsync, loadHistory } from "../lib/data";
import { day, num } from "../lib/format";
import { href } from "../lib/route";

export function HistoryPage() {
  const h = useAsync(loadHistory, "hist");
  if (h.status !== "ready") return <Empty>{h.status === "error" ? h.error : "Chargement…"}</Empty>;
  const morning = h.data.filter((r) => r.passage === "matin").slice(-30);
  return (
    <div className="stack">
      <Card title="Wikipédia FR + EN par jour (passage de 7h, 30 derniers jours)">
        <StackedBars
          series={[{ name: "Wikipédia FR", color: "var(--series-1)" }, { name: "Wikipédia EN", color: "var(--series-2)" }, { name: "À baliser", color: "var(--series-3)" }]}
          points={morning.map((r) => ({ label: day(r.jour), title: r.jour, parts: [r.fr, r.en, r.a_baliser] }))}
        />
      </Card>
      <Card title="Wikidata humains par jour">
        <StackedBars
          series={[{ name: "Wikidata humains", color: "var(--series-1)" }, { name: "Bots", color: "var(--series-2)" }]}
          points={morning.map((r) => ({ label: day(r.jour), title: r.jour, parts: [r.wd_humains, r.wd_bots] }))}
          height={180}
        />
      </Card>
      <DataTable
        rows={h.data}
        rowKey={(r) => r.id}
        defaultSort={{ key: "id", dir: "desc" }}
        csvName="historique.csv"
        csv={(r) => ({ ...r, total_fr: r.total_fr ?? "", total_en: r.total_en ?? "", total_wd: r.total_wd ?? "" })}
        columns={[
          { key: "id", header: "Passage", sort: (r) => r.id, cell: (r) => <a href={href("overview", { run: r.id })}>{day(r.jour)} · {r.passage === "matin" ? "7h" : r.passage === "midi" ? "13h" : "manuel"}</a> },
          { key: "fr", header: "FR", sort: (r) => r.fr, cell: (r) => r.fr, align: "right" },
          { key: "en", header: "EN", sort: (r) => r.en, cell: (r) => r.en, align: "right" },
          { key: "wd", header: "WD humains", sort: (r) => r.wd_humains, cell: (r) => num(r.wd_humains), align: "right" },
          { key: "bots", header: "WD bots", sort: (r) => r.wd_bots, cell: (r) => r.wd_bots, align: "right" },
          { key: "bal", header: "À baliser", sort: (r) => r.a_baliser, cell: (r) => r.a_baliser, align: "right" },
          { key: "tot", header: "Créations FR / EN / WD", cell: (r) => (r.total_fr == null ? "—" : `${num(r.total_fr)} / ${num(r.total_en)} / ${num(r.total_wd)}`), align: "right" },
        ]}
      />
      <p className="muted small">Les liens de passage ne s'ouvrent que pour les 30 derniers jours (rétention des archives).</p>
    </div>
  );
}
