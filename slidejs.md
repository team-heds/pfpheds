Tu travailles dans le dépôt GitHub officiel du projet PFPHEdS :

* Dépôt : https://github.com/team-heds/pfpheds
* Branche principale actuelle : `prod`
* Application : https://hedsvs.ch/
* Documentation : https://hedsvs.ch/docs/
* Jira : https://hedsdev2025.atlassian.net/jira/software/projects/HEDS25/summary
* Supabase Studio : https://studio2.hedsvs.ch/ — accès strictement réservé aux personnes autorisées

# Mission

Créer une présentation web complète, professionnelle et pédagogique avec Reveal.js pour expliquer le projet PFPHEdS aux équipes internes, aux nouveaux développeurs, aux utilisateurs métier et à l’entreprise externe qui reprendra une partie du projet.

Cette présentation doit fonctionner comme un véritable support de cours.

Pour chaque outil ou technologie, respecter cette structure :

1. Qu’est-ce que c’est ?
2. Quels sont les concepts et le vocabulaire importants ?
3. À quoi cela sert-il généralement ?
4. Pourquoi cette technologie a-t-elle été choisie ?
5. Comment est-elle utilisée concrètement dans PFPHEdS ?
6. Quelles sont les bonnes pratiques ?
7. Quelles sont les limites ou précautions ?

Ne produis pas simplement une liste de technologies. Chaque chapitre doit permettre à une personne non technique de comprendre le sujet.

# Règles importantes avant de modifier le projet

1. Inspecte d’abord entièrement la structure actuelle du dépôt.
2. Lis au minimum :

   * `README.md`
   * `package.json`
   * `documentation/docs/intro.md`
   * `documentation/docs/architecture.md`
   * `documentation/docs/system/overview.md`
   * `documentation/docs/backend/overview.md`
   * `documentation/docs/data/overview.md`
   * `documentation/docs/domains/formation-pratique.md`
   * `documentation/docs/domains/planning-soins.md`
   * `documentation/docs/ops/vps-topology.md`
   * `documentation/docs/ops/vps-operations.md`
3. Vérifie les informations contre le code et la documentation existante.
4. N’invente aucun service, accès, domaine, conteneur ou comportement.
5. Ne modifie pas le fonctionnement de l’application principale.
6. Ne déploie rien en production sans confirmation explicite.
7. Ne mets aucun secret, mot de passe, token, clé API, adresse IP sensible ou commande contenant des identifiants dans la présentation.
8. Si une information est incertaine, indique-la comme telle ou demande confirmation.

# Source visuelle

Une présentation PowerPoint existe sous le nom :

`Presentation_PFPHEdS_Workflow_Architecture_2026.pptx`

Si elle est disponible dans le workspace, utilise-la comme référence éditoriale et visuelle.

Ne cherche pas à convertir automatiquement chaque slide en image. Recrée le contenu proprement en HTML, CSS et Reveal.js afin que :

* les textes restent sélectionnables ;
* les liens soient cliquables ;
* les commandes soient copiables ;
* la présentation soit responsive ;
* le contenu soit maintenable ;
* la présentation soit accessible ;
* l’export PDF reste propre.

# Architecture demandée

Créer un projet indépendant dans :

```text
presentation/
├── package.json
├── index.html
├── README.md
├── vite.config.js
├── src/
│   ├── main.js
│   ├── presentation.js
│   ├── theme/
│   │   ├── heds-theme.scss
│   │   └── print.scss
│   ├── components/
│   │   ├── copy-code.js
│   │   ├── external-link.js
│   │   └── chapter-progress.js
│   └── slides/
│       ├── 00-introduction.js
│       ├── 01-projets-metier.js
│       ├── 02-jira.js
│       ├── 03-github.js
│       ├── 04-stack-frontend.js
│       ├── 05-backend-supabase.js
│       ├── 06-docker-vps.js
│       ├── 07-deploiement-documentation.js
│       ├── 08-outils-ia.js
│       ├── 09-reprise-externe.js
│       └── 10-conclusion.js
├── public/
│   ├── images/
│   ├── logos/
│   └── screenshots/
└── tests/
    └── presentation.spec.js
```

