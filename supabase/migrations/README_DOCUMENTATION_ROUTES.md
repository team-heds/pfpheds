# 📚 Documentation Routes System - Guide d'Utilisation

## 🎯 Vue d'Ensemble

Ce système permet de gérer dynamiquement les routes de documentation avec un contrôle d'accès basé sur les rôles dans Supabase.

---

## 🚀 Installation

### 1. Exécuter la Migration SQL

Connectez-vous à votre tableau de bord Supabase et exécutez le fichier SQL :

```bash
# Dans Supabase Dashboard > SQL Editor
# Copier/coller le contenu de : 0020_add_documentation_routes.sql
```

Ou via CLI :

```bash
supabase migration up
```

### 2. Vérifier les Tables Créées

La migration crée les éléments suivants :

- ✅ **Table** : `documentation_routes`
- ✅ **Vue** : `active_documentation_routes`
- ✅ **Fonctions** : `user_can_access_documentation_route()`, `get_user_documentation_routes()`
- ✅ **Politiques RLS** : Accès admin uniquement
- ✅ **Triggers** : Mise à jour automatique de `updated_at`

---

## 📊 Structure de la Base de Données

### Table `documentation_routes`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `route_path` | TEXT | Chemin de la route (ex: `/docs/primevue`) |
| `route_name` | TEXT | Nom pour Vue Router |
| `component_name` | TEXT | Nom du composant Vue |
| `title` | TEXT | Titre de la documentation |
| `description` | TEXT | Description détaillée |
| `icon` | TEXT | Icône PrimeIcons (ex: `pi pi-book`) |
| `category` | TEXT | Catégorie (development, api, user-help) |
| `file_path` | TEXT | Chemin du fichier de documentation |
| `is_active` | BOOLEAN | État actif/inactif |
| `required_roles` | TEXT[] | Rôles requis pour accéder |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de modification |
| `created_by` | UUID | Créateur (référence auth.users) |

---

## 🔐 Sécurité et Permissions

### Row Level Security (RLS)

Toutes les opérations sont **restreintes aux admins uniquement** :

- ✅ **SELECT** : Admins seulement
- ✅ **INSERT** : Admins seulement
- ✅ **UPDATE** : Admins seulement
- ✅ **DELETE** : Admins seulement

### Vérification d'Accès Utilisateur

La fonction `user_can_access_documentation_route()` vérifie si un utilisateur a **au moins un** des rôles requis :

```sql
SELECT public.user_can_access_documentation_route('/docs/primevue');
-- Retourne : true ou false
```

---

## 💻 Utilisation dans Vue.js

### 1. Import du Service

```javascript
import {
  getUserDocumentationRoutes,
  canAccessDocumentationRoute,
  getDocumentationRouteByPath
} from '@/service/documentationRoutesService'
```

### 2. Récupérer les Routes Accessibles

```javascript
// Dans un composant Vue
const routes = ref([])

onMounted(async () => {
  try {
    routes.value = await getUserDocumentationRoutes()
    console.log('Routes disponibles:', routes.value)
  } catch (error) {
    console.error('Erreur:', error)
  }
})
```

### 3. Vérifier l'Accès Avant Navigation

```javascript
// Guard de navigation
router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/docs/')) {
    const hasAccess = await canAccessDocumentationRoute(to.path)
    
    if (!hasAccess) {
      next('/unauthorized')
      return
    }
  }
  next()
})
```

### 4. Afficher un Menu de Documentation

```vue
<template>
  <div class="doc-menu">
    <h3>📚 Documentation</h3>
    <div v-for="route in docRoutes" :key="route.id">
      <router-link :to="route.route_path">
        <i :class="route.icon"></i>
        {{ route.title }}
      </router-link>
      <p class="description">{{ route.description }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserDocumentationRoutes } from '@/service/documentationRoutesService'

const docRoutes = ref([])

onMounted(async () => {
  docRoutes.value = await getUserDocumentationRoutes()
})
</script>
```

---

## 🛠️ Gestion des Routes (Admin)

### Créer une Nouvelle Route

```javascript
import { createDocumentationRoute } from '@/service/documentationRoutesService'

const newRoute = {
  route_path: '/docs/typescript',
  route_name: 'TypeScriptDocs',
  component_name: 'TypeScriptDocsView',
  title: 'Documentation TypeScript',
  description: 'Guide complet TypeScript pour le développement',
  icon: 'pi pi-code',
  category: 'development',
  file_path: '/docs/typescript.txt',
  required_roles: ['admin', 'developer'],
  is_active: true
}

await createDocumentationRoute(newRoute)
```

### Mettre à Jour une Route

```javascript
import { updateDocumentationRoute } from '@/service/documentationRoutesService'

await updateDocumentationRoute('route-uuid-here', {
  title: 'Nouveau titre',
  description: 'Nouvelle description',
  is_active: false
})
```

### Activer/Désactiver une Route

```javascript
import { toggleDocumentationRouteActive } from '@/service/documentationRoutesService'

// Désactiver
await toggleDocumentationRouteActive('route-uuid-here', false)

// Activer
await toggleDocumentationRouteActive('route-uuid-here', true)
```

### Supprimer une Route

```javascript
import { deleteDocumentationRoute } from '@/service/documentationRoutesService'

await deleteDocumentationRoute('route-uuid-here')
```

---

