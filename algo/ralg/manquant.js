import fs from 'fs';
import path from 'path';

// Lire les fichiers JSON
const updatedDataPath = path.join(process.cwd(), 'updated_data.json');
const updatedPlacesPath = path.join(process.cwd(), 'updated_places_22.json');

// Charger les fichiers JSON
const updatedData = JSON.parse(fs.readFileSync(updatedDataPath, 'utf-8'));
const updatedPlaces = JSON.parse(fs.readFileSync(updatedPlacesPath, 'utf-8'));

// Fonction pour créer le fichier studentsmansqu_ids.txt
function createStudentManquantsList() {
    const result = [];

    // Parcourir chaque étudiant dans updated_data.json
    Object.keys(updatedData).forEach(studentId => {
        let placeFound = false;

        // Vérifier si cet étudiant a une place dans updated_places_22.json
        updatedPlaces.forEach(place => {
            if (place.studentId === studentId) {
                // Si une place correspondante est trouvée, ajouter l'étudiant et l'ID de la place
                result.push(`${studentId} - Place ID: ${place.placeId}`);
                placeFound = true;
            }
        });

        // Si aucune place n'a été trouvée pour cet étudiant, marquer comme manquant
        if (!placeFound) {
            result.push(`${studentId} - manquant`);
        }
    });

    // Générer un fichier texte avec la liste des étudiants et leur place ou 'manquant'
    const outputFilePath = path.join(process.cwd(), 'studentsmansqu_ids.txt');
    fs.writeFileSync(outputFilePath, result.join('\n'), 'utf-8');
    console.log('Le fichier studentsmansqu_ids.txt a été généré avec succès.');
}

// Exécuter la fonction
createStudentManquantsList();
