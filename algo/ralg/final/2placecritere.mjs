import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// Fichiers utilisés
const placemanquantFile = 'placemanquant.csv';
const stagesDataFile = 'stages_data.json';
const newPlaceFile = 'placemanquant-edit.csv';

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

// Fonction pour charger le fichier JSON
async function loadJsonFile(filePath) {
    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement du fichier JSON:', error);
        throw error;
    }
}

// Fonction pour écrire le nouveau fichier CSV
function writeNewPlaceFile(data) {
    const csvWriter = createObjectCsvWriter({
        path: newPlaceFile,
        header: [
            { id: 'PlaceID', title: 'Place ID' },
            { id: 'NomPlace', title: 'Nom Place' },
            { id: 'Lieu', title: 'Lieu' },
            { id: 'Domaine', title: 'Domaine' },
            { id: 'CritèresTrue', title: 'Critères en True' }
        ],
    });

    return csvWriter.writeRecords(data)
        .then(() => console.log('Fichier CSV placemanquant-edit.csv généré avec succès !'))
        .catch((error) => console.error('Erreur lors de l\'écriture du fichier CSV:', error));
}

// Fonction principale
async function main() {
    try {
        // Lire les fichiers placemanquant.csv et stages_data.json
        const placemanquantData = await readCsv(placemanquantFile);
        const stagesData = await loadJsonFile(stagesDataFile);

        // Extraire les places manquantes et leurs critères
        const result = placemanquantData.map(placeRow => {
            const placeID = placeRow['Place ID'];

            // Trouver la correspondance dans le fichier JSON
            const stage = stagesData.find(stage => stage.IDPlace === placeID);

            if (stage) {
                // Extraire les critères en "true"
                const criteresTrue = Object.keys(stage)
                    .filter(key => stage[key] === 'true')
                    .filter(key => ['FR', 'REHAB', 'MSQ', 'NEUROGER', 'AMBU', 'ALL', 'SYSINT'].includes(key));

                return {
                    PlaceID: stage.IDPlace,
                    NomPlace: stage.NomPlace,
                    Lieu: stage.Lieu,
                    Domaine: stage.Domaine,
                    CritèresTrue: criteresTrue.join(', ')
                };
            } else {
                // Si aucune correspondance trouvée
                return {
                    PlaceID: placeID,
                    NomPlace: 'Non trouvé',
                    Lieu: 'Non trouvé',
                    Domaine: 'Non trouvé',
                    CritèresTrue: ''
                };
            }
        });

        // Écrire les données dans un nouveau fichier CSV
        await writeNewPlaceFile(result);
    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
    }
}

// Exécution du script principal
main();
