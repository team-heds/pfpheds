---
title: Design tokens
---

# Design tokens de l’application

Les variables CSS `--app-*` de `src/assets/styles/tokens.scss` constituent le contrat visuel commun de la plateforme. Elles évitent que chaque vue redéfinisse ses couleurs, dimensions et espacements, et permettent aux thèmes clair et sombre de rester cohérents.

## Couleurs et thèmes

Le jaune de marque reste exactement `#F3C300`. Il s’emploie pour les actions principales, les repères actifs et les accents. Le texte posé sur ce jaune doit utiliser `--app-color-on-brand`, jamais du blanc, afin de conserver un contraste lisible.

Le thème clair utilise un fond ivoire-sauge doux (`#EEF1F0`), des cartes presque blanches (`#FBFBF8`) et des bordures visibles (`#D8DEDA`). Les composants ne doivent pas utiliser directement ces valeurs : ils consomment les tokens sémantiques ci-dessous, automatiquement reliés au thème actif.

| Besoin | Token |
| --- | --- |
| Marque / action principale | `--app-color-brand` |
| Texte sur la marque | `--app-color-on-brand` |
| Fond de page | `--app-color-page` |
| Carte / panneau | `--app-color-surface` |
| Bordure | `--app-color-border` |
| Texte principal / secondaire | `--app-color-text`, `--app-color-text-muted` |
| Succès, avertissement, erreur | `--app-color-success`, `--app-color-warning`, `--app-color-danger` |
| Focus clavier | `--app-color-focus`, `--app-shadow-focus` |

## Typographie, espace et forme

- Typographie : `--app-font-size-*`, `--app-font-weight-*`, `--app-line-height-*`.
- Espacement : `--app-space-1` à `--app-space-12`, `--app-page-gutter`, `--app-section-gap`.
- Forme : `--app-radius-*`, `--app-shadow-*`.
- Contrôles : `--app-control-height-*`, `--app-control-padding-*`, `--app-touch-target`.
- Layout : `--app-page-max`, `--app-content-max`, `--app-sidebar-*`, `--app-social-side-width`.
- Mouvement : `--app-duration-*`, `--app-ease-standard`.

## Exemple

```css
.card {
  padding: var(--app-page-gutter);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-xl);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  box-shadow: var(--app-shadow-xs);
}

.card__action {
  min-height: var(--app-touch-target);
  background: var(--app-color-brand);
  color: var(--app-color-on-brand);
}
```

## Responsive et accessibilité

Les layouts partagés assurent trois niveaux de reflow : desktop, tablette et mobile. En dessous de `40rem`, les actions et champs importants occupent la largeur disponible et les contrôles gardent une cible tactile minimale de 44 px. Le layout social conserve des colonnes latérales de largeur identique sur desktop, masque la colonne droite sur tablette puis passe en une colonne sur mobile.

Toujours utiliser `:focus-visible`, préserver les éléments HTML natifs, fournir les états `disabled`, chargement, succès et erreur, et respecter `prefers-reduced-motion`. Les textes et contrôles ne doivent pas dépendre uniquement de la couleur.

## Règles de contribution

1. Réutiliser un token sémantique existant avant d’ajouter une valeur locale.
2. Ajouter un token uniquement lorsqu’une décision visuelle est partagée par plusieurs composants.
3. Ne pas introduire de nouvelle couleur hexadécimale dans un composant migré.
4. Tester les deux thèmes à 1440 px, 768 px, 390 px et vérifier le reflow à 320 px.
5. Garder les alias historiques uniquement pendant la migration progressive ; tout nouveau code utilise `--app-*`.
