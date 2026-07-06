---
title: Runbook de maintenance et diagnostic
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Exploitation</div>
    <h2 class="docs-section-head__title">Les vérifications minimales à faire en incident</h2>
  </div>
  <p class="docs-section-head__text">
    Ce runbook sert de base courte pour valider l'état de la plateforme avant d'aller plus loin dans l'analyse.
  </p>
</div>

<div class="feature-strip">
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Vérifier les endpoints</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Valider l'auth et les accès</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Contrôler la source de données</span></div>
  <div class="feature-strip__item"><span class="feature-strip__icon">◆</span><span>Qualifier l'impact utilisateur</span></div>
</div>

## Endpoints utiles

- `/health`
- `/api/ping`
- `/api/ftp/diagnostic`

## Contrôles rapides

1. vérifier que l'application répond encore ;
2. vérifier que les endpoints de base retournent bien un statut attendu ;
3. confirmer si le problème touche le frontend, le backend ou la donnée ;
4. vérifier si l'incident est global ou limité à un domaine métier.