Tu peux adapter légèrement cette structure si la réalité du dépôt le justifie, mais la présentation doit rester isolée du frontend principal.

# Installation Reveal.js

Utiliser Reveal.js installé depuis npm, sans CDN externe.

Installer et configurer au minimum :

* `reveal.js`
* plugin Markdown si nécessaire ;
* plugin Highlight pour le code ;
* plugin Notes pour la vue présentateur ;
* plugin Search ;
* plugin Zoom.

La présentation doit pouvoir être lancée avec :

```bash
cd presentation
npm install
npm run dev
```

Elle doit pouvoir être construite avec :

```bash
npm run build
```

Ajouter si cela ne casse pas le projet principal des scripts racine explicites :

```json
{
  "presentation:dev": "npm --prefix presentation run dev",
  "presentation:build": "npm --prefix presentation run build"
}
```

N’ajoute la présentation à `build:all` qu’après avoir vérifié que le build principal, Docusaurus et la présentation restent indépendants et fonctionnels.

# URL cible

Préparer la présentation pour être publiée sous :

```text
https://hedsvs.ch/presentation/
```

Configurer correctement le `base path` Vite et les chemins vers les ressources.

Préparer les ajustements Caddy ou Docker nécessaires, mais ne pas modifier ni redémarrer la production sans confirmation explicite.

# Identité visuelle HEdS

Reprendre une mise en forme proche de la présentation HEdS existante.

Palette principale :

```css
--heds-yellow: #f2c300;
--heds-orange: #ef6c25;
--heds-blue: #00a0d2;
--heds-pink: #e40070;
--heds-green: #009b67;
--heds-black: #111111;
--heds-dark-gray: #2b2b2b;
--heds-gray: #666666;
--heds-light-gray: #f3f3f1;
--heds-white: #ffffff;
--heds-pale-yellow: #fff7d1;
```

Principes graphiques :

* fond principalement blanc ;
* titres noirs très lisibles ;
* jaune HEdS utilisé pour les repères importants ;
* bande colorée HEdS discrète ;
* logo officiel uniquement s’il existe déjà dans les ressources autorisées ;
* typographie Arial ou une police sans-serif proche ;
* contraste suffisant ;
* mise en page sobre, institutionnelle et moderne ;
* pas d’effets gadgets ni d’animations excessives ;
* transitions courtes et discrètes ;
* aucune dépendance à une ressource distante indispensable.

# Configuration Reveal.js

Configurer notamment :

```javascript
{
  hash: true,
  history: true,
  slideNumber: 'c/t',
  progress: true,
  controls: true,
  controlsTutorial: true,
  center: false,
  transition: 'slide',
  backgroundTransition: 'fade',
  overview: true,
  touch: true,
  keyboard: true,
  fragments: true
}
```

Utiliser les slides horizontales pour les grands chapitres et les slides verticales pour les approfondissements.

Exemple :

```text
Jira
├── Qu’est-ce que Jira ?
├── Le vocabulaire
├── Jira dans PFPHEdS
├── Faire un bon ticket
└── Backlog et sprints
```

# Sommaire principal

Créer un sommaire cliquable présentant ces chapitres :

1. Comprendre la plateforme PFPHEdS
2. Les deux projets métier
3. Jira et la gestion du travail
4. GitHub et la collaboration sur le code
5. La stack frontend
6. Le backend et Supabase
7. Docker, le VPS et l’hébergement
8. Déploiement et documentation
9. Zed, Codex, Claude Code et le vibe coding
10. Reprise par l’entreprise externe
11. Workflow complet et conclusion

Ajouter un moyen simple de revenir au sommaire depuis chaque grand chapitre.

# Chapitre 1 — Présentation générale de PFPHEdS

Expliquer :

* ce qu’est la plateforme ;
* à qui elle s’adresse ;
* son origine comme initiative interne proche d’une startup ;
* comment le prototype a permis de démontrer le potentiel du projet ;
* le partage des comptes, rôles, permissions et outils transversaux ;
* la séparation fonctionnelle entre Physiothérapie et Soins infirmiers.

Présenter clairement que la plateforme contient deux systèmes métier différents dans une même application.

# Chapitre 2 — Projet Formation Pratique · Physiothérapie

Prévoir au moins deux slides détaillées avec de véritables phrases explicatives.

