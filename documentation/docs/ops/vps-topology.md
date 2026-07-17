---
title: Topologie réelle du VPS de production
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Infrastructure — vérifié en direct</div>
    <h2 class="docs-section-head__title">Ce qui tourne réellement en production, pas ce que le dépôt laisse supposer</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page a été réécrite le 2026-07-17 après connexion SSH directe au serveur de production et lecture de sa configuration réelle. La version précédente de cette page décrivait une topologie Nginx qui n'a jamais été celle utilisée en production — voir la section "Artefacts du dépôt non utilisés en production" en bas de page.
  </p>
</div>

## Résumé pour une reprise externe

**Il n'y a qu'un seul serveur de production**, un VPS Ubuntu (IP et accès SSH transmis séparément, hors dépôt public — voir l'équipe actuelle). Tout — frontend, documentation, backend Express, stack Supabase self-hosted complète — tourne dessus via Docker, derrière un reverse-proxy **Caddy** (pas Nginx). Le déploiement se fait **manuellement depuis un poste de développeur** via des scripts PowerShell + SSH, **pas** via une CI/CD automatisée.

## DNS

```
hedsvs.ch, www.hedsvs.ch, api2.hedsvs.ch, studio2.hedsvs.ch
```

Les 4 domaines/sous-domaines pointent vers **le même serveur** — le routage se fait entièrement au niveau de Caddy (voir plus bas), pas par des IP différentes.

## Conteneurs Docker réellement actifs (vérifié via `docker ps`)

| Conteneur | Rôle | Port interne |
| --- | --- | --- |
| `supabase-caddy-1` | Reverse proxy / TLS / serveur de fichiers statiques frontend | 80, 443 (exposés) |
| `pfpheds-backend` | API Express custom (routes `/api/*`) | 3000 |
| `supabase-db-1` | PostgreSQL (données Supabase) | 5432 |
| `supabase-rest-1` | PostgREST — expose `/rest/v1/*` | 3000 |
| `supabase-auth-1` | GoTrue — expose `/auth/v1/*` | 9999 |
| `supabase-storage-1` | Supabase Storage — expose `/storage/v1/*` | 5000 |
| `supabase-realtime-1` | Websockets temps réel — expose `/realtime/v1/*` | 4000 |
| `supabase-meta-1` | Métadonnées Postgres (utilisé par Studio) | 8080 |
| `supabase-studio-1` | Interface d'admin Supabase (sur `studio2.hedsvs.ch`) | 3000 |
| `push-worker` | Worker Node pour les notifications push (queue `push_outbox`) | — |

**Incident vécu le 2026-07-17** : le conteneur `supabase-rest-1` avait totalement disparu de la stack (absent même de `docker ps -a`, donc jamais démarré ou supprimé) — ce qui cassait l'intégralité de l'API REST côté frontend, avec des erreurs trompeuses affichées comme des erreurs CORS dans le navigateur (en réalité : l'hôte `rest` était injoignable par Caddy, pas un problème de configuration CORS). Résolu par `docker-compose up -d rest`. **Une entreprise reprenant ce projet doit savoir que ce type de panne silencieuse est possible** — rien ne surveille automatiquement si un service de la stack tombe.

## Emplacements sur le serveur

```
/opt/supabase/                 → docker-compose.yml de toute la stack Supabase self-hosted (db, rest, auth, storage, realtime, meta, studio, caddy, backend, push-worker)
/opt/supabase/Caddyfile        → config Caddy (via docker exec supabase-caddy-1 cat /etc/caddy/Caddyfile)
/opt/pfpheds-backend/          → code source du backend Express (PAS un dépôt git — copié manuellement, .env local avec secrets réels)
/var/www/pfpheds-frontend/     → build statique du frontend Vue (extrait par le script de déploiement, puis copié DANS le conteneur Caddy)
```

**Point important pour une reprise** : `/opt/pfpheds-backend` n'est pas un checkout git. Le code y est synchronisé par scp/tar depuis un poste de développeur (voir `ops/deployment.md`). Une entreprise externe devra soit continuer ce mode opératoire, soit le remplacer par un vrai pipeline CI/CD basé sur git (recommandé).

## Routage Caddy (Caddyfile réel, résumé)

```
hedsvs.ch, www.hedsvs.ch {
  root * /var/www/pfpheds-frontend
  file_server
  try_files {path} {path}/ /index.html      # fallback SPA Vue
}

studio2.hedsvs.ch {
  basic_auth /* { admin <hash bcrypt> }
  reverse_proxy studio:3000
}

api2.hedsvs.ch {
  # CORS géré ici, whitelist stricte des origines autorisées
  handle /api/*          { reverse_proxy backend:3000 }
  handle_path /rest/v1/*  { reverse_proxy rest:3000 }
  handle_path /auth/v1/*  { reverse_proxy auth:9999 }
  handle_path /storage/v1/* { reverse_proxy storage:5000 }
  handle_path /realtime/v1/* { reverse_proxy realtime:4000 }
  handle /* { respond "Not Found" 404 }
}
```

Whitelist CORS actuelle (codée en dur dans le Caddyfile, à mettre à jour si un nouveau domaine frontend est ajouté) :

```
^(https?://localhost(:\d+)?|https://studio2\.hedsvs\.ch|https://hedsvs\.ch|https://www\.hedsvs\.ch)$
```

**Le frontend et la documentation Docusaurus sont servis par le MÊME bloc Caddy** (`root * /var/www/pfpheds-frontend`), la doc se trouvant physiquement dans un sous-dossier `docs/` de ce même répertoire (`https://hedsvs.ch/docs/`).

## Limite connue : liens directs vers une page de doc

Le fallback SPA (`try_files {path} {path}/ /index.html`) ne tente pas `{path}.html`. Résultat : un lien partagé directement vers une page de documentation précise (ex. `https://hedsvs.ch/docs/auth/overview`, sans `.html`) retombe sur l'application Vue au lieu d'afficher la doc — seul un premier atterrissage sur `/docs/` puis une navigation interne (JS côté client) fonctionne correctement. Correctif possible : ajouter `{path}.html` à la chaîne `try_files` dans le Caddyfile.

## Artefacts du dépôt Git non utilisés en production (à ne pas suivre)

Le dépôt contient plusieurs fichiers qui **suggèrent** une architecture différente de celle réellement déployée. Une entreprise qui redéveloppe le projet doit savoir que ces fichiers sont **soit obsolètes, soit jamais mis en service** :

| Fichier | Ce qu'il suggère | Réalité |
| --- | --- | --- |
| `docker-compose.prod.yml` (racine) | Stack à 2 services : `backend` + `frontend` Nginx | Non utilisé — la vraie stack est `/opt/supabase/docker-compose.yml` sur le VPS, avec 10 services, aucun Nginx |
| `Dockerfile.frontend.prod` | Frontend servi par Nginx | Non utilisé — le frontend est un simple build statique copié dans le conteneur Caddy |
| `deploy/nginx.frontend.prod.conf` | Config Nginx pour le frontend | Non utilisé — c'est Caddy qui sert tout, avec sa propre config |
| `firebase.json` | Déploiement via Firebase Hosting | Non utilisé en production actuellement (le projet a migré vers le VPS ; Firebase reste utilisé pour Auth/RTDB/Storage legacy côté application, pas pour l'hébergement du site) |
| `.github/workflows/deploy-prod.yml` | Déploiement automatique à chaque push sur `prod` | **Cassé et sans rapport avec la production** — ce pipeline construit puis envoie par FTP vers un serveur qui n'est pas le VPS de production. Historiquement en échec pendant des mois avant d'être corrigé le 2026-07-17, mais même corrigé, il déploie vers un hébergement sans rapport avec `hedsvs.ch`. À supprimer ou reconfigurer entièrement si on veut une vraie CI/CD. |

**Recommandation forte pour la reprise** : soit nettoyer ces fichiers trompeurs du dépôt, soit les déplacer dans un dossier `archive/` clairement identifié, pour qu'une nouvelle équipe ne perde pas de temps à essayer de faire fonctionner une architecture qui n'a jamais été la vraie.

## Réflexes en cas d'incident

1. Connexion SSH au VPS (accès transmis séparément) puis `sudo docker ps -a` — vérifier que les 10 conteneurs attendus tournent (voir tableau plus haut). Un conteneur absent (pas juste "unhealthy") est le symptôme vécu le 2026-07-17.
2. `sudo docker exec supabase-caddy-1 cat /etc/caddy/Caddyfile` pour vérifier le routage actif.
3. `sudo docker logs <nom-conteneur>` pour les erreurs applicatives.
4. Si erreur "CORS" dans le navigateur : ne pas supposer que c'est vraiment un problème de CORS — vérifier d'abord que le service backend visé (`rest`, `auth`, `storage`, `backend`) répond bien (`docker ps`), car un service absent produit exactement ce symptôme trompeur dans les DevTools.
5. `cd /opt/supabase && sudo docker-compose up -d` (sans `--build`) redémarre tout service manquant sans reconstruire les images — rapide et sans risque pour un service qui a juste disparu.
