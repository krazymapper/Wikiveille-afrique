import type { ReactNode } from "react";
import { href } from "../lib/route";

const QA: { q: string; a: ReactNode }[] = [
  {
    q: "À quelle fréquence les données sont-elles mises à jour ?",
    a: <p>Deux fois par jour : l'édition de 7h (07:05 UTC) et la mise à jour de 13h (13:05 UTC). Chaque passage couvre la période qui va de la veille à 07:00 UTC jusqu'au moment de la collecte.</p>,
  },
  {
    q: "Pourquoi la mise à jour arrive-t-elle parfois en retard ?",
    a: <p>La collecte tourne sur GitHub Actions, dont les tâches planifiées peuvent démarrer avec 5 à 30 minutes de retard aux heures chargées. Si l'indicateur en haut à droite passe à « En retard », c'est qu'aucun passage n'a abouti depuis plus de 20 heures.</p>,
  },
  {
    q: "Pourquoi les heures sont-elles en UTC ?",
    a: <p>Ce sont les heures utilisées par Wikipédia et Wikidata dans leurs historiques. Les garder telles quelles permet de les comparer directement avec les pages des projets. UTC correspond à l'heure de Dakar ou d'Abidjan ; ajoutez 1 h pour Cotonou, Lagos ou Kinshasa, 2 h pour Le Caire ou Johannesburg, 3 h pour Nairobi.</p>,
  },
  {
    q: "Que veut dire « nouveau » ?",
    a: <p>Dans la mise à jour de 13h, le badge « nouveau » signale ce qui a été créé après 07:00 UTC, c'est-à-dire depuis l'édition du matin.</p>,
  },
  {
    q: "Que signifie « à baliser » ?",
    a: (
      <>
        <p>L'article ne lie aucun portail africain, mais l'élément Wikidata auquel il est rattaché le situe en Afrique (pays, lieu de naissance, siège…).</p>
        <p>C'est une piste de travail pour les contributeurs : ajouter le bon portail améliore la visibilité de l'article.</p>
      </>
    ),
  },
  {
    q: "Pourquoi un article que je viens de créer n'apparaît-il pas ?",
    a: (
      <>
        <p>Plusieurs raisons possibles :</p>
        <p>• il a été créé après le dernier passage : il apparaîtra au prochain ;<br />
          • il ne lie aucun portail africain et n'est pas encore relié à un élément Wikidata situé en Afrique ;<br />
          • c'est une redirection, ou il a été supprimé ou renommé depuis ;<br />
          • il a été créé ailleurs que dans l'espace principal (brouillon, page utilisateur).</p>
      </>
    ),
  },
  {
    q: "Quelle différence entre humain, outil de masse et bot ?",
    a: <p>« Bot » : le compte porte le statut de bot. « Outil de masse » : un humain a créé l'élément avec QuickStatements, OpenRefine, PetScan ou un outil équivalent (repéré dans le résumé ou les balises de la modification). « Humain » : tout le reste.</p>,
  },
  {
    q: "Que veulent dire les niveaux de confiance Wikidata ?",
    a: <p>« Haute » : un pays africain est indiqué directement ou via un lieu. « Moyenne » : seules les coordonnées géographiques tombent en Afrique. Le détail est dans la page <a href={href("method")}>Méthode</a>.</p>,
  },
  {
    q: "Puis-je réutiliser les données ?",
    a: <p>Oui. Le fichier Excel et les fichiers JSON (<code>data/latest/</code>, <code>data/historique.json</code>) sont publics. Les données Wikidata sont sous CC0 ; les titres et métadonnées Wikipédia relèvent de CC BY-SA, merci de citer la source.</p>,
  },
  {
    q: "Le site collecte-t-il des données personnelles ?",
    a: <p>Non : pas de compte, pas de cookie, pas de mesure d'audience. Seul votre choix de mode clair ou sombre est mémorisé dans votre navigateur. Les noms d'auteurs affichés sont les pseudonymes publics des contributeurs Wikimedia.</p>,
  },
];

export function FaqPage({ repoUrl }: { repoUrl: string }) {
  return (
    <div className="stack">
      <div className="page-title">
        <h1>Questions fréquentes</h1>
        <p className="muted">Vous ne trouvez pas votre réponse ? <a href={`${repoUrl}/issues/new`}>Posez la question sur GitHub</a>.</p>
      </div>
      <div className="faq">
        {QA.map((item, i) => (
          <details key={item.q} open={i === 0}>
            <summary>{item.q}</summary>
            <div>{item.a}</div>
          </details>
        ))}
        <details>
          <summary>Comment signaler une erreur ou proposer une amélioration ?</summary>
          <div>
            <p>Ouvrez un ticket sur <a href={`${repoUrl}/issues`}>la page GitHub du projet</a> en indiquant le titre de l'article ou le QID concerné. Les contributions au code sont aussi les bienvenues.</p>
          </div>
        </details>
      </div>
    </div>
  );
}
