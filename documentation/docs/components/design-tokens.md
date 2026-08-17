---
title: Design tokens
---

# Design tokens de l’application

Les variables CSS `--app-*` de `src/assets/styles/tokens.scss` forment un contrat visuel additif. Elles préparent les évolutions futures sans modifier l’apparence actuelle de la plateforme.

## Compatibilité visuelle

Le jaune de marque reste exactement `#F3C300`. Les alias historiques (`--brand-*`, `--text-*`, rayons, espacements, typographie et focus) conservent leurs valeurs de production.

Le ticket n’applique pas une nouvelle palette globale, ne redimensionne pas les sidebars et ne change pas les breakpoints existants. La migration des composants vers les nouveaux tokens devra se faire progressivement, dans des tickets visuels séparés et validés par capture avant/après.

| Besoin futur | Token |
| --- | --- |
| Marque / action principale | `--app-color-brand` |
| Texte accessible sur la marque | `--app-color-on-brand` |
| Fond de page | `--app-color-page` |
| Carte / panneau | `--app-color-surface` |
| Bordure | `--app-color-border` |
| Texte principal / secondaire | `--app-color-text`, `--app-color-text-muted` |
| Succès, avertissement, erreur | `--app-color-success`, `--app-color-warning`, `--app-color-danger` |
| Focus clavier | `--app-color-focus`, `--app-shadow-focus` |

## Catégories

- Typographie : `--app-font-size-*`, `--app-font-weight-*`, `--app-line-height-*`.
- Espacement : `--app-space-1` à `--app-space-12`.
- Forme : `--app-radius-*`, `--app-shadow-*`.
- Contrôles : `--app-control-height-*`, `--app-control-padding-*`, `--app-touch-target`.
- Layout : `--app-page-max`, `--app-content-max`, `--app-sidebar-*`.
- Mouvement : `--app-duration-*`, `--app-ease-standard`.

## Exemple pour un nouveau composant

```css
.new-card {
  padding: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-xl);
  background: var(--app-color-surface);
}
```

## Règles de contribution

1. Préserver les alias historiques tant qu’un composant existant n’a pas fait l’objet d’une validation visuelle dédiée.
2. Utiliser les tokens `--app-*` pour les nouveaux composants.
3. Ne jamais modifier globalement le thème, la typographie ou les layouts dans une simple migration de tokens.
4. Comparer toute migration à la production en desktop, tablette et mobile.
5. Tester les pictogrammes, les données et les états interactifs en plus de la géométrie.
