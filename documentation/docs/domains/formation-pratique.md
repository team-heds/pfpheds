---
title: Domaine métier - formation pratique
---

## Résumé

La formation pratique est un des plus gros blocs métier du projet. Elle couvre :

- gestion des places
- affectations
- praticiens
- cohortes et étudiants
- workflows administratifs liés à la PFP

## Risques principaux

- droits historiques parfois portés par `page1.access`
- forte dépendance à la qualité des données
- coexistence entre logique frontend, services et scripts

## Réflexe de diagnostic

Quand un flux PFP ne fonctionne pas :

1. vérifier la permission
2. vérifier le store et le service appelés
3. vérifier la source de données réelle
4. vérifier si un script ou une migration prépare les données
