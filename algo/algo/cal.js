import fs from 'fs';

// Lecture des fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const placesData = JSON.parse(fs.readFileSync('places_pourlese.json', 'utf8'));
const placesDefiniesLeseData = JSON.parse(fs.readFileSync('places_definies_lese.json', 'utf8'));

// Fonction pour recalculer la marge opposée (oppositeMarge) des places après assignation
function recalculateOppositeMarge(placesData, placesDefiniesLeseData) {
  // Créer un objet pour stocker combien de fois chaque place a été prise
  const placeAssignmentsCount = {};

  // Compter combien de fois chaque place a été assignée dans places_definies_lese
  placesDefiniesLeseData.forEach(student => {
    student.uniqueChoices.forEach(choice => {
      if (!placeAssignmentsCount[choice.IDENTIFIANT]) {
        placeAssignmentsCount[choice.IDENTIFIANT] = 0;
      }
      placeAssignmentsCount[choice.IDENTIFIANT]++;
    });
  });

  // Mettre à jour la marge des places en fonction des nouvelles assignations
  const updatedPlaces = placesData.map(place => {
    const assignedCount = placeAssignmentsCount[place.place] || 0;
    const newOppositeMarge = place.studentSelections - assignedCount;

    return {
      ...place,
      assignedCount, // Ajout du nombre d'assignations actuelles
      newOppositeMarge // Nouvelle marge recalculée
    };
  });

  return updatedPlaces;
}

// Fonction pour sauvegarder les données dans un fichier JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Recalculer la marge opposée pour les places après assignation
const updatedPlacesData = recalculateOppositeMarge(placesData, placesDefiniesLeseData);

// Sauvegarder le résultat dans placesorted2.json
saveToJson(updatedPlacesData, 'placesorted2.json');
