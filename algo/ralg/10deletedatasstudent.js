import fs from 'fs';

// Charger les fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('updated_data2.json', 'utf8'));
const assignedPlaces = JSON.parse(fs.readFileSync('updated_places_22.json', 'utf8'));

// Fonction pour créer un ensemble d'IDs d'étudiants assignés à partir de places_assigned.json
function getAssignedStudentIds(assignedPlaces) {
  const assignedStudentIds = new Set();

  // Parcourir toutes les places assignées
  assignedPlaces.forEach(place => {
    if (place.studentId && place.studentId !== 'null') {
      // Ajouter l'ID de l'étudiant assigné directement dans l'ensemble
      assignedStudentIds.add(place.studentId);
    }
  });

  return assignedStudentIds;
}

// Fonction pour supprimer les étudiants assignés dans data.json
function removeAssignedStudents(studentsData, assignedStudentIds) {
  const updatedStudentsData = { ...studentsData };

  // Supprimer les étudiants qui sont assignés
  assignedStudentIds.forEach(studentId => {
    delete updatedStudentsData[studentId];
  });

  return updatedStudentsData;
}

// Obtenir la liste des étudiants assignés à partir de places_assigned.json
const assignedStudentIds = getAssignedStudentIds(assignedPlaces);

// Supprimer les étudiants assignés de data.json
const updatedStudentsData = removeAssignedStudents(studentsData, assignedStudentIds);

// Sauvegarder les nouvelles données dans un fichier JSON mis à jour
fs.writeFileSync('updated_data2.json', JSON.stringify(updatedStudentsData, null, 2), 'utf8');
console.log(`Les étudiants assignés ont été supprimés et les données mises à jour ont été sauvegardées dans updated_data.json.`);
