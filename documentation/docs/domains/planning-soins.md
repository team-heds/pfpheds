---
title: Domaine métier - planning et soins infirmiers
---

## Périmètre

Ce domaine regroupe :

- années académiques
- planning journalier
- planning hebdomadaire
- planning semestriel
- planning annuel
- workload et feuilles de charge
- dashboards et workflows soins infirmiers

## Emplacements principaux

### Vues

- `src/views/admin/planning/`
- `src/views/planning/`
- `src/views/admin/soins-infirmiers/`

### Services et composables

- `src/service/planningService.js`
- `src/service/academicPlanningService.js`
- `src/service/workloadService.js`
- `src/service/academicYearService.js`
- `src/composables/useAcademicYear.js`
- `src/composables/useModulePlanning.js`

## Données sensibles pour ce domaine

- année académique active
- périodes et semestres
- classes
- modules
- cours
- périodes asynchrones

## Nature du risque

Un bug dans ce domaine crée souvent :

- des incohérences de calendrier
- des affectations erronées
- des dashboards trompeurs
- des vues vides si l'année académique n'est pas correctement résolue

## Règle de diagnostic

Quand une vue planning est vide ou incohérente :

1. vérifier l'année académique sélectionnée
2. vérifier la structure de données module/cours/période
3. vérifier si la vue dépend d'un store local ou d'un service admin
4. vérifier les migrations récentes touchant les périodes
