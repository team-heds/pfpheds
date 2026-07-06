---
title: Bibliothèque de composants - admin et widgets
---

## Répertoires concernés

- `src/components/admin/common/`
- `src/components/admin/layouts/`
- `src/components/admin/widgets/`
- `src/components/admin/places/`
- `src/components/admin/forms/`
- `src/components/admin/details/`

## Blocs réutilisables

### Headers

- `AdminPageHeader.vue`
- `PageHeader.vue`

Rôle :

- unifier les titres ;
- exposer les actions principales ;
- éviter que chaque vue admin recrée sa propre structure d’en-tête.

### Layout admin

- `AdminLayout.vue`
- `AdminSidebar.vue`
- `SidebarMenuItems.vue`

Rôle :

- fournir une coque commune ;
- encapsuler la navigation et les zones d’actions ;
- stabiliser le rendu entre les sections admin.

### Widgets KPI / dashboard

- `StatsCard.vue`
- `KpiCard.vue`
- `AlertsWidget.vue`
- `DashboardKpiGrid.vue`
- `MiniChart.vue`
- `PeriodSelector.vue`
- `PeriodComparisonPanel.vue`
- `PfpCohortKpiWidget.vue`
- `PfpComparisonView.vue`
- `SmartVisualization.vue`
- `ResizableWidgetGrid.vue`

Rôle :

- construire les dashboards académiques, PFP et analytiques ;
- encapsuler l’affichage des indicateurs ;
- centraliser la logique de comparaison, de personnalisation et d’export visuel.

### Visualisations élémentaires

- `widgets/charts/BarChart.vue`
- `widgets/charts/LineChart.vue`
- `widgets/charts/PieChart.vue`
- `widgets/charts/DoughnutChart.vue`
- `widgets/charts/SimpleTable.vue`

Rôle :

- fournir des briques de base branchées sur les widgets plus riches ;
- éviter de dupliquer la configuration des graphes.

### Dialogs et formulaires

- `CreatePlaceDialog.vue`
- `StudentCreateDialog.vue`
- `StudentEditDialog.vue`
- `EnseignentForm*.vue`
- `EtudiantForm*.vue`
- `InstitutionForm*.vue`
- `NewUserForm*.vue`

Rôle :

- piloter les flux CRUD les plus fréquents ;
- concentrer validation, mapping et émission des événements.

## Couplage réel

Ces composants sont rarement purement visuels. Ils portent souvent :

- des hypothèses de schéma ;
- des noms de champs historiques ;
- des branches métier liées aux rôles ;
- des adaptations PFP spécifiques.

En pratique, un widget admin doit être traité comme un composant métier, pas comme une simple brique d’interface.

## Composants à lire en priorité

### `src/components/admin/widgets/DashboardKpiGrid.vue`

Ce composant gère :

- la personnalisation locale du dashboard ;
- le drag and drop HTML5 ;
- la visibilité des KPI ;
- l’export / import JSON ;
- le stockage local de la configuration ;
- le mode comparaison.

Conséquence : si un dashboard semble purement visuel, le bug peut en réalité venir d’un état local persistant, pas seulement des données.

### `src/components/admin/widgets/KpiCard.vue`

Carte KPI pivot. C’est la couche d’affichage qui reçoit la plupart des props enrichies.

### `src/components/admin/places/CreatePlaceDialog.vue`

Composant critique pour la création de places. Il est couplé :

- aux stores de places ;
- aux institutions ;
- aux praticiens formateurs ;
- au mapping métier des champs PFP.

### `src/components/admin/details/*`

Sous-dossier hétérogène, très métier, à auditer avec prudence. Plusieurs composants y embarquent encore des conventions historiques et des noms de champs peu homogènes.

## Réflexe de maintenance

Quand une page admin casse :

1. vérifier la vue ;
2. vérifier le composant métier branché dans la vue ;
3. vérifier le store ou service qui l’alimente ;
4. vérifier le contrat de données attendu ;
5. vérifier si le problème vient d’un reliquat legacy dans les noms de champs.
