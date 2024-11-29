import fs from 'fs';
import { Parser } from 'json2csv'; // Utiliser json2csv pour convertir JSON en CSV

// Liste des choix disponibles
const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const stagesData = JSON.parse(fs.readFileSync('stages_data.json', 'utf8'));

// Liste des choix disponibles
const availableChoices = [
  '0_1', '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '14_1', '15_1', '16_1', '17_1', '18_1', '20_1',
  '22_1', '26_1',  '32_1', '32_1', '34_1', '35_1', '36_1', '37_1', '39_1', '40_1', '41_1',
  '41_1', '42_1', '43_1', '44_1', '45_1', '45_1', '49_1', '49_1', '49_1', '50_1', '51_1', '52_1', 
  '55_1', '56_1',  '59_1', '62_1', '63_1', '78_1', '85_1', '87_1', '89_1', '92_1', '94_1', '95_1', '101_1'
];

// Fonction pour calculer les itérations pour chaque place
function calculateIterations(choices) {
  const placeCounts = {};

  choices.forEach((choice) => {
    if (placeCounts[choice]) {
      placeCounts[choice].iteration += 1;
    } else {
      placeCounts[choice] = {
        place: choice,
        iteration: 1,
        studentSelections: 0,
        details: {},
        studentNoAvailable: 0,
        assignedStudents: [] // Liste des étudiants assignés
      };
    }
  });

  return placeCounts;
}

// Fonction pour calculer les choix des étudiants et gérer les places prises
function calculateStudentChoices(studentsData, placeCounts) {
  for (const studentId in studentsData) {
    const student = studentsData[studentId];
    const selectedStages = student.selectedStages;

    let stageAssigned = false;

    for (const choiceKey in selectedStages) {
      const selectedStage = selectedStages[choiceKey];
      const identifiant = selectedStage.IDENTIFIANT;

      if (placeCounts[identifiant]) {
        if (!stageAssigned) {
          placeCounts[identifiant].studentSelections += 1;
          placeCounts[identifiant].taken = (placeCounts[identifiant].taken || 0) + 1;
          placeCounts[identifiant].details = {
            AIGU: selectedStage.AIGU,
            ALL: selectedStage.ALL,
            AMBU: selectedStage.AMBU,
            Domaine: selectedStage.Domaine,
            FR: selectedStage.FR,
            Lieu: selectedStage.Lieu,
            MSQ: selectedStage.MSQ,
            NEUROGER: selectedStage.NEUROGER,
            NomPlace: selectedStage.NomPlace,
            REHAB: selectedStage.REHAB,
            SYSINT: selectedStage.SYSINT
          };

          // Ajouter les informations de l'étudiant
          placeCounts[identifiant].assignedStudents.push({
            studentId,
            studentFirstName: student.studentFirstName,
            studentName: student.studentName
          });

          stageAssigned = true;
        }
      } else {
        placeCounts[identifiant] = {
          place: identifiant,
          iteration: 0,
          studentSelections: 1,
          taken: 1,
          details: {
            AIGU: selectedStage.AIGU,
            ALL: selectedStage.ALL,
            AMBU: selectedStage.AMBU,
            Domaine: selectedStage.Domaine,
            FR: selectedStage.FR,
            Lieu: selectedStage.Lieu,
            MSQ: selectedStage.MSQ,
            NEUROGER: selectedStage.NEUROGER,
            NomPlace: selectedStage.NomPlace,
            REHAB: selectedStage.REHAB,
            SYSINT: selectedStage.SYSINT
          },
          studentNoAvailable: 0,
          assignedStudents: [{ studentId, studentFirstName: student.studentFirstName, studentName: student.studentName }]
        };

        stageAssigned = true;
      }
    }
  }
}

// Fonction pour calculer la marge entre les sélections des étudiants et les itérations
function calculateStudentMarge(placeCounts) {
  for (const place in placeCounts) {
    const placeData = placeCounts[place];
    placeData.studentMarge = placeData.studentSelections - placeData.iteration;
  }
}

// Fonction pour trier les places selon la marge
function sortPlacesByMarge(placeCounts) {
  return Object.values(placeCounts).sort((a, b) => b.studentMarge - a.studentMarge);
}

// Fonction pour compléter les détails manquants avec stages_data.json
function fillMissingDetails(placeCounts, stagesData) {
  stagesData.forEach((stage) => {
    const idPlace = stage.IDPlace;
    if (placeCounts[idPlace] && !placeCounts[idPlace].details.NomPlace) {
      placeCounts[idPlace].details = {
        ...placeCounts[idPlace].details,
        NomPlace: stage.NomPlace,
        Lieu: stage.Lieu,
        Domaine: stage.Domaine,
        FR: stage.FR,
        REHAB: stage.REHAB,
        MSQ: stage.MSQ,
        NEUROGER: stage.NEUROGER,
        AMBU: stage.AMBU,
        ALL: stage.ALL,
        SYSINT: stage.SYSINT
      };
    }
  });
}