Expliquer la question métier :

> Comment placer chaque étudiant en physiothérapie dans un stage clinique adapté, dans une institution partenaire, de manière équitable et traçable ?

Présenter :

* les étudiants ;
* les institutions partenaires ;
* les places de stage ;
* les praticiens formateurs ;
* les enseignants ;
* les PFP 1 à 4 ;
* les rattrapages ou périodes « prime » ;
* la collecte des offres ;
* le suivi des réponses des institutions ;
* la préparation des votations ;
* la vérification des critères ;
* la votation standard ;
* la votation prioritaire ou « lésé » ;
* les règles d’équité ;
* la validation des attributions ;
* les conventions et signatures ;
* les évaluations et notes ;
* le centre d’alertes ;
* les cas particuliers ;
* les changements de dates ou d’institutions ;
* les absences ;
* les échecs ;
* les étudiants lésés ;
* les étudiants SAE ;
* l’historique daté des événements.

# Chapitre 3 — Projet Académique · Soins infirmiers

Prévoir au moins deux slides détaillées avec de véritables phrases.

Expliquer la question métier :

> Comment organiser les cours, les enseignants, les salles et la charge de travail académique ?

Présenter :

* les années académiques ;
* les classes ;
* les modules ;
* les mini-briques ;
* le planning hebdomadaire ;
* les vues journalières et par salle ;
* les plannings semestriels et annuels ;
* la feuille de charges ;
* les périodes de 45 minutes ;
* les coefficients de pondération du référentiel Pilier 1.1 ;
* les charges par enseignant, module, classe et activité ;
* la postulation aux cours sans enseignant ;
* les tableaux de bord du secrétariat ;
* les responsables de module ;
* les enseignants ;
* les ressources et contenus pédagogiques.

Expliquer que la partie Formation Pratique doit ensuite être étendue aux Soins infirmiers.

# Chapitre 4 — Comprendre Jira

Commencer par une explication générale, indépendante du projet.

Expliquer :

* ce qu’est Jira ;
* ce qu’est un projet Jira ;
* ce qu’est un ticket ;
* la différence entre type et statut ;
* le backlog ;
* le sprint ;
* le tableau ;
* les priorités ;
* les responsables ;
* les estimations ;
* les dépendances ;
* les commentaires ;
* les labels ;
* les critères d’acceptation.

Ensuite, expliquer pourquoi Jira est utilisé dans PFPHEdS :

* source de vérité du travail ;
* centralisation des besoins ;
* priorisation ;
* préparation des sprints ;
* traçabilité des décisions ;
* lien avec GitHub ;
* suivi de l’avancement réel.

Lien cliquable :

https://hedsdev2025.atlassian.net/jira/software/projects/HEDS25/summary

Expliquer le workflow :

```text
Prêt à développer
→ EnCours
→ Revue de code
→ Prêt à déployer
→ Terminé
```

Préciser que « Bug » est un type de ticket, pas nécessairement un statut.

Expliquer les tickets non terminés en fin de sprint :

* retour dans le backlog ou déplacement vers un sprint futur ;
* conservation du statut réel ;
* commentaire expliquant la cause ;
* documentation du reste à faire ;
* ajout éventuel du label `reporté-sprint` ;
* repriorisation ;
* conservation de la trace dans le rapport de sprint.

# Chapitre 5 — Comprendre Git et GitHub

Expliquer d’abord la différence entre Git et GitHub.

Présenter :

* dépôt ;
* historique ;
* commit ;
* branche ;
* fusion ;
* pull request ;
* revue ;
* conflit ;
* branche protégée ;
* GitHub Actions ;
* contrôles automatiques.

Expliquer pourquoi GitHub est utilisé dans PFPHEdS :

* hébergement du code ;
* historique ;
* collaboration ;
* revue de code ;
* lien avec Jira ;
* automatisations ;
* traçabilité du déploiement.

Lien cliquable :

https://github.com/team-heds/pfpheds

Expliquer comment récupérer le projet :

```bash
git clone https://github.com/team-heds/pfpheds.git
cd pfpheds
npm install
npm run dev
```

Ajouter un bouton « Copier » fonctionnel sur chaque bloc de commande.

