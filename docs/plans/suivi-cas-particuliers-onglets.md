# Suivi des cas particuliers — commentaires partagés entre onglets

validated: yes
Issue: demande utilisateur « suivi des cas particuliers — tous les onglets », validée le 22 septembre 2026 pour un test local.

## Demande

Rendre les commentaires du classeur de suivi, notamment les remarques et le suivi LPP, accessibles dans tous les onglets de la page de suivi des cas particuliers, pas seulement « Suivi par étudiant ».

## État constaté

- « Étudiants lésés » affiche le commentaire de la PFP depuis `suivi_cas_particuliers`.
- « Échecs de stage » affiche `student_result_vote.commentaire_arret`, une information distincte des commentaires importés.
- « Étudiants SAE » affiche uniquement le commentaire spécifique `sae`.
- Les remarques et le suivi LPP importés sont conservés dans `info_etudiant` ; les passages explicitement liés à une PFP sont également présents dans cette PFP.
- L’ouverture du motif d’arrêt remplace actuellement en mémoire le commentaire PFP par le motif d’arrêt. Éviter cette mutation, sans changer le stockage du motif.

## Mise en œuvre proposée

- [x] Dans le premier onglet, déplacer la colonne « Info étudiant » à la fin du tableau, après toutes les colonnes PFP, sans changer son contenu ni son action d’édition.
- [x] Ajouter dans les trois onglets un accès au suivi commun de l’étudiant : remarques/LPP et commentaires par PFP, avec libellés explicites.
- [x] Lire ces informations depuis les mêmes données réactives que le premier onglet, sans les recopier dans trois champs différents.
- [x] Conserver les commentaires SAE, les motifs d’arrêt et les statuts existants séparément.
- [x] Conserver les paragraphes et permettre de lire le texte complet ; ne pas limiter l’accès à une infobulle tronquée.
- [x] Empêcher l’ouverture du dialogue de motif d’arrêt de modifier le commentaire PFP en mémoire.
- [x] Tester les étudiants avec suivi PFP, remarques seules, commentaire SAE, motif d’arrêt et absence de commentaire.
- [x] Vérifier qu’une modification du suivi commun est reflétée dans les autres onglets sans rechargement.
- [x] Préparer une livraison isolée des changements de gamification et autres travaux locaux non destinés à la production.

## Garde-fous

Aucune modification des notes, classes, statuts SAE/lésé/échec, attributions ou votations. Aucun envoi de notification. Aucun rattachement automatique des noms ambigus du classeur. Aucun déploiement dans le cadre de la seule validation de ce plan.

## Critères d’acceptation

Pour un étudiant présent dans plusieurs onglets, le même suivi importé est consultable partout. Les informations spécifiques à chaque onglet restent inchangées. Les commentaires ne sont ni dupliqués en base ni écrasés lors de l’ouverture d’un dialogue. Les tests ciblés et la compilation réussissent avant toute proposition de publication.

## Vérification locale — 22 septembre 2026

- `sharedStudentFollowUp.spec.js` : 5 tests réussis (composant monté et contrat d’intégration source).
- Compilation Vite/PWA réussie via Portly `tmp_3d92404e`.
- `git diff --check` réussi.
- ESLint ciblé bloqué par `getInfoStyle`, fonction inutilisée déjà présente dans HEAD ; laissée intacte.
- Aperçu Storybook disponible avec données fictives, sans connexion à la base. Aucune validation navigateur de la page complète authentifiée ni écriture de test en base effectuée.
- Aucun déploiement test ou production effectué. Livraison isolée à préparer avant publication.

## Publication ultérieure autorisée — 22 septembre 2026

Demande explicite : « tu peux mettre en production stp ».

- Baseline isolée reconstruite avec `--production --annual-directory --admin-password-recovery` : 833 fichiers compilés identiques par SHA-256 à ceux du frontend production. Entrée `index-Ddxlc3i_.js`.
- Candidat : mêmes options plus `--shared-followup`, ajout de seulement deux fichiers source (vue et composant partagé). Les travaux locaux gamification sont exclus.
- Compilation isolée réussie : Portly `tmp_0e85c45a`.
- Publication hôte : `tmp_beee9bc7`, activation de la copie réellement servie dans `supabase-caddy-1` : `tmp_41fcd7f9`.
- Sauvegarde hôte ET conteneur : `/var/www/pfpheds-frontend.backup-followup-20260922`. Les anciens assets restent présents.
- Vérification publique sur `www.hedsvs.ch` et `hedsvs.ch` : HTTP 200 et SHA-256 identiques au candidat pour index, service worker, entrée JS, vue et composant JS/CSS (14 fichiers contrôlés). Route métier HTTP 200.
- Entrée publiée : `index-C-6D057_.js`.
- Aucune base modifiée, aucun backend déployé, aucune votation ouverte, aucun service redémarré. Pas de test d’édition avec un compte réel.
- Retour arrière : restaurer `index.html` et `sw.js` depuis la sauvegarde dans le dossier servi du conteneur et dans le dossier hôte, puis vérifier leurs empreintes publiques. Les anciens fichiers compilés sont conservés pour ce retour arrière.
- Attention d’exploitation : le frontend est une copie dans le conteneur, et non un volume monté. Une recréation du conteneur nécessite de restaurer cette copie depuis le dossier hôte ; architecture laissée inchangée.

## Amélioration de l’édition — 22 septembre 2026

- Demande : rendre l’édition logique et refléter les changements partout.
- Le bloc est renommé « Suivi étudiant » dans les trois onglets. Il expose les commentaires complets, un bouton Modifier par rubrique et un sélecteur permettant d’ajouter une rubrique vide.
- L’état sans commentaire permet maintenant d’en créer un ; l’état non chargé est distingué de l’état vide.
- Toute modification PFP faite depuis le suivi partagé met également à jour immédiatement la ligne lésée correspondante. Les vues communes restent basées sur le même objet réactif et ne dupliquent pas les données en base.
- Les motifs d’arrêt et le suivi SAE conservent leurs stockages et actions dédiés.
- Accessibilité : libellés explicites, boutons réels, focus visible, zones tactiles de 40 px et adaptation mobile.
- `sharedStudentFollowUp.spec.js` : 6 tests réussis. Compilation Vite/PWA réussie via Portly `tmp_5c9ea6ff`.
- Inspection visuelle Storybook desktop étroit : contenu long, quatre rubriques et ajout d’une rubrique vide vérifiés.
- Publication ciblée autorisée dans la continuité de la demande : Portly `tmp_9c0a7d77`.
- Sauvegarde v2 hôte et conteneur : `/var/www/pfpheds-frontend.backup-followup-v2-20260922`.
- Vérification publique : index, service worker, entrée JS et quatre assets de la fonctionnalité retournent HTTP 200 avec empreintes identiques au candidat ; route métier HTTP 200.
- Aucune base modifiée pendant la vérification et aucun service redémarré.
