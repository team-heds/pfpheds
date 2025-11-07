---
id: design-system
title: Design System
sidebar_label: Design System
---

Ce document décrit les fondations UI utilisées dans la plateforme.

## Couleurs & surfaces

Les variables de thème principales sont définies dans `documentation/src/css/custom.css`.

- Couleur primaire (brand): `--ifm-color-primary: #f3c300`
- Surfaces & bordures:
  - `--doc-card-radius: 16px`
  - `--doc-card-shadow: 0 6px 20px rgba(243, 195, 0, 0.10)`
  - `--doc-border-color: rgba(255, 255, 255, 0.08)`
- Mode sombre (docs):
  - Fond: `#0B213F` (harmonisé avec l'app)

## Layout & composants

- Sidebar compacte: `--doc-sidebar-width: 180px` (typographie resserrée)
- Navbar "glass" avec blur et ombre douce
- Cartes/alertes avec rayon et ombres harmonisées

## Code & blocks

- Différenciation visuelle entre blocs de **commandes** (bord doré) et **code** (bord violet)
- Inline code avec teinte dorée légère

## Bonnes pratiques

- Réutiliser les tokens existants (couleurs, rayon, ombre)
- Préférer des classes utilitaires (PrimeFlex) et styles globaux docs
- Garder un contraste suffisant (AA) en dark mode
