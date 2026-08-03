---
title: Authentification, rôles et permissions
---

## Résumé exécutif

L'application a **deux fournisseurs d'authentification actifs simultanément** (Firebase Auth et Supabase Auth) et **deux systèmes de contrôle d'accès parallèles et non unifiés** côté base de données (`user_profiles.role/permissions` d'un côté, `user_track_roles` de l'autre). Ce n'est pas une simplification narrative : c'est vérifiable directement dans le code, ci-dessous.

## Fichiers de référence exacts

| Rôle | Fichier |
| --- | --- |
| Client Firebase | `firebase.js` (racine) |
| Client Supabase (frontend) | `src/supabase.js` |
| Store d'authentification | `src/stores/authStore.js` |
| Store de permissions | `src/stores/role.js` |
| Service de rôles legacy | `src/service/rolesService.js` |
| Guard de navigation | `src/router.js` |
| Client Supabase admin (backend Node) | `backend/supabaseClient.js` |

## Les deux fournisseurs d'auth

### Firebase Auth (`firebase.js`)

```js
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'databaseURL']
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key])
const isFirebaseEnabled = missingKeys.length === 0
```

Si une seule variable `VITE_FIREBASE_*` manque, **tout Firebase est désactivé silencieusement** (`app = null`, `db = null`, `auth = null`, `storage = null`) — l'app continue de tourner en mode Supabase-only, avec un `console.error` seulement. Attention à ne pas confondre ce cas avec celui du 2026-07-14 (facturation Firebase suspendue) : les clés étaient présentes ce jour-là, c'est GCP qui a renvoyé `402 billing delinquent` sur les appels Storage, pas une désactivation locale de la config.

### Supabase Auth (`src/supabase.js`)

```js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
})
```

