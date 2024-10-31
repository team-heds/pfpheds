import fs from 'fs';

// Liste dcoconst fs = require('fs');


// Liste des choix disponibles
const availableChoices = [
    '0_1', '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '13_1', '14_1',
    '15_1', '16_1', '17_1', '18_1', '20_1', '22_1', '26_1', '28_1', '32_1',
    '32_1', '34_1', '35_1', '36_1', '36_1', '37_1', '38_1', '39_1', '40_1',
    '41_1', '41_1', '42_1', '43_1', '44_1', '45_1', '45_1', '49_1',
    '49_1', '49_1', '50_1', '51_1', '52_1', '53_1', '53_1', '55_1', '56_1',
    '57_1', '59_1', '62_1', '63_1', '78_1', '85_1', '87_1', '89_1', '92_1',
    '94_1', '95_1', '101_1'
  ];
  
  // Importer les données des étudiants (data.json)
  const studentsData = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  
  // Fonction pour calculer les itérations pour chaque place
  function calculateIterations(choices) {
    const placeCounts = {};
  
    // Parcourir les choix disponibles et compter les occurrences
    choices.forEach(choice => {
      if (placeCounts[choice]) {
        placeCounts[choice].iteration += 1;
      } else {
        placeCounts[choice] = {
          place: choice,
          iteration: 1,
          studentSelections: 0, // Ajout pour les choix des étudiants
          details: {} // Ajout des détails du stage
        };
      }
    });
  
    return placeCounts;
  }
  
  // Fonction pour calculer les choix des étudiants et ajouter les détails des stages
  function calculateStudentChoices(studentsData, placeCounts) {
    for (const studentId in studentsData) {
      const student = studentsData[studentId];
  
      // Extraire les choix des stages sélectionnés par l'étudiant
      const selectedStages = student.selectedStages;
  
      for (const choiceKey in selectedStages) {
        const selectedStage = selectedStages[choiceKey];
        const identifiant = selectedStage.IDENTIFIANT;
  
        // Vérifier si le stage fait partie des places disponibles
        if (placeCounts[identifiant]) {
          placeCounts[identifiant].studentSelections += 1;
  
          // Ajouter les détails du stage
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
  
        } else {
          // Si le stage n'existe pas dans les choix disponibles, l'ajouter
          placeCounts[identifiant] = {
            place: identifiant,
            iteration: 0, // N'a pas été trouvé dans availableChoices
            studentSelections: 1,
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
            }
          };
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
    const sortedPlaces = Object.values(placeCounts).sort((a, b) => {
      return b.studentMarge - a.studentMarge;
    });
    return sortedPlaces;
  }
  
  // Fonction pour générer le fichier JSON de sortie
  function exportToJsonFile(data, filename) {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonData, 'utf8');
    console.log(`File exported: ${filename}`);
  }
  
  // Calculer le nombre d'itérations pour chaque place dans availableChoices
  const placeCounts = calculateIterations(availableChoices);
  
  // Calculer combien de fois chaque place a été choisie par les étudiants et ajouter les détails des stages
  calculateStudentChoices(studentsData, placeCounts);
  
  // Calculer la marge entre sélections des étudiants et itérations
  calculateStudentMarge(placeCounts);
  
  // Trier les places par marge
  const sortedPlaces = sortPlacesByMarge(placeCounts);
  
  // Exporter les résultats triés dans un fichier JSON
  exportToJsonFile(sortedPlaces, 'places_output_sorted_with_details.json');