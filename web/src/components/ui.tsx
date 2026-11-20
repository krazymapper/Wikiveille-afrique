import type { ReactNode } from "react";

export const Card = ({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={`card ${className}`}>
    {(title || action) && (
      <div className="card-head">
        {title && <h2>{title}</h2>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const NewBadge = () => <span className="badge badge-new">nouveau</span>;
export const TagBadge = ({ children }: { children: ReactNode }) => <span className="badge badge-warn">{children}</span>;

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export const SelectField = ({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <label className="field">
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export const SearchField = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <label className="field field-grow">
    <span>Recherche</span>
    <input type="search" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export const Kpi = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="kpi">
    <span className="kpi-label">{label}</span>
    <span className="kpi-value">{value}</span>
    {sub && <span className="kpi-sub">{sub}</span>}
  </div>
);

export const Empty = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;
