---
title: Thèmes & Dark Mode
sidebar_label: Thèmes
---

Cette page décrit la gestion des thèmes (clair/sombre) pour l’app et la documentation.

## Doc (Docusaurus)

- Le thème par défaut est sombre (`defaultMode: 'dark'`).
- Respect du thème système activé (`respectPrefersColorScheme: true`).
- Personnalisation dans `documentation/src/css/custom.css`:
  - Fonds et surfaces forcés à `#0B213F` en dark pour homogénéité avec l’app.
  - Navbar glass/blur et ombres discrètes.
  - Sidebar compacte, typographie réduite.
  - Cercles de fond (top-left / bottom-right) en pseudo-éléments.

## App (Vite / Vue)

- Palette alignée avec la doc (brand doré, fond navy foncé).
- Vérifier l’accessibilité (contraste AA) pour les textes et liens.

## Bonnes pratiques

- Centraliser les couleurs et tokens pour cohérence.
- Éviter l’opacité trop élevée sur les teintes en dark mode.
- Tester le rendu sur différents écrans (luminosité / HDR).
