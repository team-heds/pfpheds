import fs from 'fs';

// Charger les fichiers JSON
const updatedData = JSON.parse(fs.readFileSync('updated_data2.json', 'utf8'));
const updatedAssignedPlaces = JSON.parse(fs.readFileSync('updated_places_22.json', 'utf8'));

// Fonction pour assigner un étudiant à la place sélectionnée
function assignStudentToPlace(place, updatedData, isRandom = false) {
  const placeBaseId = place.placeId.split('_').slice(0, 2).join('_'); // Extraire seulement les deux premiers segments (XX_X)

  let choices;

  if (isRandom) {
    // Prendre tous les étudiants disponibles pour une assignation aléatoire
    choices = Object.entries(updatedData);
  } else {
    // Rechercher un étudiant qui a sélectionné cette place parmi ses choix
    choices = Object.entries(updatedData).filter(([studentId, student]) => {
      return Object.values(student.selectedStages).some(stage => stage.IDENTIFIANT === placeBaseId);
    });
  }

  // Si des étudiants sont trouvés, on en assigne un
  if (choices.length > 0) {
    const randomIndex = Math.floor(Math.random() * choices.length);
    const [selectedStudentId, studentInfo] = choices[randomIndex];

    console.log(`Assignation de l'étudiant: ${studentInfo.studentName} ${studentInfo.studentFirstName} pour la place ${place.NomPlace}`);

    // Assigner l'étudiant à la place
    place.studentId = selectedStudentId;
    place.studentName = studentInfo.studentName;
    place.studentFirstName = studentInfo.studentFirstName;

    // Supprimer l'étudiant et ses choix de updated_data2.json
    delete updatedData[selectedStudentId];
  } else {
    console.log(`Aucun étudiant trouvé pour la place ${place.NomPlace} (ID: ${place.placeId})`);
  }
}

// Fonction pour sauvegarder les résultats au format JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction pour sauvegarder les résultats au format CSV
function saveToCSV(data, filename) {
  const csvHeaders = 'placeId,studentId,studentName,studentFirstName,totalPlaces\n';
  const csvRows = data.map(row =>
    `${row.placeId},${row.studentId || 'null'},${row.studentName || 'null'},${row.studentFirstName || 'null'},${row.totalPlaces || 'null'}`
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction principale
function main() {
  let assignedPlaces = [...updatedAssignedPlaces]; // Copier la liste des places assignées
  const results = []; // Stocker les résultats des assignations

  // Boucler sur toutes les places
  assignedPlaces.forEach(place => {
    if (!place.studentId) { // Si la place n'a pas encore d'étudiant assigné
      if (place.totalPlaces === 1) {
        console.log(`Traitement de la place avec totalPlaces = 1: ${place.placeId}`);
        assignStudentToPlace(place, updatedData); // Assignation normale

      } else if (place.totalPlaces === 0) {
        console.log(`Traitement de la place avec totalPlaces = 0: ${place.placeId}`);
        assignStudentToPlace(place, updatedData, true); // Assignation aléatoire
      }

      // Ajouter les résultats pour sauvegarde
      results.push({
        placeId: place.placeId,
        studentId: place.studentId || 'null',
        studentName: place.studentName || 'null',
        studentFirstName: place.studentFirstName || 'null',
        totalPlaces: place.totalPlaces || 'null'
      });
    }
  });

  // Sauvegarder les résultats dans des fichiers JSON et CSV
  saveToJson(assignedPlaces, 'updated_places_22.json');
  saveToCSV(assignedPlaces, 'updated_places_22.csv');

  // Sauvegarder les modifications dans updated_data2.json
  fs.writeFileSync('updated_data2.json', JSON.stringify(updatedData, null, 2), 'utf8');
}

// Exécuter le script
main();
