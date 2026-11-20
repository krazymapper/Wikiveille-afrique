import { useMemo, useState, type ReactNode } from "react";
import { useParam } from "../lib/route";

export interface Column<T> {
  key: string;
  header: string;
  cell: (r: T) => ReactNode;
  sort?: (r: T) => string | number;
  align?: "right";
  nowrap?: boolean;
}

const PAGE_SIZE = 50;

export function DataTable<T>({ rows, columns, rowKey, defaultSort, csvName, csv }: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  defaultSort: { key: string; dir: "asc" | "desc" };
  csvName: string;
  csv: (r: T) => Record<string, string | number | boolean>;
}) {
  const [sort, setSort] = useState(defaultSort);
  const [pageStr, setPage] = useParam("page", "1");
  const page = Math.max(1, Number(pageStr) || 1);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return rows;
    const f = col.sort;
    const k = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => (f(a) > f(b) ? k : f(a) < f(b) ? -k : 0));
  }, [rows, columns, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = sorted.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const exportCsv = () => {
    const recs = sorted.map(csv);
    if (!recs.length) return;
    const heads = Object.keys(recs[0]);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = [heads.join(","), ...recs.map((r) => heads.map((h) => esc(r[h])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    a.download = csvName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="table-wrap">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th key={c.key} scope="col" className={c.align === "right" ? "num" : ""} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                    {c.sort ? (
                      <button type="button" onClick={() => setSort({ key: c.key, dir: active && sort.dir === "desc" ? "asc" : "desc" })}>
                        {c.header} <span aria-hidden="true">{active ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span>
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === "right" ? "num" : ""} ${c.nowrap ? "nowrap" : ""}`}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
            {!slice.length && (
              <tr><td colSpan={columns.length} className="empty">Aucun résultat pour ces filtres.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <nav className="pager" aria-label="Pagination">
        <span>{sorted.length ? `${(cur - 1) * PAGE_SIZE + 1}–${Math.min(cur * PAGE_SIZE, sorted.length)} sur ${sorted.length}` : "0 résultat"}</span>
        <div>
          <button type="button" className="btn" onClick={exportCsv} disabled={!sorted.length}>Exporter CSV</button>
          <button type="button" className="btn" disabled={cur <= 1} onClick={() => setPage(String(cur - 1))}>Précédent</button>
          <span className="pager-pos">{cur} / {pages}</span>
          <button type="button" className="btn" disabled={cur >= pages} onClick={() => setPage(String(cur + 1))}>Suivant</button>
        </div>
      </nav>
    </div>
  );
}
