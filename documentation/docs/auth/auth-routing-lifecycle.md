---
title: Cycle auth, rôles et routing
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Lecture ligne à ligne</div>
    <h2 class="docs-section-head__title">Ce que fait exactement `router.beforeEach`</h2>
  </div>
  <p class="docs-section-head__text">
    Le guard fait ~150 lignes et applique 7 vérifications successives dans un ordre précis. L'ordre compte : inverser deux blocs change le comportement.
  </p>
</div>

## Normalisation de `meta.need` au chargement du module

Avant même la création du router, `src/router.js` boucle sur toutes les routes importées de `src/router/routes/index.js` :

```js
const DEFAULT_NEED = 'authenticated';
routes.forEach(r => {
  if (!r.meta) r.meta = {};
  const hasNeed = !(r.meta.need === undefined || r.meta.need === null);
  const requires = !!r.meta.requiresAuth;
  if (!hasNeed) {
    r.meta.need = requires ? DEFAULT_NEED : 'public';
  }
});
```

**Effet concret** : une route qui a `meta: { requiresAuth: true }` sans `need` explicite se retrouve avec `meta.need = 'authenticated'` — donc accessible à **n'importe quel utilisateur connecté**, sans vérification de permission fine. C'est le piège n°1 en pratique : ajouter `requiresAuth: true` à une route admin sans ajouter `need: ['admin']` la rend accessible à tout compte connecté, pas seulement aux admins.

## Séquence exacte du guard (`router.beforeEach`)

```js
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const roleStore = useRoleStore();

  // 1) Routes dynamiques Supabase (une seule fois, mémoïsé par dynamicRoutesLoaded)
  if (!dynamicRoutesLoaded) {
    await addDynamicRoutesToRouter(router);
    dynamicRoutesLoaded = true;
    if (router.hasRoute(to.name) && to.name !== from.name) {
      return next({ ...to, replace: true });   // re-navigation si la route vient d'apparaître
    }
  }

  // 2) Court-circuit PKCE : laisser passer avant toute vérification d'auth
  if (to.path === '/reset-password' || to.path === '/new-password') {
    return next();
  }

  // 3) Bypass total si VITE_DISABLE_AUTH=true
  if (AUTH_BYPASS) {
    if (to.path === '/') return next('/home');
    return next();
  }

  // 4) checkAuthState() une seule fois par cycle de vie de l'app (isAuthStateChecked)
  if (!isAuthStateChecked) {
    await authStore.checkAuthState();
    isAuthStateChecked = true;
  }
  if (!roleStore.initialized) {
    await roleStore.init();
  }

  const user = authStore.user;

  // 5) Redirection spéciale pour "/"
  if (to.path === '/') {
    return user ? next('/feed') : next('/home');
  }

  // 6) Lecture de meta.need
  const need = to.meta.need;

  if (need === 'public' || need === 'anonymous' ||
      (Array.isArray(need) && (need.includes('public') || need.includes('anonymous')))) {
    return next();
  }

  if (need && !user) {
    return next('/');    // pas connecté + permission requise → retour login
  }

  if (need === 'authenticated' || (Array.isArray(need) && need.includes('authenticated'))) {
    return next();       // connecté, besoin générique → accès direct
  }

  if (need) {
    const canAccess = Array.isArray(need)
      ? (roleStore.isSuper || need.some(n => roleStore.can(n)))
      : (roleStore.isSuper || roleStore.can(need));
    if (!canAccess) return next({ path: '/access' });
  }

  // 7) meta.requiredRole (mécanisme historique, coexiste avec need)
  const requiredRoles = to.meta.requiredRole;
  if (requiredRoles && user) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequired = roleStore.isSuper || rolesArray.some(r => roleStore.can(r));
    if (!hasRequired) return next({ path: '/access' });
  }

  // 8) Bloc requiresAuth legacy : ne s'exécute vraiment que si requiredRole est posé
  //    ET que la route a matched.some(record => record.meta.requiresAuth)
  //    → sinon next() direct.
});
```

### Point critique n°1 : `isAuthStateChecked` et `dynamicRoutesLoaded` sont des variables de module, pas de state Vue

```js
let isAuthStateChecked = false;
let dynamicRoutesLoaded = false;
```

Elles vivent en dehors du guard, au niveau du module `router.js` — donc **une seule fois pour toute la durée de vie de l'onglet navigateur**, pas par navigation. Conséquence : si l'état d'auth change de façon externe (ex. session expirée pendant que l'onglet reste ouvert), le guard **ne rappelle jamais `checkAuthState()`** automatiquement à la navigation suivante — c'est `authStore.startSessionMonitoring()` (intervalle de 2 minutes, voir plus bas) qui doit détecter et corriger l'état, pas le router.

### Point critique n°2 : le bloc `requiredRole` legacy fait un **deuxième aller-retour réseau**

Après le check `meta.need` / `meta.requiredRole` (qui utilise `roleStore.perms` déjà en mémoire), il existe un second bloc, plus bas dans le fichier, qui ne s'active que pour les routes ayant `meta.requiresAuth: true` **et** un `meta.requiredRole` défini :

