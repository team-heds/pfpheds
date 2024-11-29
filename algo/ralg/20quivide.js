import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter as csvWriter } from 'csv-writer';

// Lire les fichiers JSON
const updatedDataPath = path.join(process.cwd(), 'updated_data.json');
const updatedPlacesPath = path.join(process.cwd(), 'updated_places_22.json');
const updatelesePlacesPath = path.join(process.cwd(), 'updateleseplace.json');

// Charger les fichiers JSON
const updatedData = JSON.parse(fs.readFileSync(updatedDataPath, 'utf-8'));
const updatedPlaces = JSON.parse(fs.readFileSync(updatedPlacesPath, 'utf-8'));
const updatelesePlaces = JSON.parse(fs.readFileSync(updatelesePlacesPath, 'utf-8'));

// Fonction pour mettre à jour les places avec les informations des étudiants placés
function updatePlacesWithStudents() {
    // Parcourir chaque étudiant dans updated_data.json
    Object.keys(updatedData).forEach(studentId => {
        const studentData = updatedData[studentId];
        const selectedStages = studentData.selectedStages;

        // Vérifier si l'étudiant a des choix de stages
        if (selectedStages) {
            // Parcourir chaque choix de stage (choice1, choice2, etc.)
            Object.keys(selectedStages).forEach(choiceKey => {
                const stageData = selectedStages[choiceKey];

                // Trouver la place correspondante dans updated_places_22.json
                const matchingPlace = updatedPlaces.find(place => 
                    place.NomPlace === stageData.NomPlace &&
                    place.studentId === "null" // Place encore disponible
                );

                // Si une place correspondante est trouvée et qu'elle est encore disponible
                if (matchingPlace) {
                    // Mettre à jour les informations dans updateleseplaces.json
                    const placeToUpdate = updatelesePlaces.find(place => 
                        place.NomPlace === matchingPlace.NomPlace &&
                        place.placeId === matchingPlace.placeId
                    );

                    if (placeToUpdate) {
                        // Mettre à jour les informations de la place avec les données de l'étudiant
                        placeToUpdate.studentId = studentId;
                        placeToUpdate.studentName = studentData.studentName;
                        placeToUpdate.studentFirstName = studentData.studentFirstName;
                    }
                }
            });
        }
    });

    // Générer le fichier CSV avec les résultats
    const csvPath = path.join(process.cwd(), 'updated_places_with_students.csv');
    const writer = csvWriter({
        path: csvPath,
        header: [
            { id: 'placeId', title: 'Place ID' },
            { id: 'studentId', title: 'Student ID' },
            { id: 'studentName', title: 'Student Name' },
            { id: 'studentFirstName', title: 'Student First Name' },
            { id: 'NomPlace', title: 'Place Name' },
            { id: 'Domaine', title: 'Domain' },
            { id: 'Lieu', title: 'Location' },
            { id: 'totalPlaces', title: 'Total Places' }
        ]
    });

    writer.writeRecords(updatelesePlaces)
        .then(() => {
            console.log('Le fichier CSV a été écrit avec succès.');
        })
        .catch(err => {
            console.error('Erreur lors de l\'écriture du fichier CSV:', err);
        });

    // Écrire également le fichier JSON mis à jour
    const updatedPlacesWithStudentsPath = path.join(process.cwd(), 'updated_places_with_students.json');
    fs.writeFileSync(updatedPlacesWithStudentsPath, JSON.stringify(updatelesePlaces, null, 2), 'utf-8');
    console.log('Le fichier updated_places_with_students.json a été généré avec succès.');
}

// Exécuter la fonction
updatePlacesWithStudents();
