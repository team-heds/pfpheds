---
title: Stockage VPS et récupération Supabase
---

## Emplacements

Le VPS `ov-7a3a52` possède un disque système `/dev/sda` de 20 Go et un disque de données
`/dev/sdb` de 250 Go. L'intervention de septembre 2026 prépare ce second disque en ext4,
le monte dans `/srv/heds-data`, puis monte `/srv/heds-data/docker` dans `/var/lib/docker`.
Ce montage conserve les chemins Docker existants, notamment les volumes des certificats Caddy.

PostgreSQL et Storage utilisent des montages distincts qui restent sur le disque système :

- `/opt/supabase/data` : données PostgreSQL actives ; ne jamais supprimer ou initialiser ce dossier.
- `/opt/supabase/storage` : fichiers Supabase Storage.
- `/opt/supabase` : Compose, configuration privée, modèles de mails et configuration Caddy.
- `/opt/pfpheds-backend` : code et environnement privé du backend.

L'espace libéré en déplaçant Docker bénéficie aussi au disque système qui héberge PostgreSQL.
Cette opération n'applique pas de migration SQL et ne change pas les versions des services.

## Sauvegardes avant intervention

Une sauvegarde privée hors serveur, sur le poste administrateur, contient :

- `postgres.dump` : export PostgreSQL au format custom (`pg_dump -Fc`).
- `globals.sql` : rôles et permissions globales (`pg_dumpall --globals-only`).
- `application-config.tar.gz` : site, backend, configuration Supabase, fichiers Storage et certificats Caddy.
  Le répertoire PostgreSQL actif est exclu de cette archive pour éviter une copie physique incohérente.
- `SHA256SUMS` : empreintes des trois fichiers.

Ces fichiers contiennent des données et secrets de production : ils restent hors Git,
avec un dossier privé et des permissions restrictives. Prévoir une seconde copie chiffrée
sur un support indépendant du poste et une politique de sauvegarde régulière.

Le test de restauration utilise l'image PostgreSQL déjà présente sur le VPS,
un conteneur temporaire sans réseau et un répertoire de données en mémoire.
Il crée une base isolée, restaure les rôles puis le dump avec arrêt sur erreur,
et vérifie les tables, comptes, fichiers référencés et règles RLS. L'extension `pg_net`
doit figurer dans `shared_preload_libraries` du conteneur de test.
Le conteneur de test est supprimé après vérification ; il n'utilise aucun volume de production.

Validation du 15 septembre 2026 : restauration complète du dump réussie,
116 tables applicatives/auth/storage, 327 comptes Auth, 6 objets Storage référencés
et 283 politiques. L'intégrité de l'archive des fichiers a été vérifiée séparément.
Cette vérification ne remplace pas un test fonctionnel de chaque fichier et parcours utilisateur.

## Bascule du stockage Docker

1. Vérifier l'identité, la taille, l'absence de montage et les signatures du disque secondaire.
   Le formatage est irréversible et nécessite une autorisation explicite.
2. Sauvegarder `/etc/fstab`, préparer le disque et ajouter son montage persistant par UUID.
3. Copier Docker avec `rsync -aHAXx --numeric-ids` pendant que le site fonctionne.
4. Arrêter les services applicatifs proprement, puis PostgreSQL, puis Docker et son socket.
5. Copier `/opt/supabase` à l'arrêt dans `/srv/heds-data/rollback/supabase-before-storage`.
   Cette sauvegarde physique complète l'export logique et permet de conserver les dernières écritures.
6. Terminer la synchronisation Docker à l'arrêt et vérifier l'égalité des fichiers par checksum.
7. Conserver l'ancien répertoire Docker, activer le montage bind et les dépendances systemd.
8. Démarrer PostgreSQL puis les conteneurs qui étaient actifs avant l'intervention.
9. Vérifier la disponibilité backend, les conteneurs et le site avant d'archiver l'ancien stockage.

Le fichier `/etc/systemd/system/docker.service.d/heds-storage.conf` impose les montages
avant Docker et vérifie les points de montage. Le système doit refuser de démarrer Docker
sur un répertoire vide du disque système si le disque secondaire est indisponible.
Les sauvegardes des configurations et la liste des conteneurs sont dans `/root/heds-storage-20260915`.

## Retour arrière

En cas d'échec pendant la bascule, arrêter Docker et son socket, démonter uniquement le
montage bind `/var/lib/docker`, remettre le répertoire Docker d'origine, restaurer
`fstab.pre-switch` et retirer uniquement le fichier systemd ajouté par l'intervention.
Recharger systemd, redémarrer Docker puis la liste des conteneurs sauvegardée.

Après archivage, l'ancien Docker est conservé dans
`/srv/heds-data/rollback/docker-before-20260915`. Pour l'utiliser, un administrateur
arrête Docker et remplace la source du montage bind par cette copie. Il vérifie ensuite
la cohérence avec la version de l'application et la base actuelle. Ne pas restaurer
la base physique par défaut : cela écraserait les écritures postérieures à la sauvegarde.

Les sauvegardes sur le disque secondaire permettent un retour arrière opérationnel mais
ne protègent pas d'une panne de ce disque ou du VPS. La copie hors serveur reste nécessaire.
