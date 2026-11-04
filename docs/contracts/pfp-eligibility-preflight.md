# Contrôle local d'éligibilité et de priorité — HEDS25-601

`src/domain/pfp/eligibilityPreflight.js` inspecte un snapshot fourni pour une année et un type PFP. Il ne charge ni n'écrit aucune donnée et ne déclenche pas l'algorithme.

Le contrôle rapproche les candidats par `user_id` avec `StudentsPhysio`, les stages validés, les affectations existantes et les places. Il exclut explicitement un étudiant déjà affecté pour la même campagne, en reconnaissant `2027` et `2026-2027`. Une exclusion manuelle doit comporter une justification ; sinon le bilan est bloqué.

Les valeurs SAE et cas particulier sont interprétées strictement. La chaîne `"false"` ne devient pas vraie. Une valeur inconnue, un profil absent ou dupliqué et un historique de stages illisible produisent une anomalie non résolue.

Le score affiché réutilise le barème actuel de `computePriorityScore` avec un départage fixé à zéro. Il s'agit donc d'un score de base reproductible, pas du score final aléatoire d'une exécution. SAE, cas particulier, ancien indicateur `lese` et attribution aléatoire antérieure (`assigned_rank = 99`) déclenchent `requiresPriorityReview` et restent soumis à une décision humaine. Les deux derniers motifs ne modifient pas automatiquement le score de base.

Le préflight ne crée pas de nouveau statut « lésé » : dans le parcours actuel, il dépend du résultat de l'affectation et du nombre de critères couverts. Il remonte uniquement les indicateurs historiques existants pour contrôle humain. Les nouveaux cas devront être mesurés après une simulation non persistante.

`eligibilityReady` signifie uniquement que les sources fournies ne contiennent pas d'anomalie technique connue. `campaignReady` reste toujours `false`. Les règles métier d'exception et toute ouverture doivent être validées séparément.

## Contrôle d'un snapshot local

La commande ci-dessous dérive la population de la classe cible depuis les fiches annuelles, puis restitue uniquement des agrégats. Elle n'imprime aucun nom, `user_id`, identifiant de place ou détail individuel.

```sh
npm run pfp:inspect-eligibility -- \
  --physio=/chemin/StudentsPhysio-2027.json \
  --results=/chemin/student_result_vote.json \
  --places=/chemin/places.json \
  --year=2027 \
  --pfp=PFP2 \
  --exports-complete
```
