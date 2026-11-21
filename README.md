# Wikiveille Afrique

Veille quotidienne des **nouveaux articles Wikipédia FR et EN** liés aux portails des pays africains et des **nouveaux éléments Wikidata situés en Afrique** (humains et bots séparés). Site statique servi par GitHub Pages, données collectées par GitHub Actions à 07:05 et 13:05 UTC.

## Architecture

```
                 cron 07:05 / 13:05 UTC (+ lancement manuel)
                                  │
┌──────────────── GitHub Actions : workflow « Veille » ────────────────┐
│ collect   Python 3.12 · collector/veille.py                          │
│           API fr/en.wikipedia.org + www.wikidata.org (OAuth facultatif)│
│           └─► branche `data` (1 commit écrasé à chaque passage)       │
│ build     Vite + React + TypeScript · web/  (+ branche data copiée)   │
│ deploy    actions/deploy-pages ─► https://krazymapper.github.io/Wikiveille-afrique/
└──────────────────────────────────────────────────────────────────────┘
```

| Couche | Choix | Pourquoi |
|---|---|---|
| Collecte | Python 3.12, `requests`, `openpyxl` | Reprise du script existant, sans réécriture de la logique de détection |
| Orchestration | GitHub Actions (cron) | Gratuit sur dépôt public, secret chiffré pour le jeton |
| Stockage | Branche `data` en JSON | Pas de base ni de serveur ; fichiers lisibles par tous ; `main` reste propre |
| Front | Vite 5, React 18, TypeScript strict, CSS natif | 2 dépendances d'exécution ; graphiques et tableau faits maison (≈60 Ko gzip) |
| Routage | Hash (`#/wikidata?pays=Nigeria`) | GitHub Pages ne réécrit pas les URL ; filtres partageables par lien |
| Hébergement | GitHub Pages (source : GitHub Actions) | HTTPS, CDN, zéro coût |

### Contrat de données (`data/`, schéma 1)

```
latest/meta.json          fenêtre, mode, compteurs, totaux
latest/wikipedia.json     articles FR/EN : statut « portail » ou « sans portail »
latest/wikidata.json      éléments Wikidata : createur humain | outil de masse | bot
latest/veille_afrique.xlsx
archive/<jour>_<passage>.json + archive/index.json   (30 jours)
historique.json           une ligne par passage
```

Les types TypeScript correspondants sont dans `web/src/lib/types.ts`.

## Mise en route

1. Pousser ce dossier sur `main` de https://github.com/krazymapper/Wikiveille-afrique (dépôt public).
2. **Settings › Pages › Build and deployment › Source : GitHub Actions.**
3. **Settings › Secrets and variables › Actions › New repository secret** : `WIKIMEDIA_TOKEN` = jeton OAuth 2 « basic » (meta.wikimedia.org › Special:OAuthConsumerRegistration). Facultatif en théorie, indispensable en pratique : sans jeton, les API répondent beaucoup plus lentement (un passage peut dépasser 20 min).
4. **Actions › Veille › Run workflow** une première fois : la branche `data` est créée (l'historique est amorcé avec `seed/historique.json`) et le site est publié.

## Développement local

```bash
cd web && npm install && npm run dev      # copie seed/sample dans public/data puis lance Vite
python3 collector/veille.py --data-dir web/public/data   # données fraîches (WIKIMEDIA_TOKEN conseillé)
```

## Points d'attention

- Les crons GitHub peuvent partir avec 5 à 30 min de retard aux heures chargées ; le mode est déduit de l'heure réelle (avant 12:00 UTC = édition de 7h).
- Sur un dépôt public, GitHub suspend les workflows planifiés après 60 jours sans activité sur le dépôt : un commit de temps en temps sur `main`, ou une réactivation dans l'onglet Actions, suffit.
- L'email récapitulatif a été retiré ; GitHub notifie par email les échecs de workflow (Settings › Notifications › Actions).
- Ne jamais committer le jeton : il ne vit que dans les secrets du dépôt.
