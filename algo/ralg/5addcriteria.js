import fs from 'fs';

// Charger les fichiers JSON
const stagesData = JSON.parse(fs.readFileSync('stages_data.json', 'utf8'));
const assignedPlaces = JSON.parse(fs.readFileSync('places_assigned.json', 'utf8'));
const placeCountData = JSON.parse(fs.readFileSync('updated_places_assigned_with_place_count.json', 'utf8'));

// Fonction pour créer un objet de critères par place à partir de `stages_data.json`
function createCriteriaByPlaceMap(stagesData) {
  const placeCriteriaMap = {};

  // Parcourir toutes les places dans `stages_data.json`
  stagesData.forEach(stage => {
    placeCriteriaMap[stage.IDPlace] = {
      NomPlace: stage.NomPlace,
      Lieu: stage.Lieu,
      Domaine: stage.Domaine,
      FR: stage.FR || 'false',
      ALL: stage.ALL || 'false',
      AIGU: stage.AIGU || 'false',
      AMBU: stage.AMBU || 'false',
      MSQ: stage.MSQ || 'false',
      REHAB: stage.REHAB || 'false',
      NEUROGER: stage.NEUROGER || 'false',
      SYSINT: stage.SYSINT || 'false'
    };
  });

  return placeCriteriaMap;
}

// Fonction pour créer une map de totalPlaces à partir de `updated_places_assigned_with_place_count.json`
function createPlaceCountMap(placeCountData) {
  const placeCountMap = {};

  placeCountData.forEach(place => {
    const basePlaceId = place.placeId.split('_').slice(0, 2).join('_'); // Extraire l'ID de base (X_X)
    placeCountMap[basePlaceId] = place.totalPlaces;
  });

  return placeCountMap;
}

// Fonction pour ajouter les critères des places et le totalPlaces dans `places_assigned.json`
function addCriteriaAndPlaceCountToAssignedPlaces(assignedPlaces, placeCriteriaMap, placeCountMap) {
  return assignedPlaces.map(place => {
    const basePlaceId = place.placeId.split('_').slice(0, 2).join('_'); // Extraire l'ID de base (X_X)

    // Récupérer les critères pour la place correspondante
    const criteria = placeCriteriaMap[basePlaceId];
    const totalPlaces = placeCountMap[basePlaceId] || 'null'; // Ajouter totalPlaces s'il existe, sinon 'null'

    if (criteria) {
      // Ajouter les critères et le totalPlaces à l'entrée de la place assignée
      return {
        ...place,
        NomPlace: criteria.NomPlace,
        Lieu: criteria.Lieu,
        Domaine: criteria.Domaine,
        FR: criteria.FR,
        ALL: criteria.ALL,
        AIGU: criteria.AIGU,
        AMBU: criteria.AMBU,
        MSQ: criteria.MSQ,
        REHAB: criteria.REHAB,
        NEUROGER: criteria.NEUROGER,
        SYSINT: criteria.SYSINT,
        totalPlaces: totalPlaces // Ajouter totalPlaces
      };
    } else {
      return { ...place, totalPlaces: totalPlaces }; // Ajouter seulement totalPlaces si aucun critère trouvé
    }
  });
}

// Fonction pour sauvegarder les résultats au format JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction pour sauvegarder les résultats au format CSV
function saveToCSV(data, filename) {
  const csvHeaders = 'placeId,studentId,studentName,studentFirstName,NomPlace,Lieu,Domaine,FR,ALL,AIGU,AMBU,MSQ,REHAB,NEUROGER,SYSINT,totalPlaces\n';
  const csvRows = data.map(row =>
    `${row.placeId},${row.studentName},${row.studentId},${row.studentFirstName},${row.NomPlace},${row.Lieu},${row.Domaine},${row.FR},${row.ALL},${row.AIGU},${row.AMBU},${row.MSQ},${row.REHAB},${row.NEUROGER},${row.SYSINT},${row.totalPlaces}`
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Créer une map des critères par place
const placeCriteriaMap = createCriteriaByPlaceMap(stagesData);

// Créer une map des totalPlaces par place
const placeCountMap = createPlaceCountMap(placeCountData);

// Ajouter les critères et le totalPlaces dans `places_assigned.json`
const updatedAssignedPlaces = addCriteriaAndPlaceCountToAssignedPlaces(assignedPlaces, placeCriteriaMap, placeCountMap);

// Sauvegarder les résultats au format JSON et CSV
saveToJson(updatedAssignedPlaces, 'updated_places_assigned_with_criteria_and_count.json');
saveToCSV(updatedAssignedPlaces, 'updated_places_assigned_with_criteria_and_count.csv');
