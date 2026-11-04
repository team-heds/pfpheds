# Préproduction HEdS — environnement de test

Mise à jour réseau du 15 septembre 2026 : `153.109.1.101`, `178.194.68.213` et `2a02:1210:7602:5200:7876:530a:8b16:d32e` sont autorisées pour le domaine de test. Les deux dernières adresses correspondent au nouveau Wi-Fi (IPv4 et IPv6 de cet ordinateur) ; l'ancien accès est conservé. Page de connexion vérifiée (200), API refusée depuis une autre adresse (403). Cette liste remplace la mention d'une IP unique dans l'historique ci-dessous. L'adresse IPv6 temporaire peut changer et nécessiter une nouvelle autorisation.

## Studio de test — accès privé

Studio dédié : http://localhost:8181/project/default. Identifiants distincts dans `studio-access.json` (privé, ignoré par Git). Le mot de passe commun des comptes étudiants ne donne pas accès à Studio.

Le tunnel `PlateformeHEdS/studio-test-tunnel` est géré par Portly. Pour le relancer : `portly start PlateformeHEdS/studio-test-tunnel`. Le port du VPS et le port local écoutent uniquement sur 127.0.0.1, avec authentification HTTP supplémentaire sur toutes les routes de Studio.

Studio et postgres-meta sont attachés uniquement au réseau interne de test. Meta utilise `db:5432/staging`, vérifié par une requête retournant `current_database() = staging` et 327 comptes. Les images sont épinglées aux empreintes déjà présentes sur le VPS. Aucun secret de production n'est fourni à ces services.

Vérification navigateur : accueil, liste des tables et ouverture de `StudentsPhysio` sans erreur HTTP. L'extension `pg_stat_statements` a été activée dans `staging` uniquement pour les statistiques de Studio ; aucune donnée métier n'a été modifiée. La protection refuse l'accès sans identifiants (401).

Dans Studio : **Table Editor** pour les tables métier (`StudentsPhysio`, `user_profiles`, `places`, `votation_sessions`), **Authentication** pour les comptes. Studio donne des droits d'administration sur le TEST, pas un accès en lecture seule : modifier ou supprimer une ligne y change réellement la copie de test. Le nom du projet est `TEST - copie independante`. La production conserve son Studio distinct.

## État actuel : copie privée de production (15 septembre 2026)

**Le test contient désormais des données personnelles réelles.** Les sections relatives aux fixtures ci-dessous sont historiques.

- Base de test indépendante : 327 comptes copiés. Connexion avec l'email habituel et le mot de passe commun privé dans `real-test-access.json` ; ne pas utiliser les anciens comptes `example.invalid`.
- Profils, rôles, permissions et données métier conservés : comparaison de 96 tables métier avant activation, aucune différence.
- Les mots de passe ont été changés dans la copie uniquement ; aucun mot de passe ni aucune donnée de production modifiés.
- Les sessions, refresh tokens, facteurs MFA, flux SSO, files réseau et abonnements/files push de production ne sont pas repris. Les jetons de récupération/confirmation sont effacés dans la copie. Les emails sont confirmés pour les essais. Le champ technique `aud` vide de 301 comptes a été normalisé à `authenticated` dans le test uniquement.
- Les 31 sessions de votation copiées sont fermées. Aucun envoi de notification effectué. SMTP reste capturé dans Mailpit, aucun worker push.
- Les 6 objets Supabase Storage ont été copiés dans le volume distinct du test et vérifiés en lecture. Les éventuels liens applicatifs externes ne sont pas réécrits et ne sont pas couverts par cette vérification.
- Protection réseau de **toutes** les routes du domaine, API comprises : seule l'IP `153.109.1.101` est autorisée par Caddy. L'accès équipe du frontend reste en plus. Si l'équipe change de réseau ou utilise IPv6/proxy, une mise à jour explicite de l'accès est nécessaire ; ne pas retirer la restriction pour dépanner.
- Vérifications : navigateur admin OK, étudiant OK ; API admin 200/admin et 403/étudiant ; fichiers 6/6 ; accès public extérieur refusé.
- Sauvegardes privées VPS : `/opt/pfpheds-staging/backups/clone-20260915`. Ancienne base fictive conservée sous `staging_synthetic_20260915` dans le cluster de test. Les scripts de copie datés sont des opérations ponctuelles, pas une synchronisation automatique.

Les tests ne valident pas encore le cycle complet de votation/attribution. Les anomalies du rapport précédent ne sont pas réputées corrigées par la copie.

## Publication du 15 septembre 2026

- Application : https://test.hedsvs.ch (HTTPS vérifié).
- Premier accès navigateur : identifiants équipe dans `web-access.json` (privé, ignoré par Git). Cette protection concerne le frontend ; les API utilisent leurs contrôles Auth/RLS habituels.
- Connexion applicative : comptes fictifs dans `test-accounts.json` (privé, ignoré par Git).
- DNS A : `83.228.204.5` ; AAAA : `2001:1600:13:101::2052`.
- Caddy de production relaie uniquement ce domaine vers le gateway de test. Son réseau `pfpheds-staging_edge` est déclaré dans `/opt/supabase/docker-compose.yml` pour survivre à une recréation.
- Sauvegardes avant publication : `/opt/supabase/reverse-proxy/Caddyfile.before-staging-20260915` et `/opt/supabase/docker-compose.yml.before-staging-20260915`.
- Contrôles publics : frontend anonyme 401, frontend avec accès équipe 200, connexions admin et étudiant 200, comptage admin 200 et étudiant 403. Production 200.
- Mailpit reste privé via le tunnel SSH sur http://localhost:8025. Aucun envoi aux étudiants.
- Limites : résultats de votation encore en erreur SQL ; rôles techniques PostgreSQL à durcir. Environnement réservé aux données fictives et aux essais, pas une validation complète du parcours.

