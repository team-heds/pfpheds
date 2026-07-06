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
