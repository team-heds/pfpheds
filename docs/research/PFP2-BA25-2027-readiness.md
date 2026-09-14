# Préparation PFP2 BA25 — année académique 2026-2027

## Objectif et périmètre

Préparer le parcours PFP2 de la cohorte BA25 pour l'année académique 2026-2027, avec la clé technique `2027`, sans ouvrir de votation, sans publier d'attribution et sans envoyer de notification.

Ce document rassemble les contrôles du code et un audit agrégé, effectué en lecture seule sur la base de production le 14 septembre 2026. Aucune donnée de production n'a été modifiée.

## Verdict actuel

La correspondance fonctionnelle est correcte : pour l'année technique `2027`, la BA25 est la deuxième année et doit effectuer la `PFP2` (`src/composables/useVotationConfig.js`).

Le parcours ne doit toutefois pas encore être ouvert. Trois prérequis restent bloquants :

1. confirmer la liste officielle de la cohorte, car le champ `user_profiles.classe = BA25` contient des historiques mélangés ;
2. créer ou valider le snapshot annuel `StudentsPhysio` pour `year = 2027` ;
3. compléter les places proposées, car la capacité actuellement exploitable est inférieure à l'effectif probable.

## État constaté en production

### Cohorte et données annuelles

- 115 profils actifs portent actuellement la classe BA25 dans `user_profiles`.
- 113 de ces profils sont reconnus comme étudiants par les données de rôle disponibles.
- aucun de ces profils ne possède encore de ligne annuelle `StudentsPhysio` pour `2027` ;
- le snapshot `2026` contient 63 étudiants avec `StudentsPhysio.class = BA25` ;
- le snapshot `2025` contient 64 étudiants avec `StudentsPhysio.class = BA25` ;
- les autres lignes liées aux profils BA25 portent notamment des classes historiques vides, `BA00`, `BA23` ou `BA24`.

La meilleure estimation technique actuelle de la cohorte est donc 63 étudiants, mais elle ne remplace pas une liste officielle validée. Une session ciblant les 115 profils BA25 serait incorrecte.

### Répondants HES

- 11 répondants HES actifs existent dans l'annuaire ;
- les 63 lignes BA25 du snapshot 2026 ont toutes un répondant HES renseigné ;
- le snapshot 2027 n'existant pas, cette couverture doit être reconduite et contrôlée pour la nouvelle année avant le lancement.

### Offres et places PFP2

- 24 places PFP2 sont proposées pour 2027 hors lignes `selectedOut` ;
- 27 offres PFP2 brutes sont renseignées hors lignes `selectedOut` ;
- 34 places proposées supplémentaires se trouvent sur des lignes `selectedOut` et ne doivent pas être comptées sans validation métier explicite ;
- face à l'effectif probable de 63 étudiants, il manque au minimum 39 places proposées exploitables dans l'état actuel.

Les valeurs 2027 sont stockées avec la clé canonique `2027`. Le parcours Places → Supabase → Gestion des offres a déjà été contrôlé dans `docs/research/HEDS25-597-2027-offer-entry-audit.md`.

### Dates et année académique

- l'année académique `2026-2027` existe, est active et couvre la période du 1er septembre 2026 au 31 août 2027 ;
- la table `academic_years` ne porte pas les dates précises de début et de fin de la PFP2 ;
- les dates officielles de la PFP2 BA25 doivent donc être fournies ou confirmées avant la configuration du parcours.

### Votation et attribution

Pour `PFP2` / `BA25` / `2027`, la production contient actuellement :

- 0 session de votation ;
- 0 vote étudiant ;
- 0 résultat d'attribution.

Cet état est volontairement conservé. Le service d'ouverture crée immédiatement une session `open` et ferme les sessions ouvertes existantes du même PFP et de la même année (`src/service/votationSessionService.js`) : il ne doit donc pas être utilisé pour préparer un simple brouillon.

## Critères d'éligibilité à contrôler

La liste finale doit être construite à partir d'un snapshot annuel validé, et non du seul champ de classe du profil. Pour chaque étudiant retenu, contrôler au minimum :

