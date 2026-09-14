# Préparation PFP2 BA25 — année académique 2026-2027

## Objectif et périmètre

Préparer le parcours PFP2 de la cohorte BA25 pour l'année académique 2026-2027, avec la clé technique `2027`, sans ouvrir de votation, sans publier d'attribution et sans envoyer de notification.

Ce document rassemble les contrôles du code, l'audit initial en lecture seule et la synchronisation contrôlée effectuée le 14 septembre 2026 à partir du fichier officiel `Répartitions étudiant-e-s CPT 2026-2027.xlsx`.

## Verdict actuel

La correspondance fonctionnelle est correcte : pour l'année technique `2027`, la BA25 est la deuxième année et doit effectuer la `PFP2` (`src/composables/useVotationConfig.js`).

Le référentiel BA25 et son snapshot annuel sont maintenant prêts. Le parcours ne doit toutefois pas encore être ouvert. Deux prérequis restent bloquants :

1. confirmer les dates exactes de la PFP2 ;
2. compléter les places proposées, car la capacité actuellement exploitable est inférieure à l'effectif officiel.

## État constaté en production

### Cohorte et données annuelles

- le fichier officiel contient 63 étudiants BA25 ;
- les 63 étudiants ont été rapprochés de manière unique avec un profil existant ;
- les 63 profils actifs portent maintenant la classe BA25 et le rôle `EtudiantPhysio` ;
- les 52 anciennes étiquettes BA25 ne figurant pas dans la liste officielle ont été retirées sans désactiver les comptes ;
- le snapshot `StudentsPhysio` 2027 a été créé pour les 63 étudiants à partir du snapshot 2026 ;
- la contrainte unique `(user_id, year)` est respectée.

La cohorte technique correspond maintenant à l'effectif officiel de 63 étudiants. Le ciblage PFP2 BA25 ne repose plus sur les 115 profils mélangés observés avant la correction.

### Répondants HES

- 11 répondants HES actifs existent dans l'annuaire ;
- les 63 lignes BA25 du snapshot 2027 ont toutes un répondant HES renseigné ;
- les 11 différences de libellé observées dans le fichier correspondent à l'abréviation « Marie Blanjean » de la même répondante déjà enregistrée sous son nom complet ; le libellé canonique et son identifiant ont été conservés.

### Offres et places PFP2

- 24 places PFP2 sont proposées pour 2027 hors lignes `selectedOut` ;
- 27 offres PFP2 brutes sont renseignées hors lignes `selectedOut` ;
- 34 places proposées supplémentaires se trouvent sur des lignes `selectedOut` et ne doivent pas être comptées sans validation métier explicite ;
- face à l'effectif officiel de 63 étudiants, il manque au minimum 39 places proposées exploitables dans l'état actuel.

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

### Étape 1 — Valider le référentiel étudiant — terminé

- liste officielle BA25 obtenue : 63 étudiants ;
- rapprochement des 63 lignes avec les profils et le snapshot 2026 terminé ;
- anciens profils hors liste retirés du ciblage BA25 sans désactivation ;
- aucun compte supplémentaire créé.

### Étape 2 — Préparer le snapshot 2027 — terminé

- 63 lignes copiées depuis le snapshot 2026 ;
- `year = 2027` et `class = BA25` appliqués ;
- répondants HES présents sur 63 lignes sur 63 ;
- aucune session, aucun vote et aucun résultat créés par cette opération.

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

- effectif officiel BA25 et identifiants rapprochés à 100 % — atteint ;
- exactement une ligne `StudentsPhysio` 2027 par étudiant — atteint ;
- 100 % des étudiants avec un répondant HES renseigné — atteint ;
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

1. Dates exactes de la PFP2.
2. Politique applicable aux lignes `selectedOut`.
3. Traitement des reprises, échecs et dérogations.
4. Seuil de marge de capacité avant ouverture.

## Contrôle global des classes depuis le fichier officiel

Les profils existants des cohortes BA23 à BA26 ont été rapprochés et alignés avec le fichier :

- 197 profils officiels alignés ;
- 3 rôles génériques `user` corrigés en `EtudiantPhysio` lors du contrôle global, en plus de la correction BA25 ;
- 4 anciennes étiquettes de classe hors répartition retirées, sans désactivation de compte ;
- le profil enseignant homonyme de l'étudiante BA23 n'a pas été modifié ;
- le compte de Waser Abigael n'a pas été créé, conformément à la décision de le traiter plus tard si nécessaire ;
- les comptes BA22 absents de la plateforme n'ont pas été recréés.

Le fichier comporte par ailleurs 63 lignes d'étudiants dans la feuille BA24 alors que son titre en annonce 64. Aucun étudiant fictif n'a été ajouté pour compenser cet écart documentaire.
