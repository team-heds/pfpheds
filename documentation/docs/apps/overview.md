---
title: Applications intégrées
---

## Périmètre

Le projet embarque plusieurs applications ou sous-modules intégrés :

- chat
- mail
- notes
- calendrier
- fichiers
- événements

## Logique générale

Ces applications partagent :

- le même socle frontend
- la même authentification
- les mêmes conventions UI
- une partie des services transverses

## Point d'attention

Avant de modifier une application intégrée, vérifier :

- son service principal dans `src/service/`
- son store éventuel
- sa source de données réelle
- ses dépendances UI ou permissions
