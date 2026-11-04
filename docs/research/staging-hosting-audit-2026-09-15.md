# Préproduction HEdS — audit d’hébergement

Audit du 15 septembre 2026, par SSH en lecture seule. Aucun service redémarré, aucune configuration distante modifiée.

## État constaté

| Élément | Observation |
| --- | --- |
| CPU | 4 processeurs logiques ; charge instantanée faible |
| RAM | 11 957 Mio au total, 10 345 Mio disponibles au contrôle |
| Swap | Aucun |
| Disque racine | 20 Go, 9,5 Go occupés, 9,8 Go disponibles |
| PostgreSQL | Base `postgres` : 70 Mo |
| Stack | 10 conteneurs démarrés ; contrôles de santé présents au vert |
| Routage | Caddy 2.8, ports publics 80/443 |
| Données PostgreSQL | Montage dédié `/opt/supabase/data` |
| Stockage Supabase | Montage dédié `/opt/supabase/storage` |
| Configuration Caddy effective | `/opt/supabase/reverse-proxy/Caddyfile` |
| Images Docker | 5,531 Go ; 1,002 Go annoncés récupérables, aucun nettoyage effectué |

Ces mesures sont ponctuelles et ne décrivent pas les pics de charge. Le volume PostgreSQL indiqué ne mesure pas les documents conservés dans des services externes.

## Recommandation

Une petite préproduction sur le VPS actuel est envisageable pour les essais de l'équipe : mémoire disponible importante et base de taille modeste. Cela évite d'acheter immédiatement un second serveur. Le disque constitue la contrainte principale ; prévoir une marge pour les images, builds, journaux et sauvegardes avant installation. Ne pas qualifier cette solution d'isolation complète : une panne ou saturation du VPS toucherait les deux environnements.

Un VPS séparé est préférable si l'équipe veut isoler aussi les ressources, les redémarrages et les pannes, ou réaliser des tests de charge. Aucun achat n'est nécessaire pour terminer la préparation technique.

## Architecture proposée à préparer

- Frontend : `test.hedsvs.ch`.
- API : `api-test.hedsvs.ch` ; routes Express et Supabase propres à la préproduction.
- Studio réservé à l'équipe, idéalement via tunnel SSH au départ.
- Projet Docker distinct, par exemple `pfpheds-staging`, avec noms, réseaux, montages, secrets et base indépendants.
- Répertoire propre : `/opt/pfpheds-staging`. Aucun montage des données de production dans la stack de test.
- Réutilisation du proxy Caddy public avec routes explicites vers la nouvelle stack, uniquement lors de l'installation validée.
- Versions d'images épinglées. La production utilise actuellement `supabase/studio:latest` : relever l'image effective pour garantir la reproductibilité.
- SMTP de test capturant les messages ; aucun destinataire externe. Worker push désactivé et secrets VAPID de production absents.
- Données fictives pour commencer. Toute copie ultérieure doit anonymiser les identités et exclure sessions Auth, mots de passe, abonnements push, files d'envoi et documents privés.
- Vérifier aussi Firebase historique, Vimeo, GitHub, transferts de fichiers et services IA : une seconde base Supabase ne suffit pas à isoler ces intégrations.

## Écarts documentaires constatés

La topologie documentée en juillet reste globalement cohérente, mais le chemin Caddy effectif est désormais `/opt/supabase/reverse-proxy/Caddyfile`. Les services Studio et Realtime sont actuellement sains. Le Compose de production à la racine du dépôt décrit une autre architecture et ne doit pas servir directement de modèle de déploiement.

## Étapes avant installation

1. Extraire la structure de la stack active en expurgeant les secrets et figer les versions d'images.
2. Préparer localement le Compose de préproduction, les variables attendues et le routage proposé.
3. Construire un jeu de données fictif BA25/PFP2 et des comptes de test ; inclure les cas prioritaires.
4. Ajouter un contrôle empêchant un build de test de pointer vers les services de production.
5. Préparer la procédure de déploiement distincte, ses vérifications et son retour arrière.
6. Confirmer la marge disque et les DNS, puis installer dans une étape distincte.

## Vérifications de réception

- La production reste accessible.
- Le frontend de test contacte exclusivement les services de test.
- Une modification d'étudiant ou de place de test reste confinée à la base de test.
- Les demandes de première connexion et de récupération arrivent uniquement dans la boîte de capture.
- Les notifications push et autres intégrations ne contactent pas les utilisateurs réels.
- La votation peut être ouverte, simulée et réinitialisée uniquement dans la préproduction.

L'audit est terminé. La préproduction n'est pas encore installée ; les DNS et l'isolation effective restent à vérifier à cette étape.
