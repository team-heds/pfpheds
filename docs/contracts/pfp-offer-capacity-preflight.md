# Contrôle local des offres et capacités — HEDS25-601

`src/domain/pfp/offerCapacityPreflight.js` produit un bilan pur pour une campagne donnée. Il reçoit un snapshot complet des institutions et places, le nombre d'étudiants à placer et le nombre d'affectations existantes. Il n'accède à aucune base et ne déclenche aucune action.

Pour PFP2 / 2026-2027, le module impose la clé `2027` et la cohorte BA25. Il rapproche `PFP2` et `pfp2_proposition`, accepte la clé historique `2026-2027` en lecture et bloque deux valeurs contradictoires. Les capacités doivent être des entiers positifs ou nuls : les nombres fractionnaires, négatifs et non numériques sont invalides.

Les places d'une institution `is_hidden` sont exclues de la capacité disponible. Le champ historique `selectedOut` est signalé séparément, mais n'exclut pas une place : il provient de l'ancien parcours d'affectation PFP4 et n'est lié ni à une année académique ni à un type de PFP. L'utiliser comme filtre pour PFP2 supprimerait donc arbitrairement des capacités 2026-2027.

Le bilan distingue :

- capacité offerte totale ;
- affectations existantes qui consomment déjà cette capacité ;
- capacité réellement disponible ;
- nombre d'étudiants restant à placer ;
- propositions préparées et capacité restante après placement.

Les sources incomplètes, la population absente, les références d'institution invalides, les institutions sans nom, une capacité vide/insuffisante et les propositions supérieures à l'offre bloquent le bilan. Le contrôle est effectué à la fois sur le total de la campagne et sur chaque fiche de place afin qu'un dépassement local ne soit pas masqué par une sous-proposition ailleurs. Des propositions inférieures à l'offre sont un avertissement, car elles ne diminuent pas la capacité réelle mais demandent une explication métier.

`offersReady` ne porte que sur ce volet. `campaignReady` reste toujours `false` : le rapport ne valide ni l'éligibilité, ni les dates, ni les priorités et n'autorise jamais l'ouverture ou la publication.

Les données réelles ne doivent jamais être ajoutées au dépôt. Les snapshots restent dans un répertoire local privé et les rapports détaillés doivent rester internes s'ils comportent des identifiants.

## Contrôle d'un snapshot local

La commande suivante lit trois exports JSON complets et ne restitue que des totaux, des codes d'anomalie et les empreintes des sources. Les identifiants, noms d'institutions et noms de places ne sont jamais imprimés. Une affectation existante ne consomme une place que si elle correspond au type et à l'année de campagne et possède un `assigned_place_id`. Elle est dédupliquée par `user_id`.

```sh
npm run pfp:inspect-offers -- \
  --institutions=/chemin/institutions.json \
  --places=/chemin/places.json \
  --assignments=/chemin/student_result_vote.json \
  --students=63 \
  --year=2027 \
  --pfp=PFP2 \
  --exports-complete
```
