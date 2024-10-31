import fs from 'fs';

// Lecture des fichiers JSON
const dataJson = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const placesDefiniesLese = JSON.parse(fs.readFileSync('places_definies_lese.json', 'utf8'));

// Fonction pour supprimer les `choices` des étudiants assignés dans data.json
function removeChoicesForAssignedStudents(dataJson, placesDefiniesLese) {
  placesDefiniesLese.forEach((assignedPlace) => {
    const studentId = assignedPlace.studentId;
    
    if (dataJson[studentId] && dataJson[studentId].selectedStages) {
      console.log(`Suppression des choices pour l'étudiant avec ID: ${studentId}`);
      // Supprimer les informations de choix (choices)
      delete dataJson[studentId].selectedStages;
    }
  });

  return dataJson;
}

// Fonction pour sauvegarder les modifications dans `data.json`
function saveUpdatedDataJson(dataJson, filename) {
  const jsonData = JSON.stringify(dataJson, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les modifications ont été sauvegardées dans ${filename}`);
}

// Supprimer les `choices` pour les étudiants assignés
const updatedDataJson = removeChoicesForAssignedStudents(dataJson, placesDefiniesLese);

// Sauvegarder les résultats dans `data.json`
saveUpdatedDataJson(updatedDataJson, 'data.json');
