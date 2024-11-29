import fs from 'fs';

// Charger les fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('etud.json', 'utf8'));
const assignedPlaces = JSON.parse(fs.readFileSync('updated_places_assigned_with_criteria_and_count.json', 'utf8'));

// Suivre les étudiants déjà assignés
const assignedStudents = new Set();

// Fonction pour compter combien de critères sont à 0 pour un étudiant par rapport aux critères de la place
function countMatchingCriteria(student, place) {
  let matchingCriteria = 0;
  const criteriaKeys = ['AIGU', 'ALL', 'AMBU', 'MSQ', 'REHAB', 'NEUROGER', 'SYSINT', 'FR'];

  criteriaKeys.forEach(key => {
    if (place[key] === 'true' && student[key] === '0') {
      matchingCriteria++;
    }
  });

  return matchingCriteria;
}

// Fonction pour trouver l'étudiant avec le plus de critères correspondant qui n'est pas encore assigné
function findBestMatchingStudent(studentsData, place) {
  let bestStudent = null;
  let bestMatchCount = -1;

  for (const studentId in studentsData) {
    const student = studentsData[studentId];

    // Vérifier si cet étudiant est déjà assigné à une autre place
    if (assignedStudents.has(studentId)) {
      continue; // Passer cet étudiant s'il est déjà assigné
    }

    // Calculer le nombre de critères correspondants pour cet étudiant
    const matchCount = countMatchingCriteria(student, place);

    // Si l'étudiant correspond mieux que le précédent, on le garde en mémoire
    if (matchCount > bestMatchCount) {
      bestStudent = { ...student, studentId };
      bestMatchCount = matchCount;
    }
  }

  return bestStudent;
}

// Fonction pour assigner les étudiants aux places non encore assignées
function assignStudentsToPlaces(assignedPlaces, studentsData) {
  return assignedPlaces.map(place => {
    if (!place.studentId || place.studentId === 'null' && place.totalPlaces === 'null') {
      const bestStudent = findBestMatchingStudent(studentsData, place);

      if (bestStudent) {
        // Ajouter les informations de l'étudiant trouvé à la place
        place.studentId = bestStudent.studentId;
        place.studentName = bestStudent.name;
        place.studentFirstName = bestStudent.firstName;

        // Marquer cet étudiant comme assigné
        assignedStudents.add(bestStudent.studentId);
      }
    }

    return place;
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
    `${row.placeId},${row.studentId || 'null'},${row.studentName || 'null'},${row.studentFirstName || 'null'},${row.NomPlace},${row.Lieu},${row.Domaine},${row.FR},${row.ALL},${row.AIGU},${row.AMBU},${row.MSQ},${row.REHAB},${row.NEUROGER},${row.SYSINT},${row.totalPlaces}`
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction principale
function main() {
  const updatedAssignedPlaces = assignStudentsToPlaces(assignedPlaces, studentsData);

  // Sauvegarder le fichier final avec les étudiants assignés
  saveToJson(updatedAssignedPlaces, 'updateleseplace.json');

  // Sauvegarder les résultats au format CSV
  saveToCSV(updatedAssignedPlaces, 'updateleseplace.csv');
}

// Exécuter le script
main();
