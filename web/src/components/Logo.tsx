// Logo officiel Wikiveille Afrique (fichiers fournis dans public/brand/).
const BRAND = `${import.meta.env.BASE_URL}brand/`;

/** Sous 64 px, la version favicon (simplifiée) reste lisible ; au-delà, le symbole complet. */
export function LogoMark({ size = 40 }: { size?: number }) {
  const src = size < 64 ? `${import.meta.env.BASE_URL}favicon.svg` : `${BRAND}wikiveille-afrique_symbole.svg`;
  return <img src={src} width={size} height={size} alt="" className="logo-mark" />;
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

/** Logo horizontal complet ; version négative en thème sombre. */
export function LogoHorizontal({ width = 320 }: { width?: number }) {
  const h = Math.round((width * 270) / 767);
  return (
    <>
      <img className="only-light" src={`${BRAND}wikiveille-afrique_horizontal.svg`} width={width} height={h} alt="Wikiveille Afrique" />
      <img className="only-dark" src={`${BRAND}wikiveille-afrique_horizontal_negatif.svg`} width={width} height={h} alt="Wikiveille Afrique" />
    </>
  );
}