// Fonction pour sauvegarder les places attribuées dans un fichier CSV
function saveAssignedPlacesToCSV(placeCounts, filename) {
  const assignedPlaces = [];

  for (const placeId in placeCounts) {
    const place = placeCounts[placeId];

    if (place.taken && place.taken > 0) {
      place.assignedStudents.forEach((student) => {
        assignedPlaces.push({
          place: placeId,
          AIGU: place.details.AIGU,
          ALL: place.details.ALL,
          AMBU: place.details.AMBU,
          Domaine: place.details.Domaine,
          FR: place.details.FR,
          Lieu: place.details.Lieu,
          MSQ: place.details.MSQ,
          NEUROGER: place.details.NEUROGER,
          NomPlace: place.details.NomPlace,
          REHAB: place.details.REHAB,
          SYSINT: place.details.SYSINT,
          studentId: student.studentId,
          studentFirstName: student.studentFirstName,
          studentName: student.studentName,
          studentSelections: place.studentSelections,
          taken: place.taken,
          studentNoAvailable: place.studentNoAvailable
        });
      });
    }
  }

  const fields = [
    'place', 'NomPlace', 'Lieu', 'Domaine', 'AIGU', 'ALL', 'AMBU', 'FR', 'MSQ', 'NEUROGER', 'REHAB', 'SYSINT',
    'studentId', 'studentFirstName', 'studentName', 'studentSelections', 'taken', 'studentNoAvailable'
  ];

  try {
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(assignedPlaces);
    fs.writeFileSync(filename, csv, 'utf8');
    console.log(`Assigned places saved to ${filename}`);
  } catch (err) {
    console.error(err);
  }
}

// Nouvelle fonction pour assigner les étudiants aux places avec une marge de -1 ou -2
function assignStudentsToLowMargePlaces(placeCounts, studentsData) {
  Object.keys(placeCounts).forEach((placeId) => {
    const place = placeCounts[placeId];

    if (place.studentMarge === -1 || place.studentMarge === -2) {
      for (const studentId in studentsData) {
        const student = studentsData[studentId];
        const selectedStages = student.selectedStages;

        let matchingStudent = false;

        for (const choiceKey in selectedStages) {
          const stage = selectedStages[choiceKey];

          if (
            stage.AIGU === false &&
            stage.ALL === false &&
            stage.AMBU === false &&
            stage.Domaine === place.details.Domaine &&
            stage.FR === false &&
            stage.Lieu === place.details.Lieu &&
            stage.MSQ === false &&
            stage.NEUROGER === false &&
            stage.REHAB === false &&
            stage.SYSINT === false
          ) {
            matchingStudent = true;
            break;
          }
        }

        if (matchingStudent) {
          console.log(`Assigning student ${studentId} to place ${placeId}`);
          place.studentSelections += 1;
          place.taken = (place.taken || 0) + 1;
          place.studentMarge += 1;

          if (!place.studentNoAvailable) {
            place.studentNoAvailable = 1;
          } else {
            place.studentNoAvailable += 1;
          }

          // Ajouter les informations de l'étudiant
          place.assignedStudents.push({
            studentId,
            studentFirstName: student.studentFirstName,
            studentName: student.studentName
          });

          break;
        }
      }
    }
  });
}

// Fonction pour générer le fichier JSON de sortie
function exportToJsonFile(data, filename) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonData, 'utf8');
  console.log(`File exported: ${filename}`);
}

// Calculer le nombre d'itérations pour chaque place
const placeCounts = calculateIterations(availableChoices);

// Calculer combien de fois chaque place a été choisie par les étudiants et ajouter les détails des stages
calculateStudentChoices(studentsData, placeCounts);

// Calculer la marge entre sélections des étudiants et itérations
calculateStudentMarge(placeCounts);

// Assigner des étudiants aux places avec une marge de -1 ou -2
assignStudentsToLowMargePlaces(placeCounts, studentsData);

// Compléter les détails manquants avec les données des stages
fillMissingDetails(placeCounts, stagesData);

// Sauvegarder les places attribuées dans place_defin.csv
saveAssignedPlacesToCSV(placeCounts, 'place_defin.csv');

// Exporter les résultats triés dans un fichier JSON
exportToJsonFile(placeCounts, 'places_output_sorted_with_details.json');
