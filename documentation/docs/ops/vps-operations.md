---
title: Exploitation VPS et opérations
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Opérations — vérifié en direct</div>
    <h2 class="docs-section-head__title">Commandes réelles pour opérer le VPS de production</h2>
  </div>
  <p class="docs-section-head__text">
    Toutes les commandes de cette page ont été exécutées et vérifiées sur le VPS de production le 2026-07-17. Voir `ops/vps-topology.md` pour l'architecture, `ops/deployment.md` pour la procédure de déploiement.
  </p>
</div>

## Connexion

```bash
ssh -i "<chemin-vers-votre-clé-privée>" ubuntu@<ip-du-vps>
```

IP et clé transmises séparément par l'équipe actuelle, hors dépôt.

## Vérifier l'état de la stack

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

10 conteneurs attendus (voir liste complète dans `ops/vps-topology.md`) : `supabase-caddy-1`, `pfpheds-backend`, `supabase-db-1`, `supabase-rest-1`, `supabase-auth-1`, `supabase-storage-1`, `supabase-realtime-1`, `supabase-meta-1`, `supabase-studio-1`, `push-worker`.

**`supabase-realtime-1` et `supabase-studio-1` tournent en état `(unhealthy)` en fonctionnement normal** — vérifié le 2026-07-17, ce n'est pas nécessairement un incident (leur healthcheck interne semble mal calibré), mais à surveiller si les fonctionnalités temps réel ou l'accès Studio posent problème.

## Démarrer un service manquant (sans rebuild)

```bash
cd /opt/supabase
sudo docker-compose up -d <nom-du-service>   # ex: rest, auth, storage...
```

**Utiliser `docker-compose` (avec tiret, binaire standalone), pas `docker compose` (plugin v2) sous `sudo`** — vérifié le 2026-07-17 : le plugin `docker compose` n'est installé que dans le profil CLI de l'utilisateur `ubuntu`, pas dans celui de `root`, donc `sudo docker compose ...` échoue avec `docker: 'compose' is not a docker command` alors que `sudo docker-compose ...` fonctionne.

## Rebuild complet (backend + push-worker) et vérification de toute la stack

```bash
cd /opt/supabase
sudo docker-compose up -d --build
```

C'est ce que fait automatiquement `deploy-hedsvs.ps1` à chaque déploiement (voir `ops/deployment.md`) — safe à relancer manuellement à tout moment, ne redémarre que ce qui a changé ou ce qui manque.

## Logs

```bash
sudo docker logs supabase-caddy-1       # reverse proxy / erreurs de routage
sudo docker logs pfpheds-backend        # API Express custom
sudo docker logs supabase-rest-1        # PostgREST
sudo docker logs supabase-auth-1        # GoTrue (authentification)
sudo docker logs supabase-db-1          # PostgreSQL
```

## Config Caddy active

```bash
sudo docker exec supabase-caddy-1 cat /etc/caddy/Caddyfile
```

## Recharger Caddy après une modification de config

```bash
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile
```

## Contrôles post-déploiement (commandes réelles, pas des endpoints supposés)

```bash
curl -I https://hedsvs.ch/
curl -I https://hedsvs.ch/docs/
curl -H "Origin: https://hedsvs.ch" -I "https://api2.hedsvs.ch/rest/v1/institutions?select=InstitutionId&limit=1"
```

Il n'existe **pas** d'endpoint `/health` ou `/api/ping` standardisé exposé publiquement — ne pas s'y fier pour un healthcheck externe. Le seul vrai signal de bonne santé est une réponse 200 sur une requête REST réelle avec le bon header CORS.

## Symptômes courants et vraies causes (vécues, pas supposées)

### "Erreur CORS" dans la console navigateur sur `api2.hedsvs.ch`

**Ne pas modifier la configuration CORS en premier réflexe.** Vérifier d'abord `docker ps` — un service backend absent (comme `rest` le 2026-07-17) produit exactement ce symptôme, car la requête échoue avant que Caddy n'ait l'occasion d'appliquer les en-têtes CORS. Le vrai fix dans ce cas : redémarrer le service manquant, pas toucher au Caddyfile.

### `/docs/` accessible mais un lien direct vers une page précise ne fonctionne pas

Comportement connu du fallback SPA de Caddy (`try_files` ne tente pas `{path}.html`) — voir `ops/vps-topology.md`. Pas un incident, une limitation de config connue.

### Le build local échoue avec une erreur de fichier verrouillé sur `.docusaurus/*.mjs`

Spécifique à Windows — un process précédent garde un handle sur le cache Docusaurus. `deploy-hedsvs.ps1` nettoie ce cache automatiquement avant chaque build depuis le 2026-07-17 ; si l'erreur persiste, supprimer manuellement `documentation/.docusaurus` et `documentation/build` avant de relancer.

## Espace disque

Le script de déploiement fait un nettoyage agressif automatique (suppression des anciennes archives, des anciens backups de `dist/`, `docker system prune`) si l'espace libre descend sous 2 Go. À surveiller manuellement :

```bash
df -h /
sudo docker system df
```

## Checklist de redéploiement complet

1. `.\deploy-hedsvs.ps1` depuis un poste avec accès SSH configuré.
2. Vérifier la sortie du script — chaque étape doit se terminer par `[SUCCESS]`.
3. `curl -I https://hedsvs.ch/` et `curl -I https://hedsvs.ch/docs/` → `200 OK`.
4. Tester une vraie route API avec l'en-tête `Origin` (voir plus haut) → `200 OK` + header CORS présent.
5. `sudo docker ps` sur le VPS → 10 conteneurs `Up`, aucun manquant.