Expliquer le nommage :

```text
feature/HEDS25-XXX-description
fix/HEDS25-XXX-description
hotfix/HEDS25-XXX-description
chore/HEDS25-XXX-description
docs/HEDS25-XXX-description
```

Expliquer la pull request, la revue, les tests et l’interdiction de mettre des secrets dans Git.

# Chapitre 6 — Stack frontend

Expliquer séparément :

## Vue.js 3

* framework frontend ;
* composants ;
* réactivité ;
* Composition API ;
* utilisation dans l’application.

## Vite

* serveur de développement ;
* rechargement rapide ;
* compilation ;
* optimisation du build ;
* utilisation pour le développement et la production.

## PrimeVue, PrimeFlex et PrimeIcons

* bibliothèque de composants ;
* tableaux ;
* formulaires ;
* modales ;
* menus ;
* calendriers ;
* mise en page ;
* iconographie.

## Pinia

* état partagé ;
* session ;
* profil ;
* permissions ;
* données partagées entre les pages.

## Vue Router

* navigation ;
* routes ;
* paramètres ;
* gardes de navigation ;
* différence entre masquer une page et sécuriser les données côté backend.

## Sass/SCSS

* organisation des styles ;
* variables ;
* réutilisation ;
* cohérence visuelle.

## Bibliothèques spécialisées

Expliquer :

* Chart.js et ECharts ;
* FullCalendar ;
* Leaflet ;
* TipTap ;
* ExcelJS et xlsx ;
* jsPDF ;
* Three.js.

Pour chacune, indiquer son usage dans PFPHEdS.

# Chapitre 7 — Backend, PostgreSQL et Supabase

Expliquer ce qu’est un backend.

Présenter PostgreSQL :

* base relationnelle ;
* tables ;
* relations ;
* contraintes ;
* transactions ;
* SQL ;
* migrations ;
* sécurité.

Présenter Supabase globalement :

* plateforme backend construite autour de PostgreSQL ;
* PostgREST ;
* Auth/GoTrue ;
* Storage ;
* Realtime ;
* Studio ;
* fonctions ;
* auto-hébergement ou cloud.

Expliquer pourquoi Supabase a été choisi :

* PostgreSQL ;
* services cohérents ;
* API intégrée ;
* authentification ;
* fichiers ;
* temps réel ;
* possibilité d’auto-hébergement ;
* contrôle de l’infrastructure.

Présenter le RLS :

* Row Level Security ;
* contrôle au niveau des lignes ;
* utilisateur authentifié ;
* politiques ;
* importance des tests anonymes ;
* différence entre sécurité frontend et sécurité des données.

Lien vers Studio :

https://studio2.hedsvs.ch/

Afficher clairement :

> Accès réservé aux personnes autorisées. Ne jamais partager de mot de passe ou de clé dans cette présentation.

Présenter Node.js et Express :

* JavaScript côté serveur ;
* routes ;
* notifications push ;
* FTP/SFTP ;
* traitements Excel ;
* appels aux services IA.

Présenter Firebase comme héritage historique à migrer progressivement.

# Chapitre 8 — Docker

Expliquer :

* ce qu’est Docker ;
* image ;
* conteneur ;
* registre ;
* volume ;
* réseau ;
* variables d’environnement ;
* secrets ;
* Dockerfile ;
* Docker Compose.

Expliquer pourquoi Docker est utilisé :

* environnement reproductible ;
* isolation ;
* déploiement ;
* gestion de plusieurs services ;
* limitation des différences entre machines.

Présenter les conteneurs connus uniquement après vérification dans la documentation et la configuration réelle.

Ne jamais inventer un conteneur.

# Chapitre 9 — VPS Infomaniak

Expliquer ce qu’est un VPS :

* Virtual Private Server ;
* machine virtuelle ;
* Linux ;
* ressources ;
* stockage ;
* réseau ;
* disponibilité permanente ;
* administration à distance ;
* responsabilités de maintenance.

Expliquer que le VPS PFPHEdS est hébergé chez Infomaniak.

Présenter :

* Ubuntu ;
* SSH ;
* Docker ;
* sauvegardes ;
* mises à jour ;
* surveillance ;
* journaux ;
* sécurité réseau.