Les sections suivantes constituent l'historique de préparation ; l'état de publication ci-dessus prévaut.

## Installation du 15 septembre 2026

La stack est installée dans `/opt/pfpheds-staging`. Sept services tournent : PostgreSQL, Auth, REST, Storage, backend, Caddy et Mailpit. Le frontend est compilé avec les seules variables de test et servi par Caddy. Studio et Realtime ne sont pas installés.

- Application : http://localhost:8180
- Emails capturés : http://localhost:8025
- Tunnel actif géré par Portly : `PlateformeHEdS/staging-tunnel`.
- Administrateur : `admin.test@example.invalid` ; mot de passe dans `test-accounts.json`, privé et ignoré par Git.
- Fixtures : 64 comptes, 10 institutions, 70 places, entièrement fictifs.
- Vérifications : connexion admin et étudiant, profils, API de comptage des affectations (200), email de récupération capturé.
- Défaut trouvé : la lecture des résultats renvoie 500 (`get_algorithm_results`, incompatibilité de type SQL). Le parcours de votation n'est pas encore entièrement validé.
- Production accessible après installation (200) ; environ 9,5 Go libres sur le disque.

Le gateway est relié à un réseau d'entrée supplémentaire pour publier uniquement sur la boucle locale. Les services de données restent sur un réseau Docker interne. Aucun DNS public ni routage de production modifié.

La base applicative `staging` a été créée depuis `template0`, puis le schéma restauré avec `supabase_admin`. Seules les tables techniques de migration Auth/Storage ont été copiées. Les premières bases vides d'essai ont été réinitialisées pendant cette préparation ; aucune donnée de production n'a été supprimée. Les connexions internes utilisent actuellement postgres, membre de supabase_admin dans le cluster de test : passer à des rôles dédiés avant publication sur un domaine.

Les sections ci-dessous conservent le plan initial ; les points déjà réalisés sont décrits ci-dessus. L'import et la configuration des rôles doivent encore être automatisés pour une réinstallation en une commande.

## État

Configuration candidate pour tester Auth et REST en accès privé. **Ce n'est pas encore une plateforme de test fonctionnelle complète.** Aucun démarrage ou déploiement automatique. Les versions Supabase correspondent aux services relevés en production le 15 septembre 2026 ; aucune montée de version implicite.

Le réseau Docker est interne : les services n'ont pas accès à Internet ni au réseau de production. Aucun répertoire du VPS de production n'est monté. Seuls deux ports liés à la boucle locale sont déclarés : 8180 (application/API) et 8025 (capture des emails). Aucun worker push ni secret d'intégration n'est fourni.

## Préparer et vérifier

Depuis la racine du dépôt, exécuter via Portly :

```sh
node deploy/staging/prepare.mjs
docker compose --env-file deploy/staging/.env -f deploy/staging/compose.yml config --quiet
```

Le générateur refuse d'écraser les secrets existants. Les fichiers créés sont ignorés par Git et limités au propriétaire. Ne pas utiliser le `.env` racine ni `backend/.env` pour cet environnement. Le frontend doit être construit dans un contexte propre sans aucun fichier `.env` de production ; `frontend.env` est la seule source autorisée. Le build validé sera placé dans `frontend-dist/`.

## Travail nécessaire avant démarrage de la plateforme complète

1. Préparer et vérifier l'initialisation des rôles `anon`, `authenticated`, `service_role`, des schémas Auth/Storage et des permissions. La configuration candidate utilise temporairement postgres pour les connexions internes ; préparer des rôles de service dédiés avant publication.
2. Restaurer uniquement la structure applicative vérifiée, avec les migrations nécessaires. Le baseline `public-schema.sql` ne constitue pas à lui seul une installation Supabase complète. Aucun import automatique de données réelles.
3. Ajouter des comptes fictifs via Auth et des profils BA25, dont des cas prioritaires, avec des adresses `example.invalid`. Vérifier les permissions avec ces comptes.
4. Ajouter le backend Express, Storage et éventuellement Realtime avec les seuls services de test. Les routes correspondantes répondent volontairement 503 jusque-là.
5. Préparer le build frontend isolé. La politique navigateur bloque déjà les connexions vers des domaines externes, mais il faut aussi vérifier les URL compilées et les parcours Firebase historiques.
6. Tester première connexion, récupération, lecture/écriture des places et votation. Les emails doivent apparaître uniquement dans Mailpit.
7. Mesurer la consommation disque puis préparer séparément les DNS et les routes Caddy pour `test.hedsvs.ch` et `api-test.hedsvs.ch`, avec contrôle d'accès équipe. Actualiser ensemble URL Auth, redirections, CORS et politique navigateur.

## Accès privé prévu sur VPS

Après installation validée, utiliser un tunnel SSH vers les ports locaux : `ssh -L 8180:127.0.0.1:8180 -L 8025:127.0.0.1:8025 heds-vps`. Application sur `http://localhost:8180`, emails sur `http://localhost:8025`. Ne pas exposer directement ces ports sur Internet.

## Limite de capacité

Le VPS actuel a 20 Go de disque dont environ 10 Go libres. La documentation officielle recommande au minimum 40 Go pour une stack complète : https://supabase.com/docs/guides/self-hosting/docker . L'audit de mémoire seul ne suffit donc pas à autoriser une deuxième stack complète. Confirmer une marge suffisante ou augmenter le disque avant installation.

## Retour arrière

Lors de l'installation, arrêter uniquement le projet Compose `pfpheds-staging` et retirer uniquement les nouvelles routes de test si nécessaire. Conserver son volume de base ; ne pas utiliser `down -v`, de nettoyage Docker global ou les scripts de déploiement de production.
