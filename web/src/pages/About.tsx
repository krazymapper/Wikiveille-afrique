import { Card } from "../components/ui";
import { LogoHorizontal } from "../components/Logo";
import { href } from "../lib/route";

export function AboutPage({ repoUrl }: { repoUrl: string }) {
  return (
    <div className="stack prose">
      <div className="page-title">
        <h1>À propos</h1>
      </div>

      <Card>
        <div className="about-hero">
          <LogoHorizontal width={300} />
          <p>
            <strong>Wikiveille Afrique</strong> suit chaque jour ce qui s'écrit sur l'Afrique dans Wikipédia et Wikidata :
            les nouveaux articles en français et en anglais liés aux pays africains, et les nouveaux éléments Wikidata situés sur le continent.
          </p>
        </div>
      </Card>

      <div className="grid-3">
        <Card title="Pourquoi">
          <p>Rendre visible le travail des contributeurs, repérer les sujets qui émergent, et signaler les articles qui méritent un portail ou une relecture.</p>
        </Card>
        <Card title="Pour qui">
          <p>Les communautés et associations Wikimedia d'Afrique, les organisateurs d'éditathons, les bibliothécaires, chercheurs et journalistes qui suivent la connaissance libre sur le continent.</p>
        </Card>
        <Card title="Comment">
          <p>Un programme interroge les API publiques de Wikimédia à 07:05 et 13:05 UTC, puis publie les résultats sur ce site. Tout est expliqué dans la page <a href={href("method")}>Méthode</a>.</p>
        </Card>
      </div>

      <Card title="Ce qui est couvert">
        <ul>
          <li>Les 54 États africains et le Sahara occidental, plus les portails régionaux (Afrique de l'Ouest, Maghreb, Sahel, Corne de l'Afrique…).</li>
          <li>Wikipédia en français et en anglais, Wikidata.</li>
          <li>Un historique jour par jour, et les listes complètes des 30 derniers jours.</li>
        </ul>
      </Card>

      <Card title="Un projet ouvert">
        <p>
          Le code est libre et hébergé sur <a href={repoUrl}>GitHub</a>, les données sont téléchargeables en Excel et en JSON.
          Suggestions, corrections et contributions sont les bienvenues : voir la <a href={href("faq")}>FAQ</a> pour savoir comment nous écrire.
        </p>
      </Card>

      <Card title="Crédits">
        <p>Proposé avec amour par <strong>Saliousoft</strong>.</p>
        <p className="muted small">
          Données issues de Wikipédia et Wikidata, projets de la Wikimedia Foundation. Le logo est construit sur le modèle de logo Wikimedia et utilisé avec autorisation.
        </p>
      </Card>
    </div>
  );
}
