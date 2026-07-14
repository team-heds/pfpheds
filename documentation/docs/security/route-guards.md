---
title: Route guards
---

Le guard statique (`router.beforeEach`) est détaillé ligne par ligne dans `auth/auth-routing-lifecycle.md`. Cette page couvre la partie non traitée ailleurs : **les routes dynamiques chargées depuis Supabase** (`src/composables/useDynamicRoutes.js`), qui ont leur propre logique de normalisation de permission, distincte de celle des routes statiques.

## `src/composables/useDynamicRoutes.js` — routes chargées depuis la table `dynamic_routes`

Au premier appel de `router.beforeEach`, `addDynamicRoutesToRouter(router)` interroge Supabase :

```js
const { data, error } = await supabase
  .from('dynamic_routes')
  .select('*')
  .eq('is_active', true)
  .order('menu_order', { ascending: true });
```

Si la table n'existe pas (`error.code === 'PGRST205'`), la fonction retourne silencieusement un tableau vide — dégradation propre, pas de crash sur un environnement sans cette table.

## Normalisation de `need` pour une route dynamique sans valeur explicite

```js
const meta = { requiresAuth: route.requires_auth ?? false, dynamic: true };

if (route.need !== null && route.need !== undefined) {
  meta.need = route.need;
} else {
  meta.need = meta.requiresAuth ? DEFAULT_NEED_AUTHENTICATED : DEFAULT_NEED_PUBLIC;
}
```

Comportement corrigé le 2026-07-14 pour refléter la même logique que la normalisation des routes statiques (`auth/auth-routing-lifecycle.md`) : une route dynamique avec `requires_auth = true` mais sans `need` explicite reçoit désormais `need: 'authenticated'`, pas `'public'`. Avant ce correctif, les deux branches du ternaire renvoyaient la même valeur par erreur de nommage de constante — toute route ajoutée uniquement via `dynamic_routes` sans `need` renseigné aurait hérité d'un accès public quel que soit `requires_auth`. Le correctif ne change rien pour les routes qui définissent déjà `need` explicitement en base, ni pour les chemins qui existent aussi comme route statique (le mécanisme de dédoublonnage ci-dessous les protégeait déjà).

## Dédoublonnage : une route dynamique n'écrase jamais un chemin statique existant

```js
const pathAlreadyExists = router.getRoutes().some(r => r.path === route.path);
if (pathAlreadyExists) {
  debugDynRoutes('ignoree (path deja present):', route.path);
  return;
}
```

Toute route déjà déclarée dans `src/router/routes/*.js` (routes statiques) prime sur son équivalent dynamique — utile à savoir en administration : modifier `need` sur une ligne `dynamic_routes` dont le chemin existe déjà statiquement n'a **aucun effet observable**, c'est la version statique qui reste active.

## Garde-fou existant : `protectedRoutes` (noms de route jamais surchargés dynamiquement)

```js
const protectedRoutes = [
  'AdminDashboardGeneral', 'DashboardRM', 'DashboardEnseignant', 'AdminDashboardPFP',
  'AdminDashboardAcademique', 'AdminDashboardGamification', 'AlertsDashboard',
  'AdminSettingsView', 'SupabaseDiagnosticView', 'AdminDefisView', 'RBACAdmin',
  'DynamicRoutesEditor', 'VotationView', 'VotationViewPFP1B', 'Ventriglisse3D'
];

dynamicRoutes.forEach((route) => {
  if (protectedRoutes.includes(route.name)) return;   // ignorée même si présente dans dynamic_routes
  ...
});
```

Cette liste empêche qu'une ligne de `dynamic_routes` portant l'un de ces **noms** (pas chemins) écrase ou redéfinisse ces routes sensibles, indépendamment de la valeur de `need` posée en base.

## Résolution de composant : n'importe quel fichier de `views/` ou `components/` peut devenir une route

```js
const viewModules = {
  ...import.meta.glob('@/views/**/*.vue'),
  ...import.meta.glob('@/components/**/*.vue')
};
```

`component_path` en base est résolu vers un de ces modules, avec une table `LEGACY_COMPONENT_ALIASES` pour 5 renommages historiques connus, et un fallback insensible à la casse. Si le chemin ne correspond à aucun module (fichier renommé/supprimé sans mise à jour de la ligne en base), la route est silencieusement ignorée (`debugDynRoutes`, visible seulement avec `VITE_DEBUG_DYNAMIC_ROUTES=true`) — pas d'erreur visible en production.

## Métadonnées de route — tableau complet

| Meta | Portée | Défaut si absent |
| --- | --- | --- |
| `requiresAuth` | statique + dynamique | `false` |
| `need` | statique + dynamique | `'authenticated'` si `requiresAuth`, sinon `'public'` (les deux mécanismes sont désormais alignés) |
| `requiredRole` | statique legacy uniquement (2 routes) | absent |
| `requiresModuleOwnership` | ponctuel, non détaillé ici | absent |
| `dynamic` | posé automatiquement à `true` sur toute route chargée depuis `dynamic_routes` | absent sur les routes statiques |

## Réflexe avant d'ajouter une route via `DynamicRoutesEditorView`

1. Renseigner `need` explicitement en base plutôt que de compter sur le défaut, par lisibilité.
2. Vérifier qu'elle n'entre pas en collision de chemin avec une route statique existante (sinon la version statique gagne silencieusement).
3. Pour une route véritablement critique, continuer de préférer une déclaration statique dans `src/router/routes/*.js`, plus visible en revue de code qu'une ligne de configuration en base.