- compte actif et rôle étudiant correct ;
- appartenance officielle à la cohorte BA25 ;
- ligne `StudentsPhysio` unique pour `2027` ;
- PFP1 terminée ou situation particulière explicitement validée ;
- critères et langues à jour (`aigu`, `ambu`, `msq`, `neuroger`, `rehab`, `sysint`, `fr`, `de`, `it`, `eng`) ;
- indicateurs `sae`, `lese` et `cas_particulier` vérifiés ;
- répondant HES présent et encore actif ;
- absence d'une attribution PFP2 2027 déjà existante.

Les cas de reprise, d'échec ou de dérogation doivent être validés individuellement par le métier. Ils ne doivent pas être inclus ou exclus automatiquement sur une simple supposition technique.

## Ordre de préparation recommandé

### Étape 1 — Valider le référentiel étudiant

- obtenir la liste officielle BA25 ;
- rapprocher cette liste des 63 lignes BA25 du snapshot 2026 ;
- identifier les entrées, sorties, répétitions et exceptions ;
- produire une liste finale avec un identifiant utilisateur unique par étudiant.

### Étape 2 — Préparer le snapshot 2027

- copier uniquement les données encore valides depuis le snapshot 2026 ;
- mettre `year = 2027` et conserver `class = BA25` ;
- revoir les critères, cas particuliers et répondants avant insertion ;
- faire valider le nombre exact de créations et de mises à jour ;
- appliquer l'opération dans une transaction contrôlée, avec rapport avant/après.

La contrainte unique `(user_id, year)` doit être respectée. Aucune copie globale de tous les profils marqués BA25 ne doit être exécutée.

### Étape 3 — Valider les périodes et les capacités

- saisir les dates officielles de la PFP2 dans la source métier retenue ;
- compléter les offres et propositions PFP2 sous la clé `2027` ;
- décider explicitement du traitement des lignes `selectedOut` ;
- obtenir au moins une place exploitable par étudiant, avec une marge pour les critères et incompatibilités ;
- contrôler les sièges imbriqués et les éventuelles assignations préexistantes.

### Étape 4 — Simuler le parcours

- utiliser un jeu de données isolé ou une copie locale ;
- simuler la session `PFP2` / `BA25` / `2027` sans écriture en production ;
- tester un étudiant standard, un cas prioritaire, un cas particulier et un étudiant inéligible ;
- exécuter l'attribution à blanc et vérifier capacité, critères, rangs et non-duplication ;
- contrôler que les résultats restent en brouillon et invisibles aux étudiants.

### Étape 5 — Revue avant ouverture

- faire valider la cohorte, les dates, les places, les répondants et les exceptions ;
- refaire l'audit agrégé avec `scripts/audits/pfp2-ba25-2027-readiness.sql` ;
- vérifier que le nombre de places exploitables couvre l'effectif validé ;
- préparer séparément la procédure d'ouverture, de surveillance et de retour arrière ;
- n'ouvrir la votation et n'activer les notifications qu'après accord explicite.

## Critères de passage au vert

- effectif officiel BA25 signé et identifiants rapprochés à 100 % ;
- exactement une ligne `StudentsPhysio` 2027 par étudiant ;
- 100 % des étudiants avec un répondant HES actif ;
- dates PFP2 officiellement confirmées ;
- capacité PFP2 proposée suffisante, hors `selectedOut` non validé ;
- 0 session, vote ou résultat parasite avant le test ;
- simulation locale réussie sans notification ni publication ;
- validation métier explicite avant toute ouverture en production.

## Risques à traiter avant lancement

- Le ciblage par `user_profiles.classe` inclut des historiques et peut ouvrir la votation au mauvais public.
- Les composants qui chargent toutes les lignes `StudentsPhysio` sans filtrer l'année peuvent retenir un ancien snapshot selon l'ordre de retour.
- `selectedOut` doit être exclu de façon cohérente dans toutes les vues de votation et d'attribution.
- Les propositions numériques et les sièges imbriqués doivent être rapprochés pour éviter de compter deux fois une capacité.
- Créer une session de test dans la base de production n'est pas neutre : le service d'ouverture ferme d'abord les sessions existantes correspondantes.

## Décisions encore attendues

1. Liste officielle et effectif BA25.
2. Dates exactes de la PFP2.
3. Politique applicable aux lignes `selectedOut`.
4. Traitement des reprises, échecs et dérogations.
5. Validation des répondants HES pour 2027.
6. Seuil de marge de capacité avant ouverture.

