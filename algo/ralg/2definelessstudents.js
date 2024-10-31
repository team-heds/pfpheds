import fs from 'fs';

// Constantes des places disponibles avec multiples instances
const availableChoices = [
  '0_1', '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '13_1', '14_1',
  '15_1', '16_1', '17_1', '18_1', '20_1', '22_1', '26_1', '28_1', '32_1',
  '32_1', '34_1', '35_1', '36_1', '36_1', '37_1', '38_1', '39_1', '40_1',
  '41_1', '41_1', '42_1', '43_1', '44_1', '45_1', '45_1', '49_1',
  '49_1', '49_1', '50_1', '51_1', '52_1', '55_1', '56_1',
  '59_1', '62_1', '63_1', '78_1', '85_1', '87_1', '89_1', '92_1',
  '94_1', '95_1', '101_1'
];

// Lecture des fichiers JSON
const assignedData = JSON.parse(fs.readFileSync('assigned.json', 'utf8'));

// Suivre les étudiants déjà assignés
const assignedStudents = new Set();

// Fonction pour vérifier si une place est déjà assignée et retourner les détails de l'étudiant
function getAssignedStudentForPlace(placeId, assignedData) {
  for (const studentId in assignedData) {
    // Si l'étudiant est déjà assigné à une autre place, on l'ignore
    if (assignedStudents.has(studentId)) {
      continue;
    }

    const student = assignedData[studentId];
    for (const choice of student.uniqueChoices) {
      if (choice.IDENTIFIANT === placeId) {
        // Marquer cet étudiant comme assigné
        assignedStudents.add(studentId);
        return {
          studentId: studentId,
          studentName: student.name,
          studentFirstName: student.firstName,
          placeId: choice.IDENTIFIANT,
          assigned: true
        };
      }
    }
  }
  return {
    studentId: null,
    studentName: null,
    studentFirstName: null,
    placeId: placeId,
    assigned: false
  };
}

// Fonction principale pour générer le fichier JSON et CSV
function generateAssignedPlaces(availableChoices, assignedData) {
  const placeAssignments = []; // Stocker les informations des places assignées
  const placeCount = {}; // Compter les itérations de chaque place

  // Fonction pour gérer les multiples instances des places
  function getNextAvailablePlaceId(placeId) {
    if (!placeCount[placeId]) {
      placeCount[placeId] = 1;
    } else {
      placeCount[placeId]++;
    }
    return `${placeId}_${placeCount[placeId]}`; // Générer un ID unique pour chaque itération
  }

  // Parcourir toutes les places disponibles
  availableChoices.forEach((placeId) => {
    // Initialiser les informations de la place
    let placeInfo = {
      placeId: getNextAvailablePlaceId(placeId), // Gérer les itérations multiples
      studentId: 'null', // Par défaut, null
      studentName: 'null', // Par défaut, null
      studentFirstName: 'null', // Par défaut, null
    };

    // Si la place a déjà été assignée à un étudiant dans assignedData
    const assignedInfo = getAssignedStudentForPlace(placeId, assignedData);
    if (assignedInfo.assigned) {
      placeInfo.studentId = assignedInfo.studentId;
      placeInfo.studentName = assignedInfo.studentName;
      placeInfo.studentFirstName = assignedInfo.studentFirstName;
    }

    // Ajouter les informations de la place dans le tableau des assignations
    placeAssignments.push(placeInfo);
  });

  return placeAssignments;
}

// Fonction pour sauvegarder les résultats au format JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction pour sauvegarder les résultats au format CSV
function saveToCSV(data, filename) {
  const csvHeaders = 'placeId,studentId,studentName,studentFirstName\n';
  const csvRows = data.map(row =>
    `${row.placeId},${row.studentId},${row.studentName},${row.studentFirstName}`
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Générer les informations des places assignées
const assignedPlaces = generateAssignedPlaces(availableChoices, assignedData);

// Sauvegarder les résultats au format JSON et CSV
saveToJson(assignedPlaces, 'places_assigned.json');
saveToCSV(assignedPlaces, 'places_assigned.csv');
