# Contrat des années académiques PFP

## Identité d'une campagne

| Notion | Exemple |
| --- | --- |
| Année académique affichée | 2026-2027 |
| Clé de fin d'année | `2027` |
| Cohorte d'entrée | BA25 |
| Type de campagne | PFP2 |
| Numéro ordinal du stage | 2 |

`src/domain/pfp/academicPeriod.js` centralise la résolution frontend. `normalizeAcademicYear` retourne une clé ou `null`; `requireAcademicYear` rejette une valeur invalide avant écriture. `getAcademicYearKeys` retourne les deux clés historiques pour les lectures, quelle que soit la forme fournie à l'entrée. Les libellés historiques inconnus restent lisibles, mais ne sont pas acceptés par les nouvelles écritures de sessions et de votes.

L'année par défaut bascule au 1er septembre selon la convention déjà présente dans les écrans de votation. Elle ne représente pas nécessairement l'année civile du début de stage. Les dates effectives restent à renseigner dans la préparation de campagne.

## Cohortes usuelles

Pour 2027 : PFP1A/PFP1B → BA26, PFP2 → BA25, PFP3/PFP4 → BA24. Cette règle décrit le parcours habituel, pas l'éligibilité individuelle. Un redoublement, transfert ou cas particulier doit être examiné séparément.

PFP1A/PFP1B restent deux types de campagne. Le numéro ordinal 1 conserve la convention actuelle des profils.

## Conflits

Deux capacités `2027` et `2026-2027` identiques sont compatibles. Deux valeurs différentes, y compris 0 et une valeur positive, sont un conflit. Le contrôle des affectations bloque leur publication et les statistiques PFP remontent une erreur. Les affectations vers deux places différentes pour un même étudiant/PFP et ces deux graphies d'année sont également signalées comme conflictuelles.

Le calcul des besoins et certains lecteurs d'offres gardent leurs règles de rapprochement existantes; ce premier lot ne constitue pas une normalisation complète de toutes les capacités. HEDS25-609 porte leur harmonisation.

## Limites de livraison

Le backend Express et les RPC SQL conservent encore certains filtres exacts et leur format d'écriture historique. Le lot frontend ne remplace pas leur audit. Aucune donnée existante n'est migrée et aucune campagne n'est ouverte par ce changement.

Avant la campagne PFP2 BA25 : aligner les écritures backend/SQL, inventorier les années réelles et les doublons, contrôler la population/répondants/capacités et réaliser la répétition HEDS25-601.