Expliquer la différence entre :

* ordinateur du développeur ;
* dépôt GitHub ;
* VPS ;
* conteneur Docker ;
* base de données ;
* navigateur utilisateur.

# Chapitre 10 — Caddy et HTTPS

Expliquer :

* serveur web ;
* reverse proxy ;
* nom de domaine ;
* DNS ;
* HTTPS ;
* certificat TLS ;
* routage vers les conteneurs.

Présenter uniquement les domaines réellement vérifiés, notamment :

* `hedsvs.ch`
* `api2.hedsvs.ch`

Expliquer comment Caddy dirige les requêtes vers le bon service.

# Chapitre 11 — Déploiement

Expliquer le déploiement actuel :

* compilation du frontend ;
* compilation de la documentation ;
* script `deploy-hedsvs.ps1` ;
* transfert par SSH ;
* synchronisation du backend ;
* reconstruction des images ;
* redémarrage des conteneurs ;
* vérification après déploiement.

Expliquer la cible future :

* CI/CD ;
* build automatisé ;
* tests ;
* artefacts ;
* traçabilité ;
* validation ;
* rollback ;
* contrôle avant production.

# Chapitre 12 — Documentation Docusaurus

Expliquer :

* ce qu’est Markdown ;
* ce qu’est Docusaurus ;
* documentation versionnée ;
* navigation ;
* recherche ;
* mise à jour avec le code ;
* intérêt pour la reprise externe.

Lien :

https://hedsvs.ch/docs/

Présenter les grandes catégories de documentation existantes après vérification du dépôt.

# Chapitre 13 — Zed

Expliquer ce qu’est un IDE.

Présenter Zed :

* éditeur rapide ;
* terminal ;
* Git ;
* recherche ;
* navigation dans le dépôt ;
* intégration avec les assistants ;
* réduction des changements de contexte.

Expliquer pourquoi Zed est utilisé sur PFPHEdS sans prétendre qu’il est obligatoire pour tous les développeurs.

# Chapitre 14 — Codex et Claude Code

Expliquer séparément :

## Codex

* agent de développement de l’écosystème OpenAI ;
* compréhension du dépôt ;
* recherche ;
* modification de fichiers ;
* exécution d’outils autorisés ;
* tests ;
* documentation ;
* diagnostic.

## Claude Code

* agent de développement de l’écosystème Anthropic ;
* exploration du dépôt ;
* modifications multi-fichiers ;
* aide à l’architecture ;
* tests ;
* documentation ;
* automatisation.

Ne fais pas de comparaison marketing non vérifiable.

Expliquer leurs limites :

* hallucinations ;
* mauvaise compréhension possible ;
* modification trop large ;
* risque de régression ;
* risque de sécurité ;
* coût ;
* besoin de revue humaine.

# Chapitre 15 — Vibe coding responsable

Expliquer ce qu’est le vibe coding.

Présenter ses avantages :

* prototypage rapide ;
* apprentissage ;
* génération de structure ;
* tâches répétitives ;
* documentation ;
* tests.

Présenter ses risques :

* dette technique ;
* code non compris ;
* failles ;
* incohérences ;
* dépendances inutiles ;
* absence de tests.

Imposer ce workflow :

```text
Ticket Jira clair
→ contexte donné à l’assistant
→ petite modification
→ lecture du diff
→ tests
→ revue humaine
→ pull request
→ validation
→ déploiement
```

Rappeler que l’équipe reste responsable de tout code fusionné.

# Chapitre 16 — Reprise par l’entreprise externe

Expliquer l’histoire avec prudence et professionnalisme :

* le projet est né comme initiative interne ;
* le prototype a démontré la valeur métier ;
* la direction a identifié son potentiel ;
* un budget d’environ 350 000 CHF a été attribué ;
* le service informatique a choisi une entreprise externe pour pérenniser la plateforme ;
* l’objectif n’est pas de « réparer » l’application actuelle ;
* la Formation Pratique sera reconstruite proprement ;
* la solution devra prendre en charge Physiothérapie et Soins infirmiers.

Présenter les raisons techniques sans accuser les personnes :

* permissions multiples ;
* Firebase et Supabase en parallèle ;
* migrations dispersées ;
* schéma historique ;
* déploiement manuel ;
* risques de sécurité ;
* dette structurelle.

