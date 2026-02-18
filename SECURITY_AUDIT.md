# 🔒 Audit Sécurité — Plateforme HEdS

**Date:** 2026-02-11  
**Scope:** `src/` — services, stores, composables, router, configuration

---

## 🔴 Problèmes Critiques

### 1. `firebase.js` — Debug logs exposant la configuration en production

**Fichier:** `src/firebase.js` (lignes 8-69)

Le fichier contient **12 `console.log`** non protégés qui s'exécutent en production et affichent :
- Les clés API (partiellement tronquées mais toujours visibles)
- Les domaines d'authentification
- Les IDs de projet
- Les URLs de base de données

**Risque:** Un attaquant peut ouvrir la console du navigateur et voir la configuration Firebase complète.

**Correction recommandée:** Supprimer tous les `console.log` de debug ou les protéger avec `import.meta.env.DEV`.

---

### 2. `router.js` — Logs de sécurité exposés en production

**Fichier:** `src/router.js` (lignes 849-968)

Le guard de navigation contient **~15 `console.log`** non protégés qui affichent :
- L'email de l'utilisateur connecté
- Le provider d'authentification
- Les permissions et rôles de l'utilisateur
- Les résultats des vérifications d'accès

**Risque:** Fuite d'informations personnelles et de la structure de permissions dans la console du navigateur.

**Correction recommandée:** Protéger avec `import.meta.env.DEV` ou supprimer.

---

### 3. `test-env.js` — Affichage des secrets en production

**Fichier:** `src/test-env.js`

Ce fichier s'exécute automatiquement au chargement de la page (`window.addEventListener('load', ...)`) et affiche les 15 premiers caractères de chaque clé API dans la console.

**Risque:** Fuite partielle des clés API Firebase et Vimeo.

**Correction recommandée:** Supprimer ce fichier ou le conditionner à `import.meta.env.DEV`.

---

## 🟠 Problèmes Importants

### 4. `v-html` — Risque XSS potentiel

**Fichiers concernés (14 occurrences):**
- `src/components/social/library/PostItem.vue` — `v-html="post.Content"`
- `src/components/common/utils/GlobalSearch.vue` (4 occurrences)
- `src/components/admin/lists/SidebarMenuItems.vue` (2 occurrences)
- `src/components/academic/KanbanBoard.vue`, `TicketDetails.vue`, `TicketForm.vue`

**Risque:** Si `post.Content` provient d'un input utilisateur non sanitisé, un attaquant peut injecter du JavaScript malveillant.

**Correction recommandée:** Utiliser une librairie de sanitisation HTML (ex: `DOMPurify`) avant d'injecter du contenu utilisateur.

---

### 5. `vimeoService.js` — Token override via localStorage

**Fichier:** `src/service/vimeoService.js` (ligne 9)

```js
const override = window.localStorage?.getItem('VIMEO_TOKEN_OVERRIDE');
```

Permet de remplacer le token Vimeo via `localStorage`, ce qui pourrait être exploité par un script XSS.

**Correction recommandée:** Supprimer cette fonctionnalité ou la conditionner à `import.meta.env.DEV`.

---

### 6. `modulePermissionGuard.js` — Logs de sécurité non protégés

**Fichier:** `src/router/guards/modulePermissionGuard.js` (lignes 31, 76)

Contient des `console.log` qui affichent les emails des utilisateurs et les résultats des vérifications de permissions.

**Correction recommandée:** Protéger avec `import.meta.env.DEV`.

---

## 🟡 Bonnes Pratiques à Améliorer

### 7. Clés API — Correctement gérées via `.env`

✅ **Supabase** (`src/supabase.js`) : utilise `import.meta.env.VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY`  
✅ **Firebase** (`src/firebase.js`) : utilise `import.meta.env.VITE_FIREBASE_*`  
✅ **Vimeo** (`src/service/vimeoService.js`) : utilise `import.meta.env.VITE_VIMEO_ACCESS_TOKEN`  
✅ **GitHub** (`src/service/githubService.js`) : pas de token hardcodé, utilise des paramètres  
✅ **`.gitignore`** : `.env`, `.env.local`, `.env.production` sont bien ignorés  

### 8. Authentification — Bien configurée

✅ **Supabase** : PKCE flow activé (`flowType: 'pkce'`), auto-refresh des tokens  
✅ **Router guards** : Vérification auth + rôles + permissions via `meta.need`, `meta.requiresAuth`, `meta.requiredRole`  
✅ **Module guard** : Vérifie la propriété du module avant accès  

### 9. Pas de secrets hardcodés détectés

✅ Aucun JWT, token GitHub (`ghp_`), clé OpenAI (`sk-`) ou secret hardcodé trouvé dans le code source.

---

## 📋 Plan d'Action Prioritaire

| # | Action | Priorité | Effort |
|---|--------|----------|--------|
| 1 | Protéger/supprimer les `console.log` dans `firebase.js` | 🔴 Critique | 10 min |
| 2 | Protéger/supprimer les `console.log` dans `router.js` | 🔴 Critique | 15 min |
| 3 | Supprimer ou conditionner `test-env.js` | 🔴 Critique | 5 min |
| 4 | Ajouter DOMPurify pour les `v-html` avec contenu utilisateur | 🟠 Important | 30 min |
| 5 | Conditionner le token override Vimeo à DEV | 🟠 Important | 5 min |
| 6 | Protéger les logs dans `modulePermissionGuard.js` | 🟡 Moyen | 5 min |
