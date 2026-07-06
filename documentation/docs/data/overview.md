---
title: Données, coexistence Firebase et Supabase
---

## Résumé

Le projet est en migration. Pour chaque fonctionnalité, il faut identifier si la source de vérité est Firebase, Supabase ou le backend Node.

## Réalité actuelle

Le système n'est pas encore totalement unifié :

- certaines données vivent encore côté Firebase
- d'autres sont déjà portées par Supabase
- certains flux passent par le backend

## Réflexe de reprise

Avant toute modification :

1. identifier la source de données réelle
2. vérifier les migrations et policies
3. vérifier si le frontend appelle un service direct ou un endpoint backend
