import { useAsync, loadArchive, loadArchiveIndex, loadLatest, excelUrl } from "./lib/data";
import { href, useParam, useRoute, type Page } from "./lib/route";
import { dt, freshness, passageLabel, day } from "./lib/format";
import type { Snapshot } from "./lib/types";
import { Overview } from "./pages/Overview";
import { WikipediaPage } from "./pages/Wikipedia";
import { WikidataPage } from "./pages/Wikidata";
import { HistoryPage } from "./pages/History";
import { MethodPage } from "./pages/Method";

const NAV: { page: Page; label: string }[] = [
  { page: "overview", label: "Vue d'ensemble" },
  { page: "wikipedia", label: "Wikipédia" },
  { page: "wikidata", label: "Wikidata" },
  { page: "history", label: "Historique" },
  { page: "method", label: "Méthode" },
];

const REPO_URL = "https://github.com/OWNER/Wikiveille-afrique"; // à remplacer

export function App() {
  const { page } = useRoute();
  const [run, setRun] = useParam("run");
  const snap = useAsync<Snapshot>(() => (run ? loadArchive(run) : loadLatest()), run || "latest");
  const index = useAsync(loadArchiveIndex, "index");
  const keep = run ? { run } : undefined;

  return (
    <div className="app">
      <a className="skip" href="#main">Aller au contenu</a>
      <header className="topbar">
        <div className="container topbar-inner">
          <a className="brand" href={href("overview", keep)}>
            <span className="brand-mark" aria-hidden="true">W</span>
            <span>Wikiveille Afrique</span>
          </a>
          <nav aria-label="Sections" className="nav">
            {NAV.map((n) => (
              <a key={n.page} href={href(n.page, keep)} aria-current={page === n.page ? "page" : undefined}>{n.label}</a>
            ))}
          </nav>
          <div className="topbar-actions">
            {snap.status === "ready" && <Freshness snap={snap.data} archived={!!run} />}
            <a className="btn btn-primary" href={excelUrl} download>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>
              Excel
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="container main">
        {snap.status === "loading" && <p className="status" aria-live="polite">Chargement des données…</p>}
        {snap.status === "error" && (
          <div className="card error" role="alert">
            <h2>Données indisponibles</h2>
            <p>{snap.error}</p>
            <p>Le premier passage du workflow « Veille » n'a peut-être pas encore tourné.</p>
          </div>
        )}
        {snap.status === "ready" && (
          <>
            <div className="page-head">
              <div>
                <h1>{passageLabel(snap.data.meta.mode)} — {day(snap.data.meta.fin)}</h1>
                <p className="muted">Fenêtre : {dt(snap.data.meta.debut)} → {dt(snap.data.meta.fin)} UTC</p>
              </div>
              {index.status === "ready" && index.data.length > 0 && (
                <label className="field field-inline">
                  <span>Passage</span>
                  <select value={run} onChange={(e) => setRun(e.target.value)}>
                    <option value="">Dernier</option>
                    {index.data.map((id) => (
                      <option key={id} value={id}>{day(id)} · {id.endsWith("matin") ? "7h" : id.endsWith("midi") ? "13h" : "manuel"}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {page === "overview" && <Overview snap={snap.data} keep={keep} />}
            {page === "wikipedia" && <WikipediaPage snap={snap.data} />}
            {page === "wikidata" && <WikidataPage snap={snap.data} />}
            {page === "history" && <HistoryPage />}
            {page === "method" && <MethodPage />}
          </>
        )}
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>Données : API Wikipédia FR/EN et Wikidata · collecte automatique 07:05 et 13:05 UTC</span>
          <span><a href={REPO_URL}>Code source</a> · <a href={`${import.meta.env.BASE_URL}data/latest/meta.json`}>JSON brut</a></span>
        </div>
      </footer>
    </div>
  );
}

function Freshness({ snap, archived }: { snap: Snapshot; archived: boolean }) {
  if (archived) return <span className="pill pill-muted">Archive · {dt(snap.meta.fin)} UTC</span>;
  const { stale, ageH } = freshness(snap.meta);
  return (
    <span className={`pill ${stale ? "pill-warn" : "pill-ok"}`} title={`Généré il y a ${Math.round(ageH)} h`}>
      <i aria-hidden="true" />{stale ? "En retard" : "À jour"} · {dt(snap.meta.genere)} UTC
    </span>
  );
}
