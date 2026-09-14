---
id: password-recovery-recette
title: Recette du parcours de réinitialisation
---

# Recette du parcours de réinitialisation

Cette recette valide le parcours Supabase Auth sans conserver de mot de passe, de code ou de jeton dans les captures, les tickets ou les journaux.

## Préconditions

- Utiliser un compte de test Supabase actif dont la boîte mail est accessible.
- Vérifier que l’environnement cible affiche la version attendue.
- Ouvrir les outils réseau sans activer la conservation permanente des requêtes sensibles.
- Préparer un nouveau mot de passe conforme, différent du précédent. Aucun mot de passe temporaire ne doit être généré ni transmis par un administrateur.

## Scénarios automatisés

```bash
npm run test:unit -- \
  tests/unit/passwordRecoveryService.spec.js \
  tests/unit/passwordResetValidation.spec.js \
  tests/unit/passwordRecoveryRoute.spec.js \
  tests/unit/resetPasswordJourney.spec.js \
  tests/unit/studentInitialAccessService.spec.js

npm --prefix backend test

npx playwright test tests/e2e/password-recovery.spec.js
```

Ils couvrent le routage public, le jeton valide, expiré ou déjà consommé, le code OTP, les règles du mot de passe, la confirmation, la fermeture de session et les rendus mobile/ordinateur.

## Premier accès BA26 — HEDS25-599

Cette partie ne peut être exécutée avec un envoi réel qu’après la livraison de l’import/création des comptes HEDS25-508 et la validation manuelle d’un compte BA26 de test. Ne jamais utiliser une adresse d’étudiant réelle pour la recette.

1. Importer ou créer un compte de test avec un profil actif, un rôle étudiant et la classe `BA26` ou `BAC26`.
2. Dans **Administration > Utilisateurs**, vérifier l’état **À envoyer** et l’action **Envoyer l’accès**. Un rôle non étudiant, un compte inactif ou une autre classe doit afficher **Non concerné**.
3. Confirmer l’envoi. Vérifier l’état **Envoyé**, la date et la réponse HTTP `202`. Le lien doit aboutir au parcours marqué `flow=initial-access`, sans copier l’adresse, le lien ni le contenu de l’email dans les preuves.
4. Relancer une fois. Vérifier que le compteur serveur augmente, qu’il n’existe toujours qu’une ligne d’état pour le compte et que seul le dernier lien reçu est valide.
5. Ouvrir le dernier lien, définir le mot de passe et vérifier que l’état admin devient **Utilisé**. Rejouer l’appel de finalisation doit rester sans effet secondaire.
6. Vérifier qu’un ancien lien, un lien déjà utilisé et un lien expiré sont refusés par Supabase Auth.
7. Simuler un échec de livraison sur l’environnement de test : l’admin doit voir **Erreur** et pouvoir **Réessayer**, sans détail SMTP ni donnée personnelle.

Les tables `student_initial_access` et `student_initial_access_events` sont réservées au serveur. Les rôles navigateur `anon` et `authenticated` ne doivent avoir aucun privilège direct. Les événements ne contiennent que l’identifiant utilisateur, l’acteur, l’identifiant de corrélation et une catégorie générique.

## Recette réelle

### 1. Adresse connue

1. Depuis la connexion, demander un nouveau mot de passe avec le compte de test.
2. Vérifier que le message public confirme l’envoi sans afficher d’information sur le compte.
3. Conserver uniquement le dernier email reçu.
4. Vérifier que l’objet mentionne HEdS, que le contenu rappelle l’expiration d’une heure et l’usage unique, et que le bouton cible `https://hedsvs.ch/reset-password`.

### 2. Adresse inconnue

1. Refaire la demande avec une adresse qui n’existe pas.
2. Vérifier que le texte et le statut visibles sont identiques au scénario précédent.
3. Ne pas attendre ni rechercher un email.
4. Vérifier dans l’onglet Réseau que la demande passe par `/api/auth/password-recovery` et que son statut et son corps sont identiques au scénario précédent.

### 3. Jeton valide et connexion finale

1. Ouvrir le dernier lien reçu dans une fenêtre privée.
2. Vérifier que `/reset-password` s’affiche et que l’utilisateur n’arrive pas sur `/home`.
3. Essayer deux confirmations différentes, puis un mot de passe trop faible : aucune modification ne doit partir.
4. Enregistrer un mot de passe robuste.
5. Vérifier l’état de succès puis le retour à la connexion.
6. Se connecter avec le nouveau mot de passe : la connexion doit réussir.
7. Vérifier que l’ancien mot de passe est refusé.

### 4. Usage unique et expiration

1. Réouvrir exactement le même lien : il doit être refusé comme invalide ou expiré.
2. Demander un nouveau lien et vérifier que l’ancien ne redevient pas valide.
3. Pour contrôler l’expiration sans attendre une heure, utiliser un lien expiré dédié à l’environnement de test ou confirmer un événement `otp_expired` dans les journaux Auth. Ne jamais copier le jeton dans Jira.

### 5. Mobile et ordinateur

Exécuter les scénarios 3 et 4 au minimum sur :

- mobile étroit, environ `390 × 844` ;
- ordinateur, au moins `1440 × 900`.

Vérifier l’absence de défilement horizontal, la visibilité du focus clavier, l’affichage/masquage des mots de passe et la lisibilité des erreurs.

## Preuves autorisées

- version de l’application ;
- date et environnement ;
- résultat de chaque scénario ;
- codes d’erreur génériques comme `otp_expired` ;
- captures où l’adresse, le code, le jeton et le mot de passe sont masqués.

Ne jamais joindre de lien complet de récupération, de cookie, de JWT, de code OTP ou de mot de passe.

Dans les journaux backend, conserver uniquement l’identifiant de corrélation, la catégorie et éventuellement le statut fournisseur. Toute adresse email, URL de récupération ou erreur SMTP détaillée invalide la recette de sécurité.