Points techniques précis :
- `flowType: 'pkce'` → le lien de reset password contient un `code` dans l'URL qui doit être échangé une seule fois. C'est pour ça que `router.js` laisse passer `/reset-password` et `/new-password` **avant** tout autre traitement (sinon le guard consomme la session et le code PKCE devient invalide à l'arrivée sur la page).
- `storageKey: 'supabase.auth.token'` : la session persiste dans `localStorage` sous cette clé exacte. Un bug de session fantôme après changement de compte se diagnostique en inspectant `localStorage.getItem('supabase.auth.token')` dans les devtools.
- Le fichier normalise `VITE_SUPABASE_URL` si elle contient par erreur `/rest/v1` — garde-fou pour une erreur de config fréquente sur les instances self-hosted (l'URL doit être la racine, ex. `https://api2.hedsvs.ch`, pas `https://api2.hedsvs.ch/rest/v1`).

### Écran de définition du nouveau mot de passe

L'écran `/reset-password` est le point d'entrée unique du parcours Supabase de réinitialisation. `/new-password` redirige vers cette page en conservant la query string et le hash.

Comportement attendu :
- le guard router laisse passer `/reset-password` et `/new-password` sans vérifier l'authentification pour ne pas consommer le code PKCE avant le composant ;
- le composant accepte les deux formats Supabase rencontrés : `?code=...` avec `exchangeCodeForSession()` et `#access_token=...&refresh_token=...` avec `setSession()` ;
- si le lien est absent, invalide ou expiré, l'écran affiche un état dédié et permet une validation par code email via `verifyOtp({ type: 'recovery' })` ;
- les règles de complexité sont visibles avant validation et validées côté frontend dans `src/utils/passwordResetValidation.js` ;
- le mot de passe et sa confirmation doivent correspondre avant l'appel `supabase.auth.updateUser({ password })` ;
- les champs utilisent le masque PrimeVue (`toggleMask`) pour afficher ou masquer le contenu ;
- après succès, l'utilisateur revient explicitement à la connexion.

### Cette instance est self-hosted, pas Supabase Cloud

`VITE_SUPABASE_URL=https://api2.hedsvs.ch` — ce n'est **pas** un projet `*.supabase.co`. Conséquence directe : les outils MCP Supabase standards (`list_projects`, `execute_sql`, etc.) ne voient pas ce projet. Toute inspection de schéma ou toute opération admin (créer un utilisateur, lister les comptes) doit passer par :
- l'API REST directement (`fetch` vers `${SUPABASE_URL}/auth/v1/...` ou `/rest/v1/...`) avec le header `apikey`,
- ou un script Node utilisant `backend/supabaseClient.js`.

## Priorité entre les deux providers (`authStore.js`)

Le store ne fusionne pas les deux sessions — il applique une priorité stricte :

```js
supabase.auth.onAuthStateChange(async (event, newSession) => {
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || ...) && newSession) {
    if (authProvider.value !== 'firebase') {   // Firebase gagne si déjà actif
      session.value = newSession
      user.value = newSession.user
      authProvider.value = 'supabase'
    }
  }
})

onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser) {
    if (authProvider.value !== 'supabase') {   // Supabase gagne si déjà actif
      user.value = firebaseUser
      authProvider.value = 'firebase'
    }
  }
})
```

**Règle réelle observée** : le premier des deux listeners qui reçoit un événement "connecté" gagne. Firebase répond en général plus vite au premier chargement (`onAuthStateChanged` avec cache local), donc en pratique Firebase est prioritaire si l'utilisateur a une session Firebase valide, même si Supabase a aussi une session active. `authProvider.value` détermine ensuite tout le comportement en aval (quel `userId` utiliser, quel service appeler).

## Contrôle d'accès : la chaîne complète (4 niveaux)

```
Requête utilisateur
  │
  ├─ 1. Provider actif (authStore.authProvider: 'firebase' | 'supabase' | null)
  │
  ├─ 2. Guard router (src/router.js → meta.need / meta.requiredRole)
  │
  ├─ 3. roleStore.can() — lecture RPC api_my_permissions() + fallback user_profiles
  │
  └─ 4. RLS Postgres (dernier rempart, peut refuser même si 1-2-3 passent)
```

Un accès refusé peut échouer à **n'importe lequel** de ces 4 niveaux indépendamment — voir `auth/auth-routing-lifecycle.md` pour le détail exact du guard, et `backend/supabase/rls.md` pour le niveau 4.

## Découverte architecturale : deux systèmes RBAC coexistants

C'est le point le plus important à comprendre avant de toucher aux droits d'un utilisateur.

### Système A — `user_profiles.role` + `user_profiles.permissions` (dominant)

- Colonne `role` : `TEXT` unique (`admin`, `user`, `AdminSoins`, ...).
- Colonne `permissions` : tableau JSONB de chaînes (`["super.all", "admin", "AdminPhysio", ...]`).
- Lu par la RPC `api_my_permissions()` (`supabase/migrations/20260114_create_api_my_permissions.sql`), consommée par `roleStore.js`.
- Écrit par `src/views/admin/users/ManageUserRoles.vue` (UI) et par des scripts de migration ponctuels (ex. `20260422_grant_access_batch2_profiles.sql`).
- **C'est ce système qui contrôle le router (`meta.need`) et donc l'accès aux pages/menus.**

### Système B — `tracks` + `user_track_roles` (RBAC par filière, périmètre restreint)

Défini dans `src/database/migrations/004_MASTER_multi_filiere.sql` :

```sql
CREATE TYPE track_role AS ENUM (
  'SUPER_ADMIN', 'SECRETARIAT', 'RF', 'ADMIN', 'RM', 'TEACHER', 'STUDENT'
);

CREATE TABLE user_track_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES tracks(id) ON DELETE CASCADE,  -- 'SI' ou 'PHY'
  role track_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, track_id, role)
);
```

Avec les fonctions `is_super_admin()`, `is_global_admin()`, `has_track_role(track_id, role)`, `can_access_track(track_id)`, `api_my_track_roles()`.

**Ce système n'est PAS lu par `roleStore.can()`.** Vérifié dans `src/stores/role.js` : `loadPermissions()` n'appelle jamais `api_my_track_roles()` ni ne lit `user_track_roles`. Son usage réel constaté dans le code :
- il alimente une policy RLS sur la table `modules` (`src/database/migrations/005_rls_policies_modules.sql`, fonction `can_access_track`) ;
- il est éditable depuis `ManageUserRoles.vue` (fonctions `loadUserTrackRoles` / `assignTrackRole`, table `user_track_roles`) ;
- des migrations ponctuelles y écrivent en plus de `user_profiles` (ex. `20260422_grant_access_batch2_profiles.sql` insère `SUPER_ADMIN` sur `SI` et `PHY` en plus de `role='admin'`).

**Conséquence pratique** : accorder `SUPER_ADMIN` dans `user_track_roles` à quelqu'un ne lui donne **aucun accès aux pages du router** — seul `user_profiles.permissions` fait ça. À l'inverse, mettre à jour `user_profiles.permissions` ne restreint pas l'accès filière (`modules`) si `user_track_roles` n'est pas cohérent. Les deux doivent être tenus à jour ensemble pour un compte admin filière complet (voir le pattern dans `20260422_grant_access_batch2_profiles.sql`, section 2).

## Système C — `roles` / `permissions` / `role_permissions` (catalogue RBAC normalisé, purement cosmétique)

Une troisième paire de tables existe, avec un vrai schéma relationnel classique (`roles.id` ↔ `role_permissions.role_id` ↔ `permissions.slug`), gérée par un écran dédié `src/views/admin/security/RBACAdminView.vue` (route `/admin/security/rbac`, visible dans `adminMenu.js` sous "RBAC (Rôles & Permissions)").

Contenu réel constaté (échantillon lu en base le 2026-07-14) :

```json
// roles
{ "id": "41ae82fd-...", "slug": "AdminSoins", "label": "Administrateur Soins" }
{ "id": "590864b0-...", "slug": "AdminPhysio", "label": "Administrateur Physio" }
{ "id": "b8b2bb83-...", "slug": "SuperAdmin", "label": "Super Administrateur" }

// permissions
{ "slug": "page1.access", "description": "Accéder à la Page 1" }
{ "slug": "page2.access", "description": "Accéder à la Page 2" }
{ "slug": "super.all", "description": "Accès total (SuperAdmin)" }

// role_permissions
{ "role_id": "41ae82fd-...", "permission_slug": "page1.access" }
```

**Ce catalogue n'est jamais lu par `api_my_permissions()`, ni par `roleStore`, ni par aucune policy RLS trouvée dans le dépôt.** `user_profiles.role` est une colonne `TEXT` libre, sans contrainte `FOREIGN KEY` vers `roles.id` ni `roles.slug` — rien n'empêche qu'elle contienne une valeur absente de ce catalogue. Le seul autre point de lecture trouvé est `src/service/adminKpiService.js` (`getTotalRoles()`, `getActivePermissions()`), qui fait un simple `COUNT(*)` pour un widget KPI du dashboard admin. **Ce système ne fait rien d'autre qu'afficher des chiffres et permettre une UI de CRUD sur un catalogue descriptif — il n'a aucun effet sur les droits réels d'un utilisateur.**

### Vue d'ensemble des 3 systèmes de contrôle d'accès effectifs + 1 catalogue cosmétique

| # | Stockage | Consommé par | Effet réel sur l'accès |
| --- | --- | --- | --- |
| A | `user_profiles.role` + `.permissions` (JSONB) | `api_my_permissions()` → `roleStore.can()` → guard router | **Oui — c'est le système qui compte** |
| B | `tracks` + `user_track_roles` | `can_access_track()` / `is_super_admin()` dans une policy RLS sur `modules` uniquement | Oui, mais périmètre limité à une seule table |
| C | `roles` + `permissions` + `role_permissions` | `RBACAdminView.vue` (CRUD), `adminKpiService.js` (comptage) | **Non — catalogue descriptif seulement** |
| — | `rolesService.ROLE_PERMISSIONS` (constantes JS) | 2 routes legacy via `meta.requiredRole` | Oui, mais périmètre résiduel (voir `auth/security-services-legacy.md`) |

## Anomalie connue : `update_user_permissions` sans migration

`ManageUserRoles.vue` appelle `supabase.rpc('update_user_permissions', { target_user_id, new_permissions })`, et cette RPC **répond correctement en production** (testé le 2026-07-14 lors d'un provisioning de compte admin). Pourtant, **aucun fichier `.sql` du dépôt** (`supabase/migrations/`, `migrations/`, `src/database/migrations/`) ne contient `CREATE FUNCTION update_user_permissions` ni `get_user_permissions`. Ces fonctions existent uniquement dans la base live, créées hors dépôt (SQL Editor Supabase Studio ou intervention manuelle). C'est un vrai risque de dérive de schéma : si la base est un jour recréée depuis les migrations versionnées, ces RPC manqueront silencieusement et `ManageUserRoles.vue` échouera à jour les permissions (le code gère l'échec avec un simple `console.warn`, sans bloquer l'écriture sur `user_profiles`).

## Recommandations de maintenance

1. Toute nouvelle route sensible doit définir `meta.need` explicitement (voir `auth/auth-routing-lifecycle.md`).
2. Toute création/modification de compte admin doit mettre à jour **les deux systèmes** si l'utilisateur touche à une filière SI/PHY : `user_profiles.permissions` ET `user_track_roles`.
3. Extraire `update_user_permissions` et `get_user_permissions` de la base live vers une migration versionnée dès que possible (dette technique documentée ci-dessus).
4. Ne jamais présumer qu'un blocage d'accès vient du front : toujours vérifier RLS en dernier (`backend/supabase/rls.md`).
