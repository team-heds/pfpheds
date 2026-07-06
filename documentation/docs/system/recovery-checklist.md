---
title: Checklist de reprise technique
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Reprise projet</div>
    <h2 class="docs-section-head__title">Ce qu'une nouvelle personne doit valider en premier</h2>
  </div>
  <p class="docs-section-head__text">
    Cette checklist sert à reprendre la plateforme de façon méthodique, sans dépendre uniquement d'explications orales.
  </p>
</div>

## 1. Vérifier que le projet démarre

- installer les dépendances racine ;
- démarrer l'application avec `npm run dev` ;
- démarrer la documentation avec `npm run docs:dev` ;
- confirmer que l'app répond et que la doc s'ouvre correctement.

## 2. Vérifier les variables d'environnement

Confirmer la présence et la cohérence de :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`
- `VITE_FIREBASE_*`
- `VITE_DISABLE_AUTH`
- `VITE_DEBUG_ROUTER`

Contrôler aussi si le backend possède son propre `.env`.

## 3. Identifier le mode d'auth réel

Le projet peut fonctionner selon plusieurs cas :

- Supabase comme provider principal ;
- Firebase encore actif pour certains flux legacy ;
- bypass auth via `VITE_DISABLE_AUTH=true`.

À valider dans :

- `src/stores/authStore.js`
- `src/stores/role.js`
- `src/router.js`

## 4. Valider le cycle permissions

Points à vérifier :

- la session Supabase existe bien ;
- `roleStore.init()` est appelé ;
- la RPC `api_my_permissions` répond ;
- le fallback `user_profiles.role` / `user_profiles.permissions` fonctionne ;
- `super.all` est bien pris en compte si utilisé.

## 5. Repérer les couches actives

Le projet se lit par couches :

1. vues dans `src/views/`
2. stores dans `src/stores/`
3. services dans `src/service/`
4. backend `backend/` si nécessaire
5. source de données réelle Firebase ou Supabase

## 6. Cartographier les zones métier critiques

Priorité de lecture conseillée :

- formation pratique
- planning et soins infirmiers
- auth / permissions
- backend / routes API
- données et migrations Supabase

## 7. Vérifier les routes sensibles

Routes à auditer en premier :

- pages protégées par `meta.need`
- routes historiques avec `requiredRole`
- routes dynamiques injectées depuis Supabase
- redirections `/`, `/home`, `/feed`, `/access`

Fichiers clés :

- `src/router.js`
- `src/router/routes/index.js`
- `src/router/routes/*.js`

## 8. Vérifier le backend actif

Confirmer :

- que `backend/index.js` est la vraie entrée serveur ;
- que les endpoints critiques répondent ;
- que les routes listées dans la doc correspondent encore au code ;
- que les scripts imports / seeds ne sont pas confondus avec les routes actives.

## 9. Vérifier les données et migrations

À faire avant toute modification métier :

- lire `supabase/migrations/`
- repérer les migrations récentes touchant le domaine
- identifier si le domaine est encore partiellement en Firebase
- valider les policies RLS

## 10. Vérifier les outils de diagnostic

- `/admin/supabase-diagnostic`
- diagnostic Firebase dans l'admin
- `/health`
- `/api/ping`
- `/api/ftp/diagnostic`

## 11. Vérifier le build et la livraison

Commandes à exécuter :

```bash
npm run docs:build
npm run build
npm run build:all
```

Contrôler :

- génération de `dist/`
- génération de `documentation/build/`
- copie de la doc vers `dist/docs`

## 12. Vérifier le niveau de dette

Signaux de dette à noter immédiatement :

- mélange `need` / `requiredRole`
- coexistence Firebase / Supabase sur un même flux
- scripts de préparation de données hors UI
- copies legacy dans `backend/`
- différences entre comportement réel et documentation

## Sortie attendue

Une reprise correcte doit produire au minimum :

- une app qui démarre ;
- une doc qui build ;
- une cartographie claire des zones critiques ;
- une compréhension du couple auth + routing + permissions ;
- une liste des domaines encore legacy ou sensibles.
