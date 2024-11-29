import fs from 'fs';

// Charger les fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('updated_data2.json', 'utf8'));
const assignedPlaces = JSON.parse(fs.readFileSync('updated_places_22.json', 'utf8'));

// Fonction pour compter les places par ID dans `data.json`
function countPlacesById(studentsData) {
  const placeCount = {};

  // Parcourir chaque étudiant dans `data.json`
  for (const studentId in studentsData) {
    const student = studentsData[studentId];
    const selectedStages = student.selectedStages;

    // Parcourir chaque choix de l'étudiant
    for (const choiceKey in selectedStages) {
      const stage = selectedStages[choiceKey];
      const placeId = stage.IDENTIFIANT; // IDPlace au format X_X

      // Initialiser le compteur de place si elle n'existe pas encore
      if (!placeCount[placeId]) {
        placeCount[placeId] = 0;
      }

      // Incrémenter le compteur de places
      placeCount[placeId]++;
    }
  }

  return placeCount;
}

// Fonction pour ajouter le nombre de places dans `places_assigned.json`
function addPlaceCountToAssignedPlaces(assignedPlaces, placeCount) {
  return assignedPlaces.map(place => {
    // Extraire l'IDPlace au format X_X de l'ID `X_X_Y`
    const basePlaceId = place.placeId.split('_').slice(0, 2).join('_');

    // Ajouter le nombre total de places pour cet ID
    const totalPlaces = placeCount[basePlaceId] || 0; // Si aucune place, mettre à 0

    return {
      ...place,
      totalPlaces: totalPlaces // Ajouter l'info de total des places
    };
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
  const csvHeaders = 'placeId,studentName,studentFirstName,studentId,totalPlaces\n';
  const csvRows = data.map(row =>
    `${row.placeId},${row.studentName},${row.studentFirstName},${row.studentId},${row.totalPlaces}` 
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Calculer le nombre de places par IDPlace dans `data.json`
const placeCount = countPlacesById(studentsData);

// Ajouter les informations de nombre de places dans `places_assigned.json`
const updatedAssignedPlaces = addPlaceCountToAssignedPlaces(assignedPlaces, placeCount);

// Sauvegarder les résultats au format JSON et CSV
saveToJson(updatedAssignedPlaces, 'updated_places_22.json');
saveToCSV(updatedAssignedPlaces, 'updated_places_22.csv');
