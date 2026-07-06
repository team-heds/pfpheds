---
title: Tables critiques et responsabilités métier
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Données critiques</div>
    <h2 class="docs-section-head__title">Les tables qu'il faut connaître avant toute modification sensible</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page ne remplace pas le schéma complet, mais identifie les tables qui structurent réellement les flux métier du projet.
  </p>
</div>

## Auth, profils et permissions

### `user_profiles`

Rôle :

- profil enrichi utilisateur ;
- fallback de permissions ;
- rôle métier visible côté front.

Impact :

- auth ;
- permissions ;
- administration ;
- lecture des profils dans plusieurs domaines.

### `roles`

Rôle :

- catalogue des rôles du modèle RBAC.

### `permissions`

Rôle :

- catalogue des permissions attribuables.

### `role_permissions`

Rôle :

- mapping rôle → permissions.

### `user_roles`

Rôle :

- mapping utilisateur → rôles.

## Formation pratique et votation

### `StudentsPhysio`

Rôle :

- référentiel étudiant très utilisé dans les flux PFP ;
- suivi des stages validés ;
- historique et flags métier.

Champs métier fréquemment impliqués :

- `pfp_valided`
- `pfp2_data`
- `sae`
- `cas_particulier`
- `repondant_hes`

### `places`

Rôle :

- référentiel des places ;
- support des campagnes PFP ;
- capacité, critères, correspondance institutionnelle.

### `institutions`

Rôle :

- référentiel des institutions ;
- rattachement des places ;
- support des vues map et secrétariat.

### `praticiens_formateurs`

Rôle :

- référentiel praticiens ;
- rattachement métier à certaines affectations ou vues.

### `student_result_vote`

Rôle :

- table centrale des résultats d'attribution ;
- stockage des assignations, statuts et sorties algorithmiques.

Pourquoi elle est critique :

- elle relie les campagnes, les assignations, les validations et une partie du suivi.

### `votation_sessions`

Rôle :

- sessions de votation ;
- stockage de propositions PFP3/PFP4 ;
- gestion de priorités, drafts et états de campagne.

### `suivi_cas_particuliers`

Rôle :

- suivi manuel de cas spécifiques ;
- appui aux vues secrétariat et alertes.

### `recap_cpt_evaluation`

Rôle :

- agrégats / récapitulatifs CPT.

## Social et engagement

### `posts`

Rôle :

- base du feed social.

### `post_media`

Rôle :

- médias rattachés aux posts.

### `hashtags`

Rôle :

- taxonomie hashtags.

### `communities`

Rôle :

- communautés sociales.

### `user_communities`

Rôle :

- rattachement utilisateur ↔ communauté.

## Planning et exploitation

### `modules`

Rôle :

- structure pédagogique ;
- dépendances du planning et des modules.

### `calendar_cells`

Rôle :

- cellules ou granularité de planning dans certaines vues.

## Stockage et médias

### Buckets storage observés

- `institutions`
- avatars
- documents étudiants

Le repo montre aussi des migrations dédiées à l'activation des buckets storage.

## Réflexe de reprise

Avant toute modification critique :

1. identifier la table maître du flux ;
2. identifier les tables secondaires associées ;
3. vérifier les migrations récentes ;
4. vérifier les policies RLS ;
5. vérifier le ou les écrans qui lisent directement la table.