Présenter le rôle de l’équipe HEdS :

* transmettre le métier ;
* expliquer les cas particuliers ;
* prioriser ;
* répondre aux questions ;
* tester ;
* valider ;
* accompagner l’adoption.

Présenter le rôle de l’entreprise :

* concevoir ;
* développer ;
* sécuriser ;
* tester ;
* documenter ;
* automatiser ;
* livrer une plateforme maintenable.

# Fonctionnalités interactives

Implémenter :

* sommaire cliquable ;
* liens externes cliquables ;
* ouverture des liens externes dans un nouvel onglet ;
* bouton Copier sur chaque commande ;
* message discret « Copié » ;
* navigation clavier ;
* navigation tactile ;
* vue plein écran ;
* vue d’ensemble ;
* notes du présentateur ;
* numéros de slides ;
* progression ;
* export PDF ;
* mode impression ;
* ancres permettant d’envoyer un lien vers une slide précise.

Les commandes doivent rester sélectionnables même sans JavaScript de copie.

# Accessibilité

Vérifier :

* contraste ;
* taille de police ;
* navigation clavier ;
* structure correcte des titres ;
* texte alternatif des images ;
* liens compréhensibles ;
* absence d’information communiquée uniquement par une couleur ;
* fonctionnement à 100 %, 125 % et 150 % de zoom ;
* fonctionnement sur desktop, tablette et mobile.

# Responsive

Tester au minimum :

* 1920 × 1080 ;
* 1440 × 900 ;
* 1366 × 768 ;
* 1024 × 768 ;
* 768 × 1024 ;
* 390 × 844.

Aucun texte ne doit être coupé ou sortir de la slide.

Si une slide contient trop de texte, crée une slide supplémentaire au lieu de réduire excessivement la police.

# Tests

Ajouter des tests Playwright vérifiant au minimum :

* chargement de la présentation ;
* présence du sommaire ;
* navigation vers un chapitre ;
* liens principaux ;
* fonctionnement d’un bouton Copier ;
* absence d’erreur JavaScript ;
* chargement des ressources ;
* affichage mobile ;
* fonctionnement du hash d’une slide ;
* absence de débordement évident sur les slides principales.

Exécuter :

```bash
npm run build
npm run test
```

Corriger toutes les erreurs avant de considérer le travail comme terminé.

# Documentation à produire

Créer `presentation/README.md` avec :

* prérequis ;
* installation ;
* lancement local ;
* build ;
* tests ;
* export PDF ;
* ajout d’une slide ;
* modification du thème ;
* ajout d’un lien ;
* ajout d’un bloc de code copiable ;
* publication sous `/presentation/` ;
* fonctionnement des slides horizontales et verticales ;
* précautions de sécurité.

# Livrables attendus

À la fin, fournir :

1. la présentation Reveal.js complète ;
2. le thème HEdS ;
3. le sommaire interactif ;
4. les commandes copiables ;
5. les liens cliquables ;
6. les notes de présentation ;
7. les tests ;
8. le README ;
9. une proposition d’intégration au build ;
10. la configuration prévue pour `/presentation/` ;
11. un rapport des fichiers créés et modifiés ;
12. les commandes exactes pour lancer et tester ;
13. les éventuels points nécessitant une validation humaine.

# Définition de terminé

Le travail est terminé uniquement si :

* la présentation compile ;
* tous les chapitres demandés sont présents ;
* les deux projets métier sont expliqués clairement ;
* chaque technologie possède une définition générale et un usage PFPHEdS ;
* les liens sont cliquables ;
* les commandes sont copiables ;
* la présentation est responsive ;
* les tests passent ;
* aucun secret n’est exposé ;
* la documentation est écrite ;
* le frontend principal n’est pas cassé ;
* Docusaurus continue de compiler ;
* la mise en forme respecte l’identité HEdS ;
* les informations ont été vérifiées contre le dépôt ;
* aucun déploiement en production n’a été effectué sans confirmation.

Commence par analyser le dépôt et me présenter un plan d’implémentation précis. Ensuite, réalise le travail par étapes, vérifie chaque étape et ne t’arrête pas à une simple maquette.
