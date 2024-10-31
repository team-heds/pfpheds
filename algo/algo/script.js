import fs from 'fs';

// Lecture des fichiers JSON
const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const etudData = JSON.parse(fs.readFileSync('etud.json', 'utf8'));
const stagesData = JSON.parse(fs.readFileSync('stages_data.json', 'utf8'));

// Fonction pour trouver les places sélectionnées par un seul étudiant et créer le fichier 'places_final.json'
function createPlacesFinalJson() {
  const allChoicesCount = {}; // Pour stocker le nombre de fois qu'une place a été choisie
  const finalStudents = {}; // Stocker les étudiants avec des choix uniques

  // Première passe pour compter combien de fois chaque place a été sélectionnée
  for (const studentId in studentsData) {
    const selectedStages = studentsData[studentId].selectedStages || {};

    for (let i = 1; i <= 5; i++) {
      const choiceKey = `choice${i}`;
      const stageChoice = selectedStages[choiceKey] || {};

      if (stageChoice.IDENTIFIANT) {
        const placeId = stageChoice.IDENTIFIANT;

        if (!allChoicesCount[placeId]) {
          allChoicesCount[placeId] = 0;
        }

        allChoicesCount[placeId] += 1;
      }
    }
  }

  // Deuxième passe pour trouver les étudiants qui sont les seuls à avoir sélectionné une place
  for (const studentId in studentsData) {
    const studentInfo = studentsData[studentId];
    const selectedStages = studentInfo.selectedStages || {};
    let uniqueChoices = [];

    for (let i = 1; i <= 5; i++) {
      const choiceKey = `choice${i}`;
      const stageChoice = selectedStages[choiceKey] || {};

      if (stageChoice.IDENTIFIANT && allChoicesCount[stageChoice.IDENTIFIANT] === 1) {
        uniqueChoices.push({
          choiceNumber: i,
          Domaine: stageChoice.Domaine || "Unknown",
          Lieu: stageChoice.Lieu || "Unknown",
          IDENTIFIANT: stageChoice.IDENTIFIANT,
          NomP: stageChoice.NomP || "Unknown",
        });
      }
    }

    // Si l'étudiant a au moins un choix unique, on l'ajoute dans la liste finale
    if (uniqueChoices.length > 0) {
      finalStudents[studentId] = {
        id: studentId,
        name: studentInfo.studentName || 'Unknown',
        firstName: studentInfo.studentFirstName || 'Unknown',
        uniqueChoices: uniqueChoices
      };
    }
  }

  // Écriture du fichier JSON 'places_final.json'
  fs.writeFileSync('places_final.json', JSON.stringify(finalStudents, null, 2));
  console.log("Le fichier 'places_final.json' a été créé avec succès.");
}

// Nouvelle fonction pour analyser 'places_final.json' et supprimer les 'choices' dans 'data.json' pour les étudiants ayant un choix unique
function removeChoicesForStudentsInData() {
  const placesFinal = JSON.parse(fs.readFileSync('places_final.json', 'utf8'));

  // Analyse du fichier 'places_final.json' pour trouver les étudiants
  for (const studentId in placesFinal) {
    if (studentsData[studentId]) {
      console.log(`Suppression des choices pour l'étudiant avec ID: ${studentId}`);
      // Supprimer les choices de l'étudiant dans 'data.json'
      delete studentsData[studentId].selectedStages;
    }
  }

  // Écriture du fichier JSON mis à jour 'data.json'
  fs.writeFileSync('data.json', JSON.stringify(studentsData, null, 2));
  console.log("Les 'choices' des étudiants dans 'places_final.json' ont été supprimées de 'data.json'.");
}


// Fonction pour analyser les places et créer le fichier 'places_pourlese.json'
function createPlacesPourLeseJson() {
  const allChoicesCount = {}; // Pour stocker combien de fois chaque place a été sélectionnée
  const placesData = []; // Stocker les informations des places pour le fichier final

  // Première passe : compter combien de fois chaque place a été sélectionnée
  for (const studentId in studentsData) {
    const selectedStages = studentsData[studentId].selectedStages || {};

    for (let i = 1; i <= 5; i++) {
      const choiceKey = `choice${i}`;
      const stageChoice = selectedStages[choiceKey] || {};

      if (stageChoice.IDENTIFIANT) {
        const placeId = stageChoice.IDENTIFIANT;

        if (!allChoicesCount[placeId]) {
          allChoicesCount[placeId] = {
            studentSelections: 0,
            iterations: 0
          };
        }

        allChoicesCount[placeId].studentSelections += 1;
      }
    }
  }

  // Analyse des stages pour ajouter les informations d'itérations et marge des étudiants
  for (const stageId in stagesData) {
    if (allChoicesCount[stageId]) {
      const iteration = stagesData[stageId]?.iterations || 1;
      const totalPlaces = stagesData[stageId]?.totalPlaces || 0;
      const studentMarge = totalPlaces - allChoicesCount[stageId].studentSelections;

      placesData.push({
        place: stageId,
        iteration: iteration,
        studentSelections: allChoicesCount[stageId].studentSelections,
        studentMarge: studentMarge
      });
    }
  }

  // Trier par ordre décroissant des sélections des étudiants
  placesData.sort((a, b) => b.studentSelections - a.studentSelections);

  // Écriture du fichier JSON 'places_pourlese.json'
  fs.writeFileSync('places_pourlese.json', JSON.stringify(placesData, null, 2));
  console.log("Le fichier 'places_pourlese.json' a été créé avec succès.");
}


// Exécution des fonctions
createPlacesFinalJson();
removeChoicesForStudentsInData();
createPlacesPourLeseJson();
