# HEDS25-601 — Précontrôle local PFP2 BA25

Date du snapshot : 15 septembre 2026  
Campagne : PFP2 BA25  
Année académique : 2026-2027  
Clé canonique : `2027`

Ce rapport provient exclusivement d'exports complets lus localement. Il n'a modifié aucune donnée, ouvert aucune votation, envoyé aucune notification et déclenché aucun déploiement. Les exports contenant des données personnelles restent hors du dépôt.

## Population

- 63 personnes dans le classeur de référence, toutes avec une identité et un répondant renseignés.
- 63 fiches `StudentsPhysio` pour l'année 2027, sans doublon `user_id + year`.
- 56 correspondances exactes entre le classeur et `user_profiles`.
- 7 lignes du classeur sans correspondance exacte : 6, 19, 20, 21, 24, 26 et 37.
- 7 profils BA25 absents du rapprochement exact avec le classeur. Ce total symétrique indique probablement des différences d'orthographe ou d'identité à examiner, sans autoriser une fusion automatique.
- 26 différences de répondant entre le classeur et la fiche annuelle 2027.
- 14 fiches annuelles portent un libellé de répondant qui ne correspond pas exactement au registre actif des 11 répondants.

Le volet population reste bloqué. Aucun nom approximatif n'a été fusionné automatiquement.

Une comparaison locale non persistante indique que trois des sept lignes ont un candidat unique à une seule modification de caractère et qu'une autre diffère uniquement après normalisation de la ponctuation. Les trois autres écarts sont plus importants. Ces indications servent uniquement à organiser la revue humaine et ne modifient aucune correspondance.

## Éligibilité et priorité

- 63 candidats techniques issus des fiches BA25 de l'année 2027.
- 63 candidats techniquement éligibles.
- 0 exclusion et 0 dossier techniquement non résolu.
- 4 dossiers à revoir comme prioritaires en raison d'une attribution aléatoire antérieure (`assigned_rank = 99`).
- 0 indicateur SAE, cas particulier ou ancien champ `lese` actif dans le snapshot.
- Scores de priorité de base compris entre 15 et 65, sans départage aléatoire.

Nombre d'étudiants auxquels il manque encore chaque critère :

| Critère | Effectif |
| --- | ---: |
| MSQ | 34 |
| SYSINT | 47 |
| NEUROGER | 37 |
| AIGU | 44 |
| REHAB | 17 |
| AMBU | 58 |
| FR | 15 |
| DE | 45 |

Ce volet est techniquement valide, mais les quatre priorités restent soumises à une confirmation humaine.

## Offres et capacités

- 98 institutions exportées, dont 1 masquée.
- 113 places exportées.
- 42 places marquées `selectedOut`, exclues du calcul.
- 71 places actives reliées aux 97 institutions visibles.
- 18 institutions visibles proposent au moins une capacité PFP2 en 2027.
- 27 places offertes actives pour 63 personnes.
- 25 places reprises dans `pfp2_proposition`.
- 0 affectation PFP2 existante pour 2027 ou 2026-2027.

La capacité active manque de 36 places. Les propositions sont inférieures de 2 aux offres actives et de 38 à l'effectif attendu.

## État de la votation

- 0 vote PFP2 enregistré pour 2027.
- 0 session PFP2 créée pour 2027.
- 0 session PFP2 ouverte pour 2027.

La simulation d'affectation n'est donc pas lancée : elle ne serait pas représentative sans choix étudiants et avec une capacité active limitée à 27 places.

## Décision

`campaignReady` reste faux. Avant toute simulation de votation :

1. résoudre manuellement les 7 correspondances d'identité ;
2. valider la source de vérité des répondants et corriger les 26 divergences, dont les 14 libellés inconnus du registre ;
3. confirmer que les 42 places `selectedOut` doivent bien rester retirées ;
4. obtenir au minimum 36 capacités actives supplémentaires ;
5. aligner ensuite `pfp2_proposition` sur l'offre validée ;
6. confirmer humainement les quatre dossiers prioritaires détectés ;
7. relancer les contrôles de population, d'éligibilité et de capacité avant une simulation non persistante.

## Traçabilité

Les commandes `pfp:reconcile-snapshot`, `pfp:inspect-offers` et `pfp:inspect-eligibility` ne produisent que des agrégats, codes d'anomalie, numéros de lignes et empreintes de fichiers. Elles n'impriment ni noms, ni adresses email, ni `user_id`.