```js
if (to.matched.some(record => record.meta.requiresAuth)) {
  if (user) {
    if (!to.meta.requiredRole) return next();
    const userId = authStore.isFirebaseUser ? user.uid : user.id;
    const provider = authStore.authProvider;
    const roles = await rolesService.getUserRoles(userId, provider);   // ← appel réseau supplémentaire
    ...
  }
}
```

Ce bloc appelle `rolesService.getUserRoles()`, qui fait une requête Firebase RTDB **ou** Supabase selon le provider — indépendamment de `roleStore`. Sur une route qui définit à la fois `need` et `requiredRole`, l'utilisateur peut donc être validé deux fois par deux mécanismes différents, avec deux sources de données différentes (`roleStore.perms` vs `rolesService.getUserRoles()`). Voir `auth/security-services-legacy.md` pour le détail de `rolesService`.

## `authStore.checkAuthState()` : ordre de résolution exact

```js
async function checkAuthState() {
  if (AUTH_BYPASS) { /* utilisateur invité fixe */ return; }

  // 1. Firebase d'abord (attend la résolution du premier onAuthStateChanged)
  const firebaseUser = isFirebaseEnabled && auth
    ? await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => { unsubscribe(); resolve(u); });
      })
    : null;

  if (firebaseUser) {
    user.value = firebaseUser;
    authProvider.value = 'firebase';
    return;   // ← s'arrête ici, Supabase n'est même pas vérifié
  }

  // 2. Supabase seulement si Firebase n'a rien renvoyé
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    // tentative de refresh si le message contient "invalid" ou "expired"
    if (error.message?.includes('invalid') || error.message?.includes('expired')) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshData?.session) {
        user.value = refreshData.session.user;
        authProvider.value = 'supabase';
        return;
      }
      throw refreshError || new Error('Session refresh failed');
    }
    throw error;
  }
  if (data.user) {
    user.value = data.user;
    authProvider.value = 'supabase';
    // refresh préventif si le token expire dans moins de 5 minutes
    const { data: sessionData } = await supabase.auth.getSession();
    const timeUntilExpiry = sessionData.session.expires_at - Math.floor(Date.now() / 1000);
    if (timeUntilExpiry < 300) await supabase.auth.refreshSession();
  }
}
```

**Implication de debug** : si un utilisateur a *déjà eu* une session Firebase dans ce navigateur (même invalide/expirée), `onAuthStateChanged` peut retourner un utilisateur Firebase non-null, ce qui **empêche Supabase d'être même testé**. Pour diagnostiquer "je suis connecté mais je n'ai pas les bonnes permissions", vérifier en premier `authStore.authProvider` — si c'est `'firebase'` alors que l'utilisateur devrait être un compte Supabase pur, c'est la cause.

## Surveillance de session (`startSessionMonitoring`)

```js
sessionCheckInterval.value = setInterval(async () => {
  if (user.value && authProvider.value === 'supabase') {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      await checkAuthState();   // reconnexion / nettoyage
    } else {
      const timeUntilExpiry = data.session.expires_at - Math.floor(Date.now() / 1000);
      if (timeUntilExpiry < 600) await supabase.auth.refreshSession();
    }
  }
}, 120000); // toutes les 2 minutes
```

Ne surveille **que** les sessions Supabase (`authProvider.value === 'supabase'`) — une session Firebase qui expire côté serveur n'est jamais détectée proactivement par ce mécanisme ; elle sera corrigée seulement à la prochaine navigation via `router.beforeEach`, et seulement si `isAuthStateChecked` a été explicitement remis à `false` quelque part (ce qui n'arrive nulle part dans le code actuel — donc en pratique une session Firebase expirée pendant que l'onglet reste ouvert n'est jamais re-détectée automatiquement).

## Tableau récapitulatif : `need` vs `requiredRole`

| Mécanisme | Résolu par | Source de données | Coût réseau |
| --- | --- | --- | --- |
| `meta.need` | `roleStore.can()` | `roleStore.perms` (déjà en mémoire après `init()`) | Aucun (synchrone une fois `init()` fait) |
| `meta.requiredRole` (bloc guard ligne ~131) | `roleStore.can()` sur chaque rôle de la liste | `roleStore.perms` | Aucun |
| `meta.requiredRole` + `meta.requiresAuth` (bloc guard ligne ~142) | `rolesService.getUserRoles(userId, provider)` | Firebase RTDB (`Users/{id}/Roles`) ou Supabase (`user_metadata.roles` → `user_roles` → `user_profiles.role`, dans cet ordre) | 1 requête réseau par navigation |

## Réflexe de diagnostic (ordre à suivre)

1. `authStore.authProvider` — quel provider est actif ?
2. `authStore.user` — session non nulle ?
3. `roleStore.initialized` et `roleStore.perms` — permissions chargées, et lesquelles ?
4. `to.meta.need` de la route ciblée (`src/router/routes/*.js`)
5. `to.meta.requiredRole` — présent ? Si oui, `rolesService.getUserRoles()` répond quoi pour ce provider ?
6. Si tout ce qui précède est correct : vérifier la policy RLS de la table réellement interrogée par la page (`backend/supabase/rls.md`).