## 📈 Statistiques et Monitoring

### Récupérer les Statistiques

```javascript
import { getDocumentationRoutesStats } from '@/service/documentationRoutesService'

const stats = await getDocumentationRoutesStats()

console.log(stats)
// {
//   total: 6,
//   active: 1,
//   inactive: 5,
//   byCategory: {
//     development: { total: 4, active: 1, inactive: 3 },
//     api: { total: 1, active: 0, inactive: 1 },
//     'user-help': { total: 1, active: 0, inactive: 1 }
//   }
// }
```

---

## 🗂️ Routes Pré-configurées

La migration insère automatiquement ces routes :

### 1. **Documentation PrimeVue** ✅ ACTIVE
- **Path** : `/docs/primevue`
- **Rôles** : `admin`
- **Fichier** : `/Primevue/llms-full.txt`
- **Catégorie** : `development`

### 2. **Documentation Vue.js** ❌ INACTIVE
- **Path** : `/docs/vue`
- **Rôles** : `admin`, `developer`
- **Catégorie** : `development`

### 3. **Documentation Firebase** ❌ INACTIVE
- **Path** : `/docs/firebase`
- **Rôles** : `admin`, `developer`
- **Catégorie** : `development`

### 4. **Documentation Supabase** ❌ INACTIVE
- **Path** : `/docs/supabase`
- **Rôles** : `admin`, `developer`
- **Catégorie** : `development`

### 5. **Documentation API** ❌ INACTIVE
- **Path** : `/docs/api`
- **Rôles** : `admin`, `developer`
- **Catégorie** : `api`

### 6. **Guide Utilisateur** ❌ INACTIVE
- **Path** : `/docs/user-guide`
- **Rôles** : `admin`, `teacher`, `student`
- **Catégorie** : `user-help`

---

## 🧪 Tests et Validation

### 1. Tester la Fonction d'Accès

```sql
-- Dans Supabase SQL Editor
SELECT public.user_can_access_documentation_route(
  '/docs/primevue',
  'user-uuid-here'
);
```

### 2. Tester la Récupération des Routes Utilisateur

```sql
SELECT * FROM public.get_user_documentation_routes('user-uuid-here');
```

### 3. Vérifier les Politiques RLS

```sql
-- Se connecter en tant qu'utilisateur non-admin
-- Cette requête devrait retourner 0 lignes si l'utilisateur n'est pas admin
SELECT * FROM documentation_routes;
```

---

## 🔄 Workflow Complet

### Pour un Admin

1. **Exécuter la migration SQL**
2. **Vérifier dans Supabase Dashboard** que les tables existent
3. **Accéder à `/docs/primevue`** dans l'application
4. **Créer de nouvelles routes** via l'interface admin (à développer)
5. **Gérer les accès** en modifiant `required_roles`

### Pour un Développeur

1. **Utiliser le service** `documentationRoutesService.js`
2. **Récupérer les routes accessibles** avec `getUserDocumentationRoutes()`
3. **Afficher les routes** dans un menu ou sidebar
4. **Protéger les routes** avec les guards de navigation

### Pour un Utilisateur Final

1. **Se connecter** à l'application
2. **Voir uniquement les routes** correspondant à son rôle
3. **Accéder à la documentation** disponible
4. **Feedback** : routes non accessibles masquées automatiquement

---

## 📝 Bonnes Pratiques

### 1. Catégorisation

Utilisez des catégories cohérentes :
- `development` : Documentation technique pour développeurs
- `api` : Documentation des APIs
- `user-help` : Guides utilisateurs
- `admin` : Documentation administrative

### 2. Gestion des Rôles

Soyez **restrictif par défaut** :
- Documentation technique → `['admin', 'developer']`
- Guides utilisateurs → `['admin', 'teacher', 'student']`
- Documentation admin → `['admin']`

### 3. Activation Progressive

- Créez les routes en état **inactif** (`is_active: false`)
- Testez le contenu et les permissions
- **Activez** seulement quand tout est prêt

### 4. Chemins de Fichiers

Utilisez des chemins **relatifs à `public/`** :
- ✅ `/Primevue/llms-full.txt`
- ✅ `/docs/vue3-guide.md`
- ❌ `/Users/john/Desktop/docs.txt`

---

## 🚨 Dépannage

### Erreur : "relation does not exist"

➡️ **Solution** : Exécuter la migration SQL complète

### Erreur : "permission denied"

➡️ **Solution** : Vérifier que l'utilisateur a le rôle `admin` dans `user_roles`

### Aucune route retournée

➡️ **Solution** : Vérifier que `is_active = true` et que l'utilisateur a les rôles requis

### Routes visibles mais inaccessibles

➡️ **Solution** : Vérifier les guards de navigation dans Vue Router

---

## 📚 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vue Router Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [PrimeVue Icons](https://primevue.org/icons)

---

## ✅ Checklist de Mise en Production

- [ ] Migration SQL exécutée dans Supabase
- [ ] Tables et fonctions créées vérifiées
- [ ] Service `documentationRoutesService.js` importé
- [ ] Routes Vue.js mises à jour
- [ ] Guards de navigation configurés
- [ ] Tests d'accès effectués (admin et non-admin)
- [ ] Documentation accessible depuis l'interface
- [ ] Logs et monitoring activés

---

**🎉 Votre système de documentation est maintenant opérationnel !**
