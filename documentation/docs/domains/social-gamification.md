---
title: Domaine métier - social, engagement et gamification
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Domaine transverse</div>
    <h2 class="docs-section-head__title">Le social et la gamification se propagent dans tout le produit</h2>
  </div>
  <p class="docs-section-head__text">
    Ce domaine ne vit pas en silo : il dépend des profils, des interactions, des services backend et de la logique d'engagement.
  </p>
</div>

<div class="docs-grid docs-grid--featured">
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">SOC</span><span class="docs-card__icon">◇</span><h3>Bloc social</h3><p>Feed, hashtags, mentions, communautés et interactions utilisateurs.</p></div>
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">GAM</span><span class="docs-card__icon">◆</span><h3>Gamification</h3><p>XP, niveaux, quêtes, défis, badges et maisons HES.</p></div>
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">RISK</span><span class="docs-card__icon">●</span><h3>Effets de bord</h3><p>Les événements sociaux et auth peuvent impacter le scoring et les récompenses.</p></div>
</div>

## Bloc social

Le bloc social couvre :

- feed
- hashtags
- mentions
- communautés
- contenu partagé
- interactions entre profils

### Emplacements principaux

- `src/views/social/`
- `src/stores/postsStore.js`
- `src/stores/chatStore.js`
- `backend/supabase/postsBackendStore.js`
- `backend/supabase/communitiesStoreBackend.js`
- `backend/supabase/hashtagStoreBackend.js`

## Bloc gamification

La gamification couvre :

- maisons HES
- XP
- niveaux
- quêtes
- défis
- badges
- analytics

### Emplacements principaux

- `src/service/gamificationServiceSupabase.js`
- `src/service/gamificationIntegration.js`
- `src/service/challengesService.js`
- `src/service/questsService.js`
- `src/service/badgesService.js`
- `src/views/admin/gamification/`

## Caractéristique importante

Ce domaine est transverse. Une action banale, comme un login ou une complétion d'action, peut impacter la gamification.

## Risques fréquents

- sous-estimer les effets de bord d'une modification auth
- manipuler l'XP dans la vue au lieu du service
- modifier le social sans vérifier les flux backend correspondants
