---
title: Utiliser GitHub avec le projet
sidebar_label: GitHub
---

Ce guide décrit le flux GitHub du projet : cloner le dépôt, travailler sur une branche propre, ouvrir une Pull Request, puis livrer un code traçable et relisible.

## Cloner et démarrer

```bash
git clone https://github.com/antoinequarroz/pfpheds.git
cd pfpheds
npm install
npm run dev
```

Pour lancer la documentation locale :

```bash
npm run docs:dev
```

Voir aussi :

- `getting-started`
- `ops/development`
- `contrib/workflow`

## Stratégie de branches

Branches utilisées dans le dépôt :

- `main` : branche d'intégration principale
- `prod` : branche de déploiement de production
- `feature/<ticket>-<slug>` : nouvelle fonctionnalité
- `fix/<ticket>-<slug>` : correction ciblée
- `hotfix/<ticket>-<slug>` : correction urgente pour production

Exemple :

```bash
git checkout -b feature/JIRA-123-filtre-carte
```

## Conventions de commit

Règles recommandées :

- préfixer avec la clé Jira quand elle existe ;
- garder un message court, précis et orienté intention ;
- éviter les commits fourre-tout.

Exemples :

```bash
git commit -m "JIRA-123: ajoute le filtre par site"
git commit -m "fix(auth): corrige la redirection après login"
```

## Pull Requests

Une PR propre doit contenir :

- un titre explicite ;
- une description du changement ;
- la méthode de test ;
- les impacts éventuels sur les données, droits, routes ou déploiements ;
- une mise à jour documentaire si le comportement change.

Cible habituelle :

- `main` pour le développement courant ;
- `prod` uniquement pour un hotfix ou une release contrôlée.

## Vérifications avant PR

Commandes minimales :

```bash
npm run lint
npm run build
npm run docs:build
```

Si la PR touche les flux métier, vérifier aussi :

- navigation selon les rôles ;
- appels Supabase/Firebase concernés ;
- régressions visuelles sur desktop et mobile ;
- documentation impactée.

## CI/CD

Le dépôt contient une pipeline GitHub Actions de déploiement. Le point d'entrée principal est :

```text
.github/workflows/deploy-prod.yml
```

Le flux standard est :

1. build de l'application ;
2. éventuellement build de la documentation ;
3. publication des artefacts ;
4. déploiement de `dist/`.

Quand la documentation doit être livrée avec l'application, utiliser :

```bash
npm run build:all
```

## Documentation liée à GitHub

La documentation Docusaurus est structurée ici :

- contenu : `documentation/docs/`
- navigation : `documentation/sidebars.js`
- configuration : `documentation/docusaurus.config.js`
- assets statiques : `documentation/static/`

Toute modification fonctionnelle importante doit être accompagnée d'une mise à jour documentaire.

## Jira et traçabilité

Le projet s'appuie sur une traçabilité simple entre code et pilotage :

- la clé Jira apparaît dans le nom de branche ;
- la même clé peut apparaître dans les commits ;
- la PR reprend cette clé dans son titre si applicable.

Exemple :

- branche : `feature/JIRA-245-export-stage`
- commit : `JIRA-245: ajoute l'export CSV`
- PR : `JIRA-245: export des données de stage`

## Bonnes pratiques

- faire des PR petites et ciblées ;
- éviter les mélanges refactor + feature + fix dans la même PR ;
- documenter les décisions non évidentes ;
- ajouter des captures si l'UI change ;
- supprimer le code mort dans le même périmètre quand c'est sûr ;
- garder l'historique lisible pour qu'un autre développeur puisse reprendre sans contexte oral.
