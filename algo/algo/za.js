import fs from 'fs';

// Charger les fichiers JSON
const studentsFinalData = JSON.parse(fs.readFileSync('places_final.json', 'utf8'));
const leseAssignedData = JSON.parse(fs.readFileSync('places_definies_lese.json', 'utf8'));

// Fonction pour ajouter les places définies à `places_final.json`
function mergeLeseAssignments(studentsFinalData, leseAssignedData) {
  leseAssignedData.forEach(assignment => {
    const studentId = assignment.id;

    const studentData = {
      id: studentId,
      name: assignment.name,
      firstName: assignment.firstName,
      uniqueChoices: assignment.uniqueChoices.map(choice => ({
        choiceNumber: choice.choiceNumber || 'lesé', // On définit le numéro de choix à "lesé"
        Domaine: choice.Domaine,
        Lieu: choice.Lieu,
        IDENTIFIANT: choice.IDENTIFIANT,
        NomP: choice.NomP
      }))
    };

    // Vérifier si l'étudiant est déjà dans `places_final.json`
    if (studentsFinalData[studentId]) {
      // Ajouter les choix "lesé" à `uniqueChoices` s'il y a déjà des choix pour l'étudiant
      studentsFinalData[studentId].uniqueChoices.push(...studentData.uniqueChoices);
    } else {
      // Ajouter un nouvel étudiant avec ses choix "lesé"
      studentsFinalData[studentId] = studentData;
    }
  });

  return studentsFinalData;
}

// Fusionner les assignations de `places_definies_lese.json` dans `places_final.json`
const updatedStudentsFinalData = mergeLeseAssignments(studentsFinalData, leseAssignedData);

// Sauvegarder le fichier `places_final.json` avec les nouvelles données fusionnées
fs.writeFileSync('places_final_updated.json', JSON.stringify(updatedStudentsFinalData, null, 2), 'utf8');
console.log('Les assignations "lesé" ont été fusionnées dans places_final_updated.json');
