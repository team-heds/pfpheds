import fs from 'fs';

// Lecture des fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const criteriaData = JSON.parse(fs.readFileSync('etud.json', 'utf8'));
const placesData = JSON.parse(fs.readFileSync('places_pourlese.json', 'utf8'));

// Vérification du fichier assignedData
let assignedData;
try {
  assignedData = JSON.parse(fs.readFileSync('places_final.json', 'utf8'));
  if (typeof assignedData !== 'object') {
    assignedData = {}; // Si ce n'est pas un objet, on initialise un objet vide
  }
} catch (error) {
  console.error("Erreur lors de la lecture de 'places_final.json', utilisation d'un objet vide par défaut.");
  assignedData = {}; // Si le fichier n'est pas trouvé ou est mal formaté, on initialise un objet vide
}

// Fonction pour vérifier si un étudiant est déjà assigné dans `places_final.json`
function isStudentAlreadyAssigned(studentId, assignedData) {
  return assignedData.hasOwnProperty(studentId); // Vérifie si l'étudiant existe déjà dans assignedData
}

// Fonction pour transformer les nouvelles assignations au format souhaité
function formatAssignedStudentToPlace(assignedStudents, studentsData) {
  return assignedStudents.map(assignment => {
    const student = studentsData[assignment.studentId];
    return {
      id: assignment.studentId,
      name: student.studentName,
      firstName: student.studentFirstName,
      uniqueChoices: [
        {
          choiceNumber: "lesé",  // Indique que c'est un stage attribué automatiquement
          Domaine: assignment.placeDetails.Domaine,
          Lieu: assignment.placeDetails.Lieu,
          IDENTIFIANT: assignment.placeId,
          NomP: assignment.placeDetails.NomPlace
        }
      ]
    };
  });
}

// Fonction pour compter combien de critères passeront de 0 à 1 après l'assignation
function countCriteriaToChangeToOne(studentCriteria, placeDetails) {
  let count = 0;
  if (studentCriteria.AIGU === "0" && placeDetails.AIGU) count++;
  if (studentCriteria.ALL === "0" && placeDetails.ALL) count++;
  if (studentCriteria.AMBU === "0" && placeDetails.AMBU) count++;
  if (studentCriteria.MSQ === "0" && placeDetails.MSQ) count++;
  if (studentCriteria.NEUROGER === "0" && placeDetails.NEUROGER) count++;
  if (studentCriteria.REHAB === "0" && placeDetails.REHAB) count++;
  if (studentCriteria.SYSINT === "0" && placeDetails.SYSINT) count++;
  return count;
}

// Fonction pour assigner les étudiants de manière optimisée aux places
function assignOptimizedStudentsToPlaces(studentsData, criteriaData, placesWithNegativeMarge, assignedData) {
  const assignedStudents = []; // Les nouvelles assignations
  const assignedStudentIds = new Set(Object.keys(assignedData)); // Étudiants déjà assignés dans `places_final.json`

  for (const place of placesWithNegativeMarge) {
    let candidates = [];

    // Recherche de tous les étudiants potentiels pour cette place
    for (const studentId in studentsData) {
      const student = studentsData[studentId];
      const studentCriteria = criteriaData[studentId]; // Critères de l'étudiant

      // Vérifier si l'étudiant n'a pas encore été assigné à une place
      if (!assignedStudentIds.has(studentId)) {
        const criteriaToChangeToOne = countCriteriaToChangeToOne(studentCriteria, place.details);

        // Ajouter l'étudiant à la liste des candidats si le nombre de critères modifiés est supérieur ou égal à 2
        if (criteriaToChangeToOne >= 2) {
          candidates.push({
            studentId,
            criteriaToChangeToOne
          });
        }
      }
    }

    // Trier les candidats pour cette place selon le nombre de critères modifiés
    candidates.sort((a, b) => b.criteriaToChangeToOne - a.criteriaToChangeToOne);

    // Assigner les étudiants nécessaires, en fonction des places disponibles
    for (let i = 0; i < place.iteration && candidates.length > 0; i++) {
      const bestCandidate = candidates.shift();

      assignedStudents.push({
        studentId: bestCandidate.studentId,
        placeId: place.place,
        criteriaToChangeToOne: bestCandidate.criteriaToChangeToOne,
        placeDetails: place.details
      });

      assignedStudentIds.add(bestCandidate.studentId);  // Marquer l'étudiant comme assigné
    }
  }

  return assignedStudents;
}

// Fonction pour sauvegarder les données dans un fichier JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Fonction pour transformer les données au format CSV
function saveToCSV(data, filename) {
  const csvHeaders = 'id,name,firstName,choiceNumber,Domaine,Lieu,IDENTIFIANT,NomP\n';
  const csvRows = data.flatMap(student => 
    student.uniqueChoices.map(choice => 
      `${student.id},${student.name},${student.firstName},${choice.choiceNumber},${choice.Domaine},${choice.Lieu},${choice.IDENTIFIANT},${choice.NomP}`
    )
  );
  const csvContent = csvHeaders + csvRows.join('\n');
  fs.writeFileSync(filename, csvContent, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Récupérer les places avec une marge négative
const placesWithNegativeMarge = placesData.filter(place => place.oppositeMarge < 0);

// Assigner des étudiants de manière optimisée aux places
const newAssignedStudents = assignOptimizedStudentsToPlaces(studentsData, criteriaData, placesWithNegativeMarge, assignedData);

// Transformer les nouvelles assignations au format des anciennes
const newAssignedFormatted = formatAssignedStudentToPlace(newAssignedStudents, studentsData);

// Charger les assignations déjà existantes dans `places_final.json` et les formater
const existingAssigned = Object.values(assignedData).map(assignment => ({
  id: assignment.id,
  name: assignment.name,
  firstName: assignment.firstName,
  uniqueChoices: assignment.uniqueChoices
}));

// Fusionner les anciens et nouveaux assignés
const updatedAssigned = [...existingAssigned, ...newAssignedFormatted];

// Sauvegarder les données au format JSON
saveToJson(updatedAssigned, 'places_definies_lese.json');

// Sauvegarder les données au format CSV
saveToCSV(updatedAssigned, 'places_definies_lese.csv');
