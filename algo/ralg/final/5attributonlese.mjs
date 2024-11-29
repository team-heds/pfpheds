import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// Fichiers d'entrée et de sortie
const studentLeseFile = 'new_student_lese.json';
const placemanquantFile = 'placemanquant-edit.csv';
const outputLesePlacementFile = 'lese_placement.csv';

// Fonction pour lire un fichier CSV et retourner une promesse
function readCsv(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

// Fonction pour charger un fichier JSON
async function loadJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement du fichier JSON:', error);
        throw error;
    }
}

// Fonction pour écrire le fichier CSV des placements
function writeLesePlacementCsv(data) {
    const csvWriter = createObjectCsvWriter({
        path: outputLesePlacementFile,
        header: [
            { id: 'StudentID', title: 'Student ID' },
            { id: 'PlaceID', title: 'Place ID' },
            { id: 'NomPlace', title: 'Nom Place' },
            { id: 'Lieu', title: 'Lieu' },
            { id: 'Domaine', title: 'Domaine' },
            { id: 'MatchedCriteria', title: 'Matched Criteria' }
        ],
    });

    return csvWriter.writeRecords(data)
        .then(() => console.log('Fichier CSV lese_placement.csv généré avec succès !'))
        .catch((error) => console.error('Erreur lors de l\'écriture du fichier CSV:', error));
}

// Fonction principale pour effectuer l'appariement des étudiants et des places
async function main() {
    try {
        // Lire les fichiers JSON et CSV
        const studentLeseData = await loadJsonFile(studentLeseFile);
        let placemanquantData = await readCsv(placemanquantFile);

        // Stocker les résultats des placements
        let placementResults = [];

        // Parcourir chaque étudiant "lesé"
        for (const student of studentLeseData) {
            const studentID = student['Student ID'];
            const zeroCriteria = student['Zero Criteria'].split(',').map(c => c.trim());

            let bestMatch = null;
            let bestMatchCriteriaCount = 0;
            let bestMatchIndex = -1; // Pour garder la trace de l'index de la place utilisée

            // Parcourir chaque place manquante pour trouver la meilleure correspondance
            placemanquantData.forEach((place, index) => {
                const placeID = place['Place ID'];
                const nomPlace = place['Nom Place'];
                const lieu = place['Lieu'];
                const domaine = place['Domaine'];
                const placeCriteria = place['Critères en True'].split(',').map(c => c.trim());

                // Calculer combien de critères manquants de l'étudiant sont couverts par la place
                const matchedCriteria = zeroCriteria.filter(c => placeCriteria.includes(c));

                // Trouver la place avec le plus de critères satisfaits et qui n'a pas encore été assignée
                if (matchedCriteria.length > bestMatchCriteriaCount) {
                    bestMatch = {
                        StudentID: studentID,
                        PlaceID: placeID,
                        NomPlace: nomPlace,
                        Lieu: lieu,
                        Domaine: domaine,
                        MatchedCriteria: matchedCriteria.join(', ')
                    };
                    bestMatchCriteriaCount = matchedCriteria.length;
                    bestMatchIndex = index; // Garder la trace de la place trouvée
                }
            });

            // Si une correspondance a été trouvée, l'ajouter aux résultats et retirer la place assignée
            if (bestMatch) {
                placementResults.push(bestMatch);
                placemanquantData.splice(bestMatchIndex, 1); // Retirer la place assignée pour ne pas la réutiliser
            }
        }

        // Écrire les résultats dans un fichier CSV
        await writeLesePlacementCsv(placementResults);

    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
    }
}

// Exécution du script principal
main();
