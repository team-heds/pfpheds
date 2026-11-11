---
title: Gamification Supabase et services d'engagement
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Engagement</div>
    <h2 class="docs-section-head__title">Comment la gamification lit ses données et structure ses maisons</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page documente le service Supabase de gamification, qui sert de base à l'affichage des maisons et d'une partie des stats utilisateur.
  </p>
</div>

## `gamificationServiceSupabase.js`

Rôle observé :

- lire les données de gamification utilisateur ;
- reconstituer les informations maison ;
- calculer le niveau et l'XP vers le niveau suivant ;
- mettre en cache localement certaines réponses.

## Tables observées

- `gamification_data`
- `houses`

## Ce que le service recompose

Pour un utilisateur, le service expose un objet enrichi :

- maison ;
- niveau ;
- XP totale ;
- XP restante ;
- house info ;
- badges / quêtes / challenges simplifiés côté lecture.

## Logique notable

- cache local 5 minutes ;
- calcul du niveau dérivé depuis l'XP ;
- mapping maison par `house_id` ;
- fallback propre si aucune donnée n'existe.

## Série de connexions

Migration `20261111100000_gamification_login_streak.sql`.

- La série (jours de connexion consécutifs, fuseau Europe/Zurich) est calculée par le serveur à partir des lignes `LOGIN` de `xp_history` ; un jour manqué la remet à zéro.
- Paliers : 7 jours = +20 XP, 30 jours = +100 XP, 100 jours = +300 XP, avec un badge par palier (« Flamme de 7 / 30 / 100 jours »). Un palier est payé une fois par année académique (1er septembre – 31 août) ; le suivi est dans `gamification_private.login_streak_milestones`.
- Le bonus est attribué par un déclencheur différé sur `xp_history` (action `LOGIN_STREAK`, via `gamification_award_xp_internal`) : il compte pour le joueur et pour sa maison. Réservé aux joueurs (public de la gamification, hors maison `gamemaster`).
- Lecture côté client : RPC `get_my_login_streak()` → `gamificationServiceSupabase.getMyLoginStreak()`, affichée dans « Ma progression » ; mise en forme dans `src/utils/loginStreak.js`.
- Test SQL : `supabase/tests/gamification_login_streak_isolation.sql` (transaction annulée).

## Badges à seuil (total d'XP, niveau)

Migration `20261111180000_unlock_threshold_badges_on_any_award.sql`.

- `gamification_award_xp_internal`, par où passent tous les gains d'XP, vérifie les badges à seuil au moment où le total ou le niveau franchit le seuil (`gamification_private.unlock_threshold_badges`). Avant, seul le moteur d'actions (connexion, profil, publication) le faisait : un seuil franchi par un autre gain ne donnait jamais le badge.
- Seul un franchissement compte : un total déjà au-dessus du seuil n'est pas récompensé après coup.
- Test SQL : `supabase/tests/gamification_threshold_badges_isolation.sql` (transaction annulée).

## Domaine plus large

Le service ne couvre pas tout le domaine engagement.

Autres services à connaître :

- `gamificationIntegration.js`
- `gamificationService.js`
- `badgesService.js`
- `questsService.js`
- `challengesService.js`
- `hesHousesService.js`
- `adminQuestsService.js`

## Risques de maintenance

- modifier la structure d'XP sans aligner le calcul de niveau ;
- modifier `houses` sans vérifier les vues de profil ;
- oublier que le cache peut masquer temporairement un changement.
