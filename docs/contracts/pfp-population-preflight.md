# Contrôle local de population PFP — HEDS25-601

## Premier lot implémenté

`src/domain/pfp/populationPreflight.js` expose `inspectPfpPopulation`. C'est un calcul pur : aucun client de base de données, aucune sauvegarde, aucun appel à l'algorithme, aucune notification. Il n'est pas encore branché dans l'interface admin.

Entrées obligatoires : année, type PFP et trois tableaux de données brutes :

- `profiles` : `user_id`, `classe`, `is_active` depuis l'annuaire étudiant ;
- `physioStudents` : `user_id`, `class`, `repondant_hes` ;
- `respondents` : `first_name`, `last_name`, `is_active`.

Les deux sources étudiantes doivent être fournies avant toute fusion des classes et ne doivent pas être préfiltrées uniquement sur BA25 : une telle sélection masquerait les divergences et les classes manquantes. Le rapprochement utilise exclusivement `user_id`. Les anciens identifiants Firebase ou emails ne sont pas fusionnés automatiquement.

Le paramètre `sourcesComplete` vaut `false` par défaut. Le futur chargeur devra vérifier la pagination et l'absence d'erreur des trois sources avant de le passer à `true`. Le module ne peut pas prouver lui-même l'exhaustivité d'un export.

## Résultat et limites

Pour PFP2 / 2026-2027, la campagne cible est BA25 / `2027`, calculée par le contrat partagé. Aucun effectif n'est codé en dur ; `expectedCount` permet une assertion explicitement fournie par le responsable de campagne.

Chaque étudiant identifié appartient à une seule catégorie : candidat sans anomalie de population, hors classe cible avec justification, ou cas non résolu. Leur somme correspond à `uniqueStudents`. Les lignes dépourvues d'identifiant sont comptées séparément et bloquent le bilan.

Les répondants sont rapprochés par prénom + nom, comme la valeur enregistrée par `StudentListView.vue`. Seuls la casse et les espaces sont normalisés. Aucune correspondance approximative n'est acceptée. Un homonyme ou un statut actif non confirmé exige une résolution humaine.

`populationReady` ne porte que sur ces contrôles. Un candidat n'est **pas** déclaré éligible : les stages antérieurs, cas particuliers, priorités, dates et capacités restent à contrôler. `campaignReady` reste toujours `false` : ce rapport n'autorise jamais une ouverture.

Les détails contiennent des identifiants étudiants et doivent rester internes, hors Git. `summary` ne contient ni noms, ni emails, ni identifiants. Les tests ne contiennent que des fixtures fictives.

## Suite nécessaire

- Brancher un chargeur en lecture seule, paginé et explicite sur la source locale utilisée.
- Vérifier le bilan sur un export réel autorisé et un échantillon métier.
- Ajouter offres/capacités, dates et éligibilité avant tout bilan go/no-go.
- Vérifier séparément le mode non persistant de l'algorithme avant répétition.

Aucune population réelle n'a été vérifiée par ce lot. Aucun SQL ni aucune donnée de production n'a été modifié.
