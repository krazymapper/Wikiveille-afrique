// Graphiques en SVG/HTML natif : aucun dépendance, lisibles en clair et sombre via les variables CSS.

export function BarList({ rows, max = 8, onPick }: { rows: [string, number][]; max?: number; onPick?: (k: string) => void }) {
  const top = rows.slice(0, max);
  const peak = top[0]?.[1] || 1;
  return (
    <ul className="barlist">
      {top.map(([k, v]) => (
        <li key={k}>
          {onPick ? (
            <button type="button" className="barlist-row" onClick={() => onPick(k)}>
              <BarRow k={k} v={v} peak={peak} />
            </button>
          ) : (
            <div className="barlist-row"><BarRow k={k} v={v} peak={peak} /></div>
          )}
        </li>
      ))}
    </ul>
  );
}

const BarRow = ({ k, v, peak }: { k: string; v: number; peak: number }) => (
  <>
    <span className="barlist-label"><span>{k}</span><strong>{v}</strong></span>
    <span className="barlist-track"><span className="barlist-fill" style={{ width: `${Math.max(2, (v / peak) * 100)}%` }} /></span>
  </>
);

export interface StackPoint { label: string; title: string; parts: number[] }

/** Histogramme empilé. `series` donne nom + variable CSS de couleur de chaque part. */
export function StackedBars({ points, series, height = 220 }: {
  points: StackPoint[];
  series: { name: string; color: string }[];
  height?: number;
}) {
  const peak = Math.max(1, ...points.map((p) => p.parts.reduce((a, b) => a + b, 0)));
  const desc = points.map((p) => `${p.title} : ${p.parts.map((v, i) => `${series[i].name} ${v}`).join(", ")}`).join(" ; ");
  return (
    <figure className="stacked">
      <div className="legend">
        {series.map((s) => (
          <span key={s.name}><i style={{ background: s.color }} />{s.name}</span>
        ))}
      </div>
      <div className="stacked-plot" style={{ height }} role="img" aria-label={desc}>
        {points.map((p) => {
          const total = p.parts.reduce((a, b) => a + b, 0);
          return (
            <div key={p.title} className="stacked-col" title={`${p.title} — ${p.parts.map((v, i) => `${series[i].name} : ${v}`).join(" · ")}`}>
              <span className="stacked-total">{total}</span>
              <div className="stacked-bar" style={{ height: `${(total / peak) * 100}%` }}>
                {p.parts.map((v, i) => (
                  <span key={i} style={{ flexGrow: v, background: series[i].color }} />
                )).reverse()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="stacked-axis">
        {points.map((p) => <span key={p.title}>{p.label}</span>)}
      </div>
    </figure>
  );
}
