import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// Fichiers utilisés
const updatedDataFile = 'updated_data.json';
const stagesFile = 'stages_data.json';
const lesePlacementFile = 'lese_placement.csv';
const outputCsvFile = 'output.csv';
const newOutputCsvFile = 'updated_output_with_names_and_stages.csv';

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

// Fonction pour écrire le fichier CSV mis à jour
function writeUpdatedCsv(data) {
    const csvWriter = createObjectCsvWriter({
        path: newOutputCsvFile,
        header: [
            { id: 'ID', title: 'ID' },
            { id: 'Assigned Stage', title: 'Assigned Stage' },
            { id: 'Assigned Choice Rank', title: 'Assigned Choice Rank' },
            { id: 'Nom', title: 'Nom' },
            { id: 'Prénom', title: 'Prénom' },
            { id: 'NomLieu', title: 'Nom du lieu' },
            { id: 'Lieu', title: 'Lieu' },
            { id: 'Domaine', title: 'Domaine' },
            { id: 'MatchedCriteria', title: 'Matched Criteria' }
        ],
    });

    return csvWriter.writeRecords(data)
        .then(() => console.log('Fichier CSV mis à jour généré avec succès !'))
        .catch((error) => console.error('Erreur lors de l\'écriture du fichier CSV:', error));
}

// Fonction principale
async function main() {
    try {
        // Charger les fichiers JSON et CSV
        const updatedData = await loadJsonFile(updatedDataFile);
        const stagesData = await loadJsonFile(stagesFile);
        const outputData = await readCsv(outputCsvFile);
        const lesePlacementData = await readCsv(lesePlacementFile);

        // Ajouter les noms, prénoms, et nom de lieu correspondants à chaque ligne de output.csv
        const updatedOutputData = outputData.map(row => {
            const studentId = row['ID'];
            const assignedStageId = row['Assigned Stage'];

            // Chercher les informations de l'étudiant dans updated_data.json
            const studentData = updatedData[studentId];
            const studentFirstName = studentData ? studentData.studentFirstName : 'Non trouvé';
            const studentName = studentData ? studentData.studentName : 'Non trouvé';

            // Chercher les informations de stage dans stages_data.json
            const stage = stagesData.find(stage => stage.IDPlace === assignedStageId);

            // Chercher dans lese_placement.csv si l'étudiant est "lesé"
            let leseInfo = lesePlacementData.find(leseRow => leseRow['Student ID'] === studentId);

            // Si "lesé", mettre à jour les informations depuis lese_placement.csv
            if (row['Assigned Stage'] === 'lesé' && leseInfo) {
                return {
                    ID: studentId,
                    'Assigned Stage': leseInfo['Place ID'],
                    'Assigned Choice Rank': 'none',
                    Nom: studentName,
                    Prénom: studentFirstName,
                    NomLieu: leseInfo['Nom Place'],
                    Lieu: leseInfo['Lieu'],
                    Domaine: leseInfo['Domaine'],
                    MatchedCriteria: leseInfo['Matched Criteria']
                };
            }

            // Si le stage n'est pas "lesé", récupérer les informations du stage depuis stages_data.json
            return {
                ID: studentId,
                'Assigned Stage': assignedStageId,
                'Assigned Choice Rank': row['Assigned Choice Rank'],
                Nom: studentName,
                Prénom: studentFirstName,
                NomLieu: stage ? stage.NomPlace : 'Lieu non trouvé',
                Lieu: stage ? stage.Lieu : 'Lieu non trouvé',
                Domaine: stage ? stage.Domaine : 'Domaine non trouvé',
                MatchedCriteria: '' // Aucun critère pour les non-lesé
            };
        });

        // Écrire les données mises à jour dans un nouveau fichier CSV
        await writeUpdatedCsv(updatedOutputData);

    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
    }
}

// Exécution du script principal
main();
