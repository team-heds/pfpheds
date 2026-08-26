# Contrat des statistiques admin — v1

Endpoint : `GET /api/admin-dashboard/v1/stats`  
Authentification : `Authorization: Bearer <JWT Supabase>`  
Paramètre optionnel : `domains=general,pfp,academic,gamification`

## Garanties

- L'identité et les permissions proviennent exclusivement du JWT Supabase et de l'autorisation chargée côté serveur.
- La réponse ne contient aucune ligne nominative, adresse email ou identifiant utilisateur.
- Une erreur de lecture n'est jamais convertie en zéro.
- Les valeurs `ok` proviennent des tables indiquées dans `source`.
- La période v1 est `lifetime`. Les périodes historiques seront ajoutées par HEDS25-592 sans casser cette enveloppe.
- Une réponse partielle utilise HTTP `206` et marque chaque métrique en erreur individuellement.

## Autorisations

| Domaine | Accès |
|---|---|
| `general` | administrateurs uniquement |
| `pfp` | administrateurs, enseignants/RM physio, répondants HES, permission `students.read` |
| `academic` | administrateurs, enseignants/RM physio ou soins, répondants HES |
| `gamification` | administrateurs uniquement |

Une demande explicite d'un domaine interdit retourne `403`. Sans paramètre, seuls les domaines autorisés sont retournés.

## Enveloppe

```json
{
  "version": "1",
  "asOf": "2026-08-26T08:00:00.000Z",
  "period": {
    "key": "lifetime",
    "start": null,
    "end": null,
    "timezone": "Europe/Zurich"
  },
  "domains": {
    "general": {
      "status": "ok",
      "metrics": {
        "users": {
          "value": 251,
          "status": "ok",
          "source": "public.user_profiles",
          "asOf": "2026-08-26T08:00:00.000Z",
          "period": {
            "key": "lifetime",
            "start": null,
            "end": null,
            "timezone": "Europe/Zurich"
          },
          "error": null
        }
      }
    }
  }
}
```

## Définitions v1

| Domaine | Clé | Définition | Source |
|---|---|---|---|
| Général | `users` | profils actifs | `user_profiles.is_active = true` |
| Général | `roles` | rôles configurés | `roles` |
| Général | `permissions` | permissions configurées | `permissions` |
| Général | `routes` | routes dynamiques actives | `dynamic_routes.is_active = true` |
| PFP | `students` | profils actifs classifiés étudiants par l'audience serveur canonique | `user_profiles` |
| PFP | `institutions` | institutions configurées | `institutions` |
| PFP | `places` | fiches de places configurées ; ce n'est pas encore une capacité de stage | `places` |
| PFP | `pfpInProgress` | résultats assignés ou publiés sans validation, échec ni arrêt | `student_result_vote` |
| Académique | `teachers` | profils actifs classifiés enseignants/RM/répondants par l'audience serveur | `user_profiles` |
| Académique | `courses` | cours configurés | `courses` |
| Académique | `media` | vidéos enregistrées dans la bibliothèque partagée | `video_library` |
| Académique | `modules` | modules configurés | `modules` |
| Gamification | `activeChallenges` | défis actifs | `challenges.is_active = true` |
| Gamification | `completedQuests` | somme non négative de `completion_count` | `quests` |
| Gamification | `badges` | badges actifs | `badges.is_active = true` |
| Gamification | `activeUsers` | profils ayant un total d'XP strictement positif | `gamification_data.total_xp > 0` |

## États et erreurs

- `ok` : valeur réelle disponible.
- `unavailable` : la définition ne peut pas encore être calculée sans ambiguïté.
- `error` : la source attendue n'a pas pu être interrogée.
- `partial` : au moins une métrique du domaine est disponible et une autre ne l'est pas.

Les messages SQL ne sont jamais renvoyés au navigateur. Le champ `error` contient uniquement un code borné permettant le diagnostic serveur.

## Budget initial

Le contrat effectue au maximum une lecture ciblée par métrique demandée. Les quatre domaines complets représentent 16 lectures indépendantes, exécutées en parallèle. HEDS25-593 ajoutera le partage de cache et évitera les anciens chargements concurrents du frontend.
