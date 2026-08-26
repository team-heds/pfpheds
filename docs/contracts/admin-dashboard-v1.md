# Contrat des statistiques admin — v1

Endpoint : `GET /api/admin-dashboard/v1/stats`  
Authentification : `Authorization: Bearer <JWT Supabase>`

Paramètres optionnels :

- `domains=general,pfp,academic,gamification`
- `period=day|week|month|quarter|year` (défaut : `month`)
- `reference=<date ISO>` (défaut : instant courant ; `YYYY-MM-DD` désigne minuit à Zurich, un horodatage doit contenir `Z` ou un décalage explicite)

## Garanties

- L'identité et les permissions proviennent exclusivement du JWT Supabase et de l'autorisation chargée côté serveur.
- La réponse ne contient aucune ligne nominative, adresse email ou identifiant utilisateur.
- Une erreur de lecture n'est jamais convertie en zéro.
- Les valeurs `ok` proviennent des tables indiquées dans `source`.
- Les périodes sont calendaires en `Europe/Zurich`, avec des bornes semi-ouvertes `[start, end)` exposées en UTC.
- La semaine commence le lundi. Les périodes précédentes sont calendaires et tiennent compte des changements d'heure.
- Une comparaison n'est fournie que si la source permet de recalculer honnêtement la même métrique sur la période précédente.
- Un KPI sans journal historique conserve sa valeur actuelle, mais sa comparaison est explicitement `unavailable`.
- Une réponse partielle utilise HTTP `206` et marque chaque métrique ou comparaison en erreur individuellement.

## Autorisations

| Domaine | Accès |
|---|---|
| `general` | administrateurs uniquement |
| `pfp` | administrateurs, enseignants/RM physio, répondants HES, permission `students.read` |
| `academic` | administrateurs, enseignants/RM physio ou soins, répondants HES |
| `gamification` | administrateurs uniquement |

Une demande explicite d'un domaine interdit retourne `403`. Sans paramètre, seuls les domaines autorisés sont retournés.

## Exemple d'enveloppe

```json
{
  "version": "1",
  "asOf": "2026-08-26T08:00:00.000Z",
  "period": {
    "key": "month",
    "start": "2026-07-31T22:00:00.000Z",
    "end": "2026-08-31T22:00:00.000Z",
    "timezone": "Europe/Zurich"
  },
  "previousPeriod": {
    "key": "month",
    "start": "2026-06-30T22:00:00.000Z",
    "end": "2026-07-31T22:00:00.000Z",
    "timezone": "Europe/Zurich"
  },
  "domains": {
    "general": {
      "status": "ok",
      "metrics": {
        "users": {
          "value": 20,
          "status": "ok",
          "source": "public.user_profiles",
          "asOf": "2026-08-26T08:00:00.000Z",
          "period": {
            "key": "month",
            "start": "2026-07-31T22:00:00.000Z",
            "end": "2026-08-31T22:00:00.000Z",
            "timezone": "Europe/Zurich"
          },
          "semantics": "flow",
          "comparison": {
            "value": 17,
            "status": "ok",
            "absoluteChange": 3,
            "percentChange": 17.6,
            "period": {
              "key": "month",
              "start": "2026-06-30T22:00:00.000Z",
              "end": "2026-07-31T22:00:00.000Z",
              "timezone": "Europe/Zurich"
            },
            "error": null
          },
          "error": null
        }
      }
    }
  }
}
```

## Sémantiques

- `flow` : événements créés ou assignés dans la période ; une comparaison réelle est calculée.
- `snapshot` : état actuel sans historique fiable ; la valeur est réelle, la comparaison est indisponible.
- `cumulative` : compteur courant sans journal d'événements permettant de reconstruire la période précédente.

Une comparaison disponible contient la valeur précédente, l'écart absolu et l'écart en pourcentage. Lorsque la valeur précédente vaut zéro, `percentChange` vaut `null`. Une comparaison indisponible ou en erreur ne contient aucune valeur numérique.

## Définitions v1

| Domaine | Clé | Définition sur la période | Source temporelle | Sémantique |
|---|---|---|---|---|
| Général | `users` | profils actifs créés | `user_profiles.created_at` | `flow` |
| Général | `roles` | rôles actuellement configurés | aucune date de création | `snapshot` |
| Général | `permissions` | permissions actuellement configurées | aucune date de création | `snapshot` |
| Général | `routes` | routes actives créées | `dynamic_routes.created_at` | `flow` |
| PFP | `students` | profils actifs créés et classifiés étudiants par l'audience serveur canonique | `user_profiles.created_at` | `flow` |
| PFP | `institutions` | institutions actuellement configurées | `institutions` ne possède que `UpdatedAt` | `snapshot` |
| PFP | `places` | fiches de places créées ; ce n'est pas une capacité de stage | `places.CreatedAt` | `flow` |
| PFP | `pfpInProgress` | résultats assignés/publiés dans la période, sans validation, échec ni arrêt | `student_result_vote.assigned_at` | `flow` |
| Académique | `teachers` | profils actifs créés et classifiés enseignants/RM/répondants | `user_profiles.created_at` | `flow` |
| Académique | `courses` | cours créés | `courses.created_at` | `flow` |
| Académique | `media` | vidéos publiées | `video_library.published_date` | `flow` |
| Académique | `modules` | modules créés | `modules.created_at` | `flow` |
| Gamification | `activeChallenges` | défis encore actifs créés | `challenges.created_at` | `flow` |
| Gamification | `completedQuests` | somme actuelle non négative de `completion_count` | aucun événement de complétion | `cumulative` |
| Gamification | `badges` | badges actifs créés | `badges.created_at` | `flow` |
| Gamification | `activeUsers` | profils de gamification créés avec XP positif | `gamification_data.created_at` | `flow` |

## États et erreurs

- `ok` : valeur réelle disponible.
- `unavailable` : la définition ne peut pas être calculée sans ambiguïté.
- `error` : la source attendue n'a pas pu être interrogée.
- `partial` : au moins une métrique ou comparaison est disponible et une autre est en erreur.

Les messages SQL ne sont jamais renvoyés au navigateur. Le champ `error` contient uniquement un code borné permettant le diagnostic serveur.

## Budget initial

Les métriques `flow` effectuent un comptage pour la période courante et un pour la précédente. Les quatre métriques sans historique effectuent une seule lecture, soit au maximum 28 lectures pour les quatre domaines, exécutées en parallèle. HEDS25-593 ajoutera le partage de cache et évitera les anciens chargements concurrents du frontend.
