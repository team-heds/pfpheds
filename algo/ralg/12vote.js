import fs from 'fs';

// Charger les fichiers JSON
const updatedData = JSON.parse(fs.readFileSync('updated_data2.json', 'utf8'));
const updatedAssignedPlaces = JSON.parse(fs.readFileSync('updated_places_22.json', 'utf8'));

// Fonction pour assigner un étudiant à la place sélectionnée
function assignStudentToPlace(place, updatedData) {
  const placeBaseId = place.placeId.split('_').slice(0, 2).join('_'); // Extraire seulement les deux premiers segments (XX_X)

  // Rechercher un étudiant qui a sélectionné cette place parmi ses choix
  const choices = Object.entries(updatedData).filter(([studentId, student]) => {
    return Object.values(student.selectedStages).some(stage => stage.IDENTIFIANT === placeBaseId);
  });

  // Si un étudiant a fait ce choix, on l'assigne
  if (choices.length > 0) {
    const [firstChoice] = choices; // On prend le premier étudiant qui a fait ce choix
    const studentId = firstChoice[0]; // ID de l'étudiant
    const studentInfo = firstChoice[1]; // Informations de l'étudiant

    console.log(`Assignation de l'étudiant: ${studentInfo.studentName} ${studentInfo.studentFirstName} pour la place ${place.NomPlace}`);

    // Assigner l'étudiant à la place
    place.studentId = studentId;
    place.studentName = studentInfo.studentName;
    place.studentFirstName = studentInfo.studentFirstName;

    // Supprimer l'étudiant et ses choix de updated_data2.json
    delete updatedData[studentId];

    // Retourner le résultat d'une assignation réussie
    return {
      success: true,
      studentId: studentId,
      studentName: studentInfo.studentName,
      studentFirstName: studentInfo.studentFirstName,
      placeId: place.placeId
    };
  } else {
    console.log(`Aucun étudiant trouvé pour la place ${place.NomPlace} (ID: ${place.placeId})`);
    return { success: false, placeId: place.placeId };
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
  let result; // Variable pour stocker le résultat de l'assignation

  // Boucler sur toutes les places avec totalPlaces = 1
  for (const place of assignedPlaces) {
    if (place.totalPlaces === 2) {
      console.log(`Traitement de la place avec totalPlaces = 1: ${place.placeId}`);
      result = assignStudentToPlace(place, updatedData);

      // Ajouter les résultats pour sauvegarde
      results.push({
        placeId: place.placeId,
        studentId: place.studentId || 'null',
        studentName: place.studentName || 'null',
        studentFirstName: place.studentFirstName || 'null',
        totalPlaces: place.totalPlaces || 'null'
      });

      // Arrêter la boucle après la première assignation
      if (result.success) {
        break;
      }
    }
  }

  // Sauvegarder les résultats dans des fichiers JSON et CSV
  saveToJson(assignedPlaces, 'updated_places_22.json');
  saveToCSV(assignedPlaces, 'updated_places_22.csv');

  // Sauvegarder les modifications dans updated_data2.json
  fs.writeFileSync('updated_data2.json', JSON.stringify(updatedData, null, 2), 'utf8');

  // Retourner le résultat de l'assignation
  return result;
}

// Exécuter le script et afficher le résultat
const finalResult = main();
console.log('Résultat final de l\'assignation :', finalResult);
