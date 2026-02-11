# ⚡ Audit Performance — Plateforme HEdS

**Date:** 2026-02-11  
**Scope:** `src/` — stores, services, router, Vite config

---

## 🔴 Problèmes Majeurs

### 1. `getHouseDetailedStats` — Requêtes en cascade excessives

**Fichier:** `src/service/gamificationServiceSupabase.js` (lignes ~626-707)

Cette méthode effectue potentiellement **8+ requêtes Supabase** en cascade :
- `testDataAccess()` → 2 requêtes
- `rpc('get_all_gamification_users')` → 1 requête
- Fallback `gamification_data` → 1 requête
- 4 requêtes alternatives avec différentes colonnes
- 3 requêtes de test sur d'autres tables

**Impact:** Temps de chargement très élevé pour la page de détails d'une maison.

**Correction recommandée:** Supprimer les fallbacks en cascade. Utiliser une seule requête RPC ou une seule requête directe avec gestion d'erreur propre.

---

### 2. `getGlobalStats` — 5 requêtes séquentielles non parallélisées

**Fichier:** `src/services/adminDashboardService.js` (lignes 10-95)

5 requêtes Supabase exécutées séquentiellement (`modules`, `user_track_roles` ×2, `courses`, `user_track_roles` encore).

**Impact:** Le dashboard admin met ~5× plus de temps que nécessaire.

**Correction recommandée:** Utiliser `Promise.all()` pour paralléliser les requêtes indépendantes.

---

### 3. `getUsersByRole` — Fetch toutes les lignes pour compter

**Fichier:** `src/services/adminKpiService.js` (lignes 33-58)

Récupère **tous les profils** (`select('role')`) pour compter par rôle côté client.

**Impact:** Transfert de données inutile, lent avec beaucoup d'utilisateurs.

**Correction recommandée:** Utiliser une requête RPC ou `GROUP BY` côté Supabase, ou au minimum `select('role', { count: 'exact' })` avec des filtres.

---

### 4. `getAvailableClasses` — Fetch toutes les lignes pour extraire les uniques

**Fichier:** `src/services/modulePlanningService.js` (lignes 238-253)

Récupère tous les `class_code` de `planning_time_slots` pour faire un `Set` côté client.

**Correction recommandée:** Utiliser `select('class_code').limit(1000)` avec un `DISTINCT` côté Supabase ou une RPC.

---

## 🟠 Optimisations Importantes

### 5. Vite build — `manualChunks` minimal

**Fichier:** `vite.config.js` (lignes 107-109)

Seuls `vue` et `vue-router` sont dans un chunk vendor. Les grosses dépendances (PrimeVue, Supabase, Firebase) ne sont pas séparées.

**Correction recommandée:** Ajouter des chunks pour `primevue`, `@supabase`, `firebase`, `chart.js`, etc.

---

### 6. Services sans cache

**Fichiers concernés:**
- `adminDashboardService.js` — pas de cache
- `adminKpiService.js` — pas de cache
- `academicKpiService.js` — pas de cache
- `modulePlanningService.js` — pas de cache

Seul `gamificationServiceSupabase.js` implémente un cache (Map avec TTL de 5 min).

**Correction recommandée:** Ajouter un cache simple avec TTL pour les données qui changent rarement (stats, modules, tracks).

---

### 7. `select('*')` sur des tables volumineuses

**Fichiers concernés:**
- `gamificationServiceSupabase.js` — `select('*')` sur `gamification_data` et `houses`
- `modulePlanningService.js` — `getModulePlanningByCode` utilise `select('*')`
- `adminDashboardService.js` — `getTracks` utilise `select('*')`

**Correction recommandée:** Spécifier les colonnes nécessaires pour réduire le transfert réseau.

---

## 🟢 Points Positifs

- ✅ **Lazy loading des routes** : toutes les vues utilisent `() => import(...)` dans le router
- ✅ **PrimeVue auto-import** : `unplugin-vue-components` avec `PrimeVueResolver` évite les imports manuels
- ✅ **PWA avec Workbox** : cache des ressources statiques configuré
- ✅ **Cache gamification** : `gamificationServiceSupabase` utilise un cache Map avec TTL de 5 min

---

## 📋 Plan d'Action

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Paralléliser `getGlobalStats` avec `Promise.all()` | 🔴 Élevé | 10 min |
| 2 | Améliorer les `manualChunks` dans Vite config | 🟠 Moyen | 5 min |
| 3 | Simplifier `getHouseDetailedStats` (supprimer fallbacks) | 🟠 Moyen | 15 min |
| 4 | Supprimer les `console.log` restants dans les services | 🟡 Faible | 10 min |
