import fs from 'fs';

// Lecture des fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const stagesData = JSON.parse(fs.readFileSync('stages_data.json', 'utf8'));

// Fonction pour analyser les choix et assigner un étudiant unique à une place
function analyzeAndAssignUniqueChoices(studentsData) {
  const placeSelections = {}; // Un objet pour compter les sélections de chaque place
  const uniqueAssignments = {}; // Un objet pour stocker les assignations uniques

  // Parcourir les étudiants et leurs choix
  for (const studentId in studentsData) {
    const student = studentsData[studentId];
    const selectedStages = student.selectedStages;

    for (const choiceKey in selectedStages) {
      const selectedStage = selectedStages[choiceKey];
      const placeId = selectedStage.IDENTIFIANT;

      // Si l'identifiant de la place n'existe pas encore, initialiser
      if (!placeSelections[placeId]) {
        placeSelections[placeId] = [];
      }

      // Ajouter l'étudiant à la liste des sélections pour cette place
      placeSelections[placeId].push({
        studentId,
        studentName: student.studentName,
        studentFirstName: student.studentFirstName,
        choiceKey,
        details: selectedStage
      });
    }
  }

  // Rechercher les places ayant un seul étudiant et assigner cet étudiant
  for (const placeId in placeSelections) {
    const selections = placeSelections[placeId];

    if (selections.length === 1) {
      // Si seulement un étudiant a choisi cette place
      const uniqueSelection = selections[0];

      // Ajouter cette assignation au résultat final
      uniqueAssignments[uniqueSelection.studentId] = {
        id: uniqueSelection.studentId,
        name: uniqueSelection.studentName,
        firstName: uniqueSelection.studentFirstName,
        uniqueChoices: [
          {
            choiceNumber: uniqueSelection.choiceKey,
            Domaine: uniqueSelection.details.Domaine,
            Lieu: uniqueSelection.details.Lieu,
            IDENTIFIANT: uniqueSelection.details.IDENTIFIANT,
            NomP: uniqueSelection.details.NomP
          }
        ]
      };
    }
  }

  return uniqueAssignments;
}

// Fonction pour sauvegarder les assignations dans un fichier JSON
function saveToJson(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`Les données ont été sauvegardées dans ${filename}`);
}

// Analyser les choix et assigner les étudiants uniques
const uniqueAssignments = analyzeAndAssignUniqueChoices(studentsData);

// Sauvegarder les résultats dans assigned.json
saveToJson(uniqueAssignments, 'assigned.json');
