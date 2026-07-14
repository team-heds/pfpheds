---
title: Route guards
---

Le guard statique (`router.beforeEach`) est détaillé ligne par ligne dans `auth/auth-routing-lifecycle.md`. Cette page couvre la partie non traitée ailleurs : **les routes dynamiques chargées depuis Supabase**, qui ont leur propre logique de normalisation de permission — différente de celle des routes statiques, et actuellement porteuse d'un bug latent.

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

## Bug vérifié : `need` par défaut devient toujours `'public'`, même pour une route protégée

```js
const DEFAULT_NEED = 'public';   // ← unique valeur, utilisée dans les deux branches ci-dessous

const meta = { requiresAuth: route.requires_auth ?? false, dynamic: true };

if (route.need !== null && route.need !== undefined) {
  meta.need = route.need;
} else {
  meta.need = meta.requiresAuth ? DEFAULT_NEED : 'public';   // ⚠️ les deux branches valent 'public'
}
```

Comme `DEFAULT_NEED` vaut littéralement `'public'`, le `? DEFAULT_NEED : 'public'` est un branchement sans effet : **qu'une route dynamique ait `requires_auth: true` ou `false`, si sa colonne `need` est vide, elle reçoit `meta.need = 'public'`** — et `need === 'public'` déclenche un `return next()` immédiat dans le guard (`router.js`), avant même la vérification de session. C'est l'inverse de la normalisation des routes statiques (`DEFAULT_NEED = 'authenticated'` dans `router.js`, voir `auth/auth-routing-lifecycle.md`) — les deux fichiers utilisent le même nom de constante (`DEFAULT_NEED`) pour des valeurs opposées.

### Vérifié en base le 2026-07-14 : 6 lignes actives concernées

```
FeedView           /feed                  requires_auth: true, need: null
VotationView       /votation              requires_auth: true, need: null
InstitutionView    /institution/:id       requires_auth: true, need: null
InstitutionDetails /institution_details/:id  requires_auth: true, need: null
DocumentsPFP       /documents_pfp         requires_auth: true, need: null
+ 1 autre route
```

### Pourquoi ça ne casse rien aujourd'hui

`addDynamicRoutesToRouter` vérifie avant d'ajouter chaque route dynamique :

```js
const pathAlreadyExists = router.getRoutes().some(r => r.path === route.path);
if (pathAlreadyExists) {
  debugDynRoutes('ignoree (path deja present):', route.path);
  return;
}
```

Les 6 chemins concernés (`/feed`, `/votation`, `/institution/:id`, `/institution_details/:id`, `/documents_pfp`, ...) **existent déjà comme routes statiques** dans `src/router/routes/social.js`, `votations.js`, `users.js` — avec `requiresAuth: true` et sans `need`, donc normalisées côté statique à `need: 'authenticated'` (comportement correct). Comme la route statique est enregistrée en premier, la version dynamique buggée est ignorée pour ces 6 chemins précis. **Le bug est actuellement neutralisé par coïncidence de configuration, pas corrigé.**

### Condition d'exploitation réelle

Toute nouvelle route ajoutée **exclusivement** via la table `dynamic_routes` (typiquement depuis l'écran admin `DynamicRoutesEditorView`, route `/admin/routes-editor`), avec `requires_auth = true` mais sans valeur dans la colonne `need`, sera **immédiatement accessible sans authentification**, sans qu'aucune erreur ne soit levée nulle part — le comportement est silencieux. C'est le risque concret à corriger (fixer `DEFAULT_NEED` selon `meta.requiresAuth` réellement, ex. `meta.requiresAuth ? 'authenticated' : 'public'`) avant que quelqu'un n'ajoute une route sensible depuis cet éditeur sans renseigner `need` manuellement.

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

Cette liste empêche qu'une ligne de `dynamic_routes` portant l'un de ces **noms** (pas chemins) écrase ou redéfinisse ces routes sensibles — indépendamment du bug `need` ci-dessus, ces noms précis sont protégés par exclusion explicite. Noter que `VotationView` apparaît ici en plus d'exister déjà comme route statique — double protection pour cette route spécifique.

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
| `need` | statique + dynamique | `'authenticated'` (statique) / `'public'` (dynamique — bug ci-dessus) |
| `requiredRole` | statique legacy uniquement (2 routes) | absent |
| `requiresModuleOwnership` | ponctuel, non détaillé ici | absent |
| `dynamic` | posé automatiquement à `true` sur toute route chargée depuis `dynamic_routes` | absent sur les routes statiques |

## Réflexe avant d'ajouter une route via `DynamicRoutesEditorView`

1. Toujours renseigner `need` explicitement en base — ne jamais compter sur le défaut.
2. Si la route est sensible, vérifier qu'elle n'entre pas en collision de chemin avec une route statique existante (sinon la version statique gagne silencieusement, ce qui peut aussi surprendre en sens inverse : modifier `need` en base sur une ligne `dynamic_routes` dont le chemin existe déjà statiquement n'aura **aucun effet**).
3. Pour une route véritablement critique, préférer l'ajouter en dur dans `src/router/routes/*.js` plutôt que via `dynamic_routes`, tant que le bug de normalisation n'est pas corrigé.
