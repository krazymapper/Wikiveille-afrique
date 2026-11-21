// Logo Wikiveille Afrique : le continent, et un signal de veille qui part de l'Afrique de l'Ouest (Bénin).
export const AFRICA_PATH =
  "M11.0 23.8 L11.2 20.0 L13.6 16.0 L15.7 14.7 L15.7 13.1 L18.1 10.9 L20.5 11.3 L28.4 10.0 L28.0 12.1 L28.7 12.6 L33.9 14.0 L36.9 13.4 L41.3 13.6 L42.5 13.7 L42.9 14.8 L42.5 15.8 L43.3 18.1 L44.4 20.0 L45.5 23.0 L48.1 25.1 L53.0 25.5 L51.0 30.0 L46.7 33.9 L45.6 36.4 L46.4 39.1 L46.6 41.8 L43.3 47.0 L41.8 48.5 L40.0 51.9 L37.3 53.5 L33.9 54.0 L32.8 53.7 L31.7 50.1 L28.7 43.1 L29.6 38.0 L28.9 35.8 L27.0 33.2 L27.5 30.4 L26.8 30.1 L25.0 30.2 L22.7 29.1 L19.9 29.8 L17.1 30.2 L14.6 28.7 L13.4 27.0 L11.4 25.2 Z";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="14" fill="#1F5FAD" />
      <path d={AFRICA_PATH} fill="#FFFFFF" strokeLinejoin="round" stroke="#FFFFFF" strokeWidth="1.2" />
      <ellipse cx="50.3" cy="44.3" rx="1.6" ry="3.6" transform="rotate(20 50.3 44.3)" fill="#FFFFFF" />
      <g fill="none" stroke="#F2A541" strokeWidth="2.4" strokeLinecap="round">
        <path d="M17.2 22.5 A7 7 0 0 1 28.6 22.5" />
        <path d="M13.3 18.6 A12.5 12.5 0 0 1 32.5 18.6" opacity=".6" />
      </g>
      <circle cx="22.9" cy="27.3" r="3.4" fill="#F2A541" stroke="#1F5FAD" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-word">
        <span className="logo-wiki">Wikiveille</span>
        <span className="logo-afr">Afrique</span>
      </span>
    </span>
  );
}
