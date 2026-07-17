---
title: Priorités pour le futur développement
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Backlog de reprise</div>
    <h2 class="docs-section-head__title">Ce qu'une nouvelle équipe doit traiter, et dans quel ordre</h2>
  </div>
  <p class="docs-section-head__text">
    Liste compilée à partir de constats vérifiés directement dans le code, le schéma de base de données et l'infrastructure de production — pas de suppositions. Chaque point renvoie vers la page technique qui détaille le constat.
  </p>
</div>

## P0 — Chantier fonctionnel prioritaire déjà spécifié

**Extension Soins Infirmiers + nouveaux champs profil étudiant** (permis de conduire, exclusion des stages chez l'employeur de l'étudiant) — spécification complète avec besoins, portée technique et questions ouvertes dans `domains/priorite-extension-soins-infirmiers-et-profil-etudiant.md`.

## P0 — Sécurité et infrastructure à traiter avant toute autre chose

### Sécurité : audit RLS complet requis sur les tables publiques

Au moins une table sensible a été trouvée accessible en lecture sans authentification (voir `security/supabase-rls.md` pour les tables déjà vérifiées, `backend/supabase/rls.md` pour la méthode de test). **Une nouvelle équipe doit refaire un audit RLS table par table avant la mise en production de toute évolution**, en testant systématiquement avec la clé anon (publique par construction, visible dans le bundle JS) sans session, pas seulement avec un compte admin. Le détail complet du constat de sécurité (avec preuve de reproduction) a été transmis séparément, hors dépôt public.

### Infrastructure : documenter et sécuriser l'accès de production

Le projet tourne sur un serveur unique sans CI/CD réelle, avec un accès SSH manuel depuis un poste de développeur (voir `ops/deployment.md`, `ops/vps-topology.md`). Avant toute passation :
- transmettre les accès (IP, clé SSH, secrets `.env`) via un canal sécurisé, hors dépôt Git ;
- envisager la mise en place d'une vraie CI/CD avec secrets stockés côté plateforme.

## P1 — Dette structurelle à traiter rapidement

### Quatre systèmes de permissions coexistent sans être unifiés

`user_profiles.role/permissions`, `user_track_roles`, un catalogue RBAC normalisé (`roles`/`permissions`/`role_permissions`) purement cosmétique, et un système legacy en mémoire (`rolesService.js`) — voir `auth/overview.md`. Une redéfinition complète du modèle de permissions est recommandée plutôt que d'empiler un 5e système.

### Suite de tests partiellement rouge

7 fichiers de test sur 41 échouent (54 tests sur 876), avec une cause racine identifiée : le mock du client Supabase ne couvre pas toute la surface chaînable (`.not()` notamment) — voir `testing/overview.md`. Le fichier `authStore.spec.js` échoue intégralement (24/24), à investiguer en priorité car il couvre toute l'authentification.

### Pipeline de déploiement GitHub Actions non fonctionnel

`.github/workflows/deploy-prod.yml` construit et déploie vers un serveur sans rapport avec la production réelle — voir `ops/vps-topology.md`. À supprimer ou reconstruire entièrement plutôt qu'à laisser en l'état (source de confusion pour toute nouvelle équipe qui croirait qu'un push déploie automatiquement).

### `/opt/pfpheds-backend` n'est pas un dépôt git sur le serveur

Le code backend en production est synchronisé par copie de fichiers (tar/scp), pas par `git pull` — aucune traçabilité de ce qui tourne réellement en production par rapport à l'historique Git. À corriger avant toute reprise sérieuse.

## P2 — Dette de schéma et de code à assainir

### Colonnes redondantes sur `StudentsPhysio`

`pfp2` (text), `pfp_2` (jsonb) et `pfp2_data` (jsonb) coexistent avec des rôles qui se chevauchent ; `pf1b` est une colonne distincte de `pfp1b` (probable typo jamais corrigée). Voir `data/schema-supabase.md` pour le détail complet et la liste des vérifications à faire avant de toucher à ces colonnes.

### Doublon de typo sur `institutions`

`CyberleanURL` et `CyberlearnURL` sont deux colonnes distinctes, l'une visiblement une faute de frappe de l'autre, toutes deux utilisées quelque part dans le code — à fusionner après avoir vérifié quel champ chaque écran lit réellement.

### RPC créées hors dépôt (dérive de schéma)

Plusieurs fonctions SQL utilisées en production (dont une RPC de provisioning RBAC déjà existante et sous-utilisée) n'ont aucune définition dans les migrations versionnées — voir `auth/overview.md` et `data/rpc-and-sql-surface.md`. À extraire en migrations avant que la base ne soit reconstruite depuis zéro un jour, moment où ces fonctions manqueraient silencieusement.

### Trois emplacements de migrations SQL non coordonnés

`supabase/migrations/`, `migrations/` (racine), `src/database/migrations/` — aucun n'est piloté par un outil de migration standard (pas de `supabase/config.toml`). Voir `backend/supabase/migrations.md`. À consolider en un seul système versionné avec un vrai outil de migration avant toute reprise longue durée.

## P3 — Nettoyage et documentation

### Fichiers d'infrastructure trompeurs dans le dépôt

`docker-compose.prod.yml`, `Dockerfile.frontend.prod`, `deploy/nginx.frontend.prod.conf` décrivent une architecture Nginx jamais utilisée en production réelle (c'est Caddy) — voir `ops/vps-topology.md`. À déplacer dans un dossier `archive/` explicite ou supprimer, pour ne pas induire une nouvelle équipe en erreur.

### Modules applicatifs non documentés

Un module e-learning complet ("capsules", 8 tables, 7 RPC dédiées) et un système de gamification "roue quotidienne" existent en base et en RPC mais n'ont aucune page de documentation dédiée — voir `data/rpc-and-sql-surface.md`. À documenter si ces modules sont actifs pour les utilisateurs, ou à retirer proprement si abandonnés.

### Couverture de test très partielle

Les 280 composants Vue et la quasi-totalité des 223 vues n'ont aucun test — la couverture mesurée ne porte que sur `src/stores/`, `src/service/`, `src/composables/` (voir `testing/overview.md`). Le backend Express et les policies RLS n'ont également aucun test automatisé.

## Comment lire ce backlog

Chaque priorité renvoie vers une page technique qui contient le constat vérifié (code source cité, requêtes exécutées, résultats mesurés) — pas une opinion. Avant de commencer un chantier, relire la page technique associée en entier : le "pourquoi" et les pièges connus y sont détaillés, pas seulement le symptôme.
