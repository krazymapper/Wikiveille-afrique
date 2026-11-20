import { Card } from "../components/ui";

export function MethodPage() {
  return (
    <div className="stack prose">
      <Card title="Ce que la veille collecte">
        <p>Deux fois par jour (07:05 et 13:05 UTC), un workflow GitHub Actions interroge les API de Wikipédia FR, Wikipédia EN et Wikidata pour la fenêtre <strong>J-1 07:00 UTC → maintenant</strong>. La mise à jour de 13h marque « nouveau » ce qui a été créé après 07:00.</p>
      </Card>
      <Card title="Wikipédia">
        <ul>
          <li><strong>Avec portail</strong> : l'article lie un portail d'un des 54 États africains ou du Sahara occidental, ou un portail régional (Afrique de l'Ouest, Maghreb, Sahel…). En anglais, un bandeau WikiProject Africa ou pays sur la page de discussion compte aussi.</li>
          <li><strong>À baliser</strong> : aucun portail, mais l'élément Wikidata lié situe l'article en Afrique.</li>
        </ul>
      </Card>
      <Card title="Wikidata">
        <ul>
          <li><strong>Confiance haute</strong> : pays africain en P17, P27, P495 ou P1532, continent Afrique (P30), ou lieu (P131, P276, P19, P20, P159, P740, P706, P551) dont le pays (P17) est africain.</li>
          <li><strong>Confiance moyenne</strong> : aucun pays, mais des coordonnées (P625) situées dans le contour simplifié de l'Afrique.</li>
          <li><strong>Créateur</strong> : bot (drapeau bot), humain avec outil de masse (QuickStatements, OpenRefine, PetScan…), ou humain.</li>
        </ul>
      </Card>
      <Card title="Données ouvertes">
        <p>Tous les fichiers sont publics : <code>data/latest/</code> (dernier passage), <code>data/archive/</code> (30 jours) et <code>data/historique.json</code>. Les contenus Wikidata sont sous CC0, les titres et métadonnées Wikipédia sous CC BY-SA.</p>
      </Card>
    </div>
  );
}
