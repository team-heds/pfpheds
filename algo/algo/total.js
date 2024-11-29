import fs from 'fs';

// Lecture des fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('data_updated.json', 'utf8'));
const placesDefiniesLeseData = JSON.parse(fs.readFileSync('places_definies_lese.json', 'utf8'));

// Fonction pour analyser les étudiants avec des choix disponibles
function analyzeAvailableChoices(studentsData) {
  let totalStudents = 0;
  let studentsWithChoices = 0;
  let studentsWithoutChoices = 0;

  for (const studentId in studentsData) {
    const student = studentsData[studentId];
    totalStudents++;

    // Vérifier si l'étudiant a des choix disponibles dans "selectedStages"
    if (student.selectedStages && Object.keys(student.selectedStages).length > 0) {
      studentsWithChoices++;
    } else {
      studentsWithoutChoices++;
    }
  }

  return {
    totalStudents,
    studentsWithChoices,
    studentsWithoutChoices
  };
}

// Fonction pour analyser les étudiants dans places_definies_lese
function analyzeAssignedStudents(placesDefiniesLeseData) {
  let totalAssigned = 0;
  let assignedByLese = 0;
  let assignedByChoice = 0;

  for (const student of placesDefiniesLeseData) {
    totalAssigned++;
    const uniqueChoices = student.uniqueChoices;

    // Vérifier si le choix est "lesé" ou un choix personnel
    if (uniqueChoices.some(choice => choice.choiceNumber === "lesé")) {
      assignedByLese++;
    } else {
      assignedByChoice++;
    }
  }

  return {
    totalAssigned,
    assignedByLese,
    assignedByChoice
  };
}

// Exécuter l'analyse des choix disponibles
const analysisResultChoices = analyzeAvailableChoices(studentsData);

// Exécuter l'analyse des étudiants assignés dans places_definies_lese
const analysisResultAssigned = analyzeAssignedStudents(placesDefiniesLeseData);

// Afficher le résultat des choix disponibles
console.log('Analyse des étudiants et leurs choix disponibles :');
console.log(`Total d'étudiants : ${analysisResultChoices.totalStudents}`);
console.log(`Étudiants avec des choix disponibles : ${analysisResultChoices.studentsWithChoices}`);
console.log(`Étudiants sans choix disponibles : ${analysisResultChoices.studentsWithoutChoices}`);

// Afficher le résultat des étudiants assignés dans places_definies_lese
console.log('\nAnalyse des étudiants dans places_definies_lese :');
console.log(`Total d'étudiants assignés : ${analysisResultAssigned.totalAssigned}`);
console.log(`Étudiants assignés par "lesé" : ${analysisResultAssigned.assignedByLese}`);
console.log(`Étudiants assignés par leur choix : ${analysisResultAssigned.assignedByChoice}`);
