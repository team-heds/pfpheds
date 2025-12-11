# Debug Votations Étudiants

## Problème identifié
Les choix des étudiants n'apparaissent pas dans l'onglet "Vue par Étudiants", mais l'onglet "Vue par Places" fonctionne.

## Modifications apportées

### 1. Chargement amélioré des données
- **Étape 1**: Chargement des étudiants depuis `getAllStudents()`
- **Étape 2**: Chargement des places depuis `placesStore.fetchPlaces()` pour avoir un mapping PlaceId → NomPlace
- **Étape 3**: Chargement des statistiques de votes via `loadVoteStatistics()`
- **Étape 4**: Chargement de tous les votes depuis `student_votes`

### 2. Fonction `getPlaceName()`
Cette fonction résout les noms de places en utilisant 3 sources :
1. `choice.placeName` (si déjà présent dans le vote)
2. `placesMap.get(choice.placeId)` (lookup depuis la base de données)
3. `null` (si aucune source disponible)

### 3. Debug ajouté
Dans la console navigateur, vous devriez voir :
```
📚 Chargement des étudiants...
✅ X étudiants chargés
🏥 Chargement des places...
✅ X places chargées
📊 Chargement des statistiques de votes...
✅ Votes agrégés: X places
🗳️ Chargement des votes...
✅ X votes chargés
📋 Exemple de vote: {...}
🔍 Vote 1: {...}
🔍 Vote 2: {...}
🔍 Vote 3: {...}
📋 Total votations créées: X
📋 Exemples de votations (3 premières):
  1. Prénom Nom - PFP1A 2026: { choix1: "...", ... }
```

### 4. Bouton "Réinitialiser les filtres"
Un nouveau bouton a été ajouté pour enlever tous les filtres et voir toutes les données.

## Comment tester

1. **Ouvrir la console du navigateur** (F12)
2. **Recharger la page** VotationEtudiantsView
3. **Vérifier les logs** :
   - Est-ce que les votes sont bien chargés ?
   - Est-ce que `choices` contient des données ?
   - Est-ce que les noms de places sont résolus ?
4. **Cliquer sur "Réinitialiser les filtres"** pour voir toutes les données
5. **Vérifier l'onglet "Vue par Places"** pour confirmer que les stats sont correctes

## Structure attendue de student_votes

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "pfp_type": "PFP1A",
  "year": "2026",
  "choices": [
    {
      "placeId": "place-uuid-1",
      "placeName": "Nom de la place",
      "seatIndex": 1,
      "InstitutionName": "Nom institution"
    },
    {
      "placeId": "place-uuid-2",
      "placeName": "Autre place",
      ...
    }
  ],
  "updated_at": "2024-12-10T11:00:00Z"
}
```

## Prochaines étapes si le problème persiste

1. Vérifier la structure exacte de `student_votes.choices` dans Supabase
2. Vérifier que `user_id` dans `student_votes` correspond bien à l'`id` dans `user_profiles`
3. Vérifier que `placeId` dans `choices` correspond bien au `PlaceId` dans la table des places
4. Vérifier les filtres appliqués par défaut
