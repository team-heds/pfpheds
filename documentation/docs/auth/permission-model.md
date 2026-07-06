---
title: Modèle de permissions et matrice d'accès
---

## Niveaux du modèle

Le contrôle d'accès se fait par superposition :

1. provider d'auth
2. session utilisateur
3. route front
4. permission chargée par `roleStore`
5. enforcement base via RLS

## Sources de permission

### Source principale

- RPC Supabase `api_my_permissions`

### Fallback

- lecture de `user_profiles.role`
- lecture de `user_profiles.permissions`

### Héritage legacy

- `requiredRole`
- rôles Firebase historiques
- `rolesService.js`

## Clés d'accès visibles dans le code

| Type | Exemples |
| --- | --- |
| Spéciales | `public`, `anonymous`, `authenticated` |
| Super permission | `super.all` |
| Admin | `admin`, `AdminPhysio` |
| Académique / soins | `RMSoins`, `EnseignantSoins`, `PlanificateurHoraires` |
| Formation pratique | `page1.access` |
| Édition | `editor` |

## Matrice de lecture

| Cas | Session requise | Permission front | RLS à vérifier |
| --- | --- | --- | --- |
| Page publique | non | `public` ou `anonymous` | rarement |
| Page connectée standard | oui | `authenticated` | oui selon données |
| Page admin | oui | `admin` ou équivalent | oui |
| Page PFP historique | oui | souvent `page1.access` | oui |
| Action critique backend | oui | front + backend | oui ou service key |

## Cas particulier `super.all`

`roleStore.isSuper` court-circuite une partie des contrôles front. Cela ne dispense pas de penser la sécurité côté base et côté backend.

## Point faible structurel à connaître

Le modèle n'est pas entièrement uniformisé :

- une partie des routes utilise `need`
- une partie conserve `requiredRole`
- une partie de la logique métier garde des conventions legacy

Donc toute évolution permissionnelle doit être testée de bout en bout.

## Recommandation de convergence

Pour les futures évolutions :

- privilégier `meta.need`
- centraliser la logique de lecture dans `roleStore.can()`
- documenter toute nouvelle permission métier
- limiter le recours aux conventions implicites
