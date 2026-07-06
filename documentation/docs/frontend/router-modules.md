---
title: Modules de routes et organisation du router
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Navigation</div>
    <h2 class="docs-section-head__title">Comment les routes sont découpées dans le projet</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page documente l'organisation réelle de `src/router/routes/` et la logique de composition du routeur.
  </p>
</div>

## Point d'entrée

Le routeur agrège les modules suivants depuis `src/router/routes/index.js` :

- `auth.js`
- `pages.js`
- `calendar.js`
- `media.js`
- `profiles.js`
- `admin.js`
- `pfp.js`
- `social.js`
- `users.js`
- `votations.js`
- `apps.js`

Le tableau final est injecté dans `createRouter()` depuis `src/router.js`.

## Rôle de chaque module

| Module | Rôle principal |
| --- | --- |
| `auth.js` | login, register, reset password, pages d'accès |
| `admin.js` | dashboard, sécurité, planning, outils admin, gamification admin |
| `pfp.js` | formation pratique, votations PFP, secrétariat, validation |
| `social.js` | feed, hashtags, communautés |
| `users.js` | listes utilisateurs, formulaires, détails institutions et profils |
| `apps.js` | applications intégrées, outils, mobile, capsules |

## `auth.js`

Contient notamment :

- `/`
- `/home`
- `/register`
- `/reset-password`
- `/verification`
- `/access`
- `/auth-error`

Ces routes servent de sas d'entrée et de gestion des erreurs d'authentification.

## `admin.js`

C'est un des modules les plus denses. Il couvre :

- dashboard principal et dashboards spécialisés ;
- sécurité et RBAC ;
- dashboards soins infirmiers ;
- outils académiques ;
- planning ;
- lists admin ;
- gamification admin ;
- route editor dynamique.

Exemples de routes importantes :

- `/admin`
- `/admin/supabase-diagnostic`
- `/admin/security/rbac`
- `/admin/planning/*`
- `/admin/gamification/*`

## `pfp.js`

Module très critique. Il porte :

- les anciennes routes historiques PFP ;
- les alias propres sous `/admin/formation-pratique/*` ;
- les vues secrétariat ;
- les campagnes de votation ;
- l'affectation et la validation.

Particularité importante :

- beaucoup de routes dépendent encore de `page1.access`.

## `social.js`

Routes sociales principales :

- `/feed`
- `/mention/:group`
- `/hashtag/:hashtag`
- `/communities`
- `/communities/:id`

Ces vues sont connectées aux stores sociaux et aux endpoints backend dédiés.

## `users.js`

Porte un mélange de :

- listes admin ;
- formulaires historiques ;
- pages de détail ;
- vues institutions.

Ce module est fonctionnel mais un peu hétérogène dans sa responsabilité.

## `apps.js`

Regroupe :

- chat
- mail
- notes
- files
- events
- tools
- rom-runner
- chatbot
- capsules insuffisance rénale
- routes mobiles spécifiques

Il contient aussi le catch-all `/:pathMatch(.*)*`.

## Conventions d'accès observées

Les modules utilisent principalement :

- `requiresAuth`
- `meta.need`
- plus rarement `requiredRole`

Le router normalise ensuite ces métadonnées dans `src/router.js`.

## Réflexes de reprise

Quand une route pose problème :

1. identifier son module source ;
2. vérifier son `meta.need` ;
3. vérifier son éventuel `requiredRole` ;
4. vérifier si elle est concernée par les routes dynamiques ;
5. vérifier ensuite la vue, le store et le service associés.
