# Production Storage: correction des suppressions — 2 novembre 2026

## Résultat vérifié

Le stockage Supabase de production permet les nouveaux téléversements, les ouvertures signées privées et les suppressions. Le contrôle final a retrouvé **12 objets existants et aucun objet `media-smoke` résiduel**. Aucun compte, profil, mot de passe ou enregistrement métier n’a été modifié pour cette recette.

La copie des anciens médias Firebase reste une opération distincte : les originaux Firebase sont encore indisponibles sans réactivation de leur facturation. Cette correction n’a pas récupéré ces originaux.

## Cause et correction

Le conteneur `supabase-storage-1` utilise `supabase/storage-api:v1.11.1` avec le backend fichier `/var/lib/storage`, monté depuis `/opt/supabase/storage`. Les variables `STORAGE_S3_BUCKET` et `GLOBAL_S3_BUCKET` étaient absentes.

Cette version interpolait cette valeur manquante dans les chemins d’upload et de lecture : les fichiers existants étaient donc rangés sous `/var/lib/storage/undefined/storage-single-tenant`. En revanche, la suppression appelait `path.resolve(..., bucket, ...)` avec la valeur JavaScript `undefined`, ce qui provoquait une erreur HTTP 500 et `ERR_INVALID_ARG_TYPE`.

La configuration durable `/opt/supabase/docker-compose.yml` contient désormais :

```yaml
STORAGE_BACKEND: file
GLOBAL_S3_BUCKET: "undefined"
FILE_STORAGE_BACKEND_PATH: /var/lib/storage
```

`"undefined"` est ici **une chaîne littérale de compatibilité avec le répertoire historique existant**. Aucun fichier n’a été déplacé. Ne pas remplacer cette chaîne par `stub` ou une autre valeur sans préparer et vérifier une migration physique complète du stockage.

Seul le service Storage a été recréé avec `--no-deps --force-recreate storage`. Le binaire Compose utilisable sous sudo est `/usr/local/bin/docker-compose` ; le plugin `sudo docker compose` n’est pas disponible sur ce VPS.

## Preuves

- Avant et après recréation : même montage, même empreinte des enregistrements Storage, même empreinte des chemins/tailles/mtime des fichiers, mêmes identifiants de tous les autres conteneurs.
- Health interne `/status` : HTTP 200.
- Nettoyage des trois objets exacts du premier smoke : suppression réussie et absence revérifiée.
- Nouveau smoke : six contrôles réussis, trois objets temporaires créés puis supprimés, zéro échec de nettoyage.
- Deux buckets documentaires privés, limite de 20 Mio ; accès public aux PDF refusé ; URL signées de cinq minutes téléchargées avec contenu exact.
- Images institutionnelles publiques : lecture HTTP 200 et contenu exact.
- API anonyme : HTTP 401 ; origine et preflight CORS `https://www.hedsvs.ch` valides.
- Pas de connexion à un compte réel en production. Le contrôle des rôles admin/étudiant reste couvert par l’environnement de test et les tests unitaires.

Jobs Portly : correction réussie `tmp_b6c84dc9` ; nettoyage exact et recette finale `tmp_e140302b`.

## Retour arrière

Copie protégée de la configuration antérieure, conservée sur le VPS uniquement :

`/opt/supabase/backups/storage-config-20261102T115637Z/docker-compose.yml`

Le script `deploy/staging/rollback-prod-storage-legacy-bucket.remote.sh` restaure cette copie et recrée uniquement Storage. Ce retour arrière réintroduirait la panne de suppression, mais garderait le répertoire physique historique accessible. Le patch durable local est `deploy/staging/storage-prod-legacy-bucket.patch`.
