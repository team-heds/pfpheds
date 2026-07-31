# Présentation Reveal.js PFPHEdS

Support de cours web pour expliquer PFPHEdS aux équipes internes, aux nouveaux développeurs, aux utilisateurs métier et à l'entreprise externe chargée de reprendre une partie du projet.

## Prérequis

- Node.js 18+
- npm
- Navigateur Chromium, Firefox ou WebKit pour les tests Playwright

## Installation

```bash
cd presentation
npm install
```

## Lancement local

```bash
npm run dev
```

URL locale : `http://localhost:5182/presentation/`.

Depuis la racine du dépôt :

```bash
npm run presentation:dev
```

## Build

```bash
npm run build
```

Depuis la racine :

```bash
npm run presentation:build
```

La configuration Vite utilise `base: '/presentation/'` pour préparer une publication sous `https://hedsvs.ch/presentation/`.

## Tests

```bash
npm run test
```

Depuis la racine :

```bash
npm run presentation:test
```

Les tests vérifient le chargement, le sommaire, la navigation, les liens, la copie de commandes, le hash, le mobile et l'absence d'erreurs JavaScript.

## Export PDF

Lancer la présentation, puis ouvrir :

```text
http://localhost:5182/presentation/?print-pdf
```

Utiliser ensuite l'impression du navigateur en PDF.

## Ajouter une slide

1. Ouvrir le fichier adapté dans `src/slides/`.
2. Ajouter une entrée dans le tableau exporté.
3. Garder une slide courte ; si le texte déborde, créer une slide supplémentaire.
4. Relancer `npm run build` et `npm run test`.

## Modifier le thème

Modifier principalement :

- `src/theme/heds-theme.scss`
- `src/theme/print.scss`

Le thème utilise la palette HEdS définie dans `slidejs.md`.

## Ajouter un lien

Utiliser un lien HTML normal :

```html
<a href="https://hedsvs.ch/docs/" target="_blank" rel="noreferrer noopener">Documentation</a>
```

Le composant `external-link.js` sécurise automatiquement les liens externes.

## Ajouter un bloc de code copiable

```html
<pre><code class="language-bash">npm run dev</code></pre>
```

Le composant `copy-code.js` ajoute automatiquement le bouton Copier. Les commandes restent sélectionnables sans JavaScript.

## Slides horizontales et verticales

- Un chapitre principal est une slide horizontale.
- Les approfondissements du chapitre sont des slides verticales imbriquées.
- Le sommaire pointe vers les chapitres horizontaux.

## Publication sous `/presentation/`

Le build produit un dossier `presentation/dist/`. Pour publier sous `https://hedsvs.ch/presentation/`, il faut copier ce contenu dans un sous-dossier `presentation/` du répertoire statique servi par Caddy.

Proposition d'intégration future, à valider avant production :

1. `npm run presentation:build`
2. copier `presentation/dist/` vers `dist/presentation/`
3. adapter le script de déploiement pour inclure ce dossier
4. vérifier `https://hedsvs.ch/presentation/`

Aucun redémarrage production n'a été effectué par cette implémentation.

## Précautions de sécurité

- Ne jamais placer de mot de passe, token, clé API, IP sensible ou commande contenant des identifiants.
- Les accès SSH, Supabase Studio et informations serveur réelles doivent rester transmis hors dépôt.
- Les slides décrivent les principes et les noms publics vérifiés, pas les secrets d'exploitation.
