import fs from 'fs';
import csvParser from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const outputFile = 'output.csv';
const studentLeseFile = 'student_lese.csv';
const newLeseFile = 'new_student_lese.csv';

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

// Fonction pour écrire le fichier CSV
function writeNewLeseFileCsv(data) {
    const csvWriter = createObjectCsvWriter({
        path: newLeseFile,
        header: [
            { id: 'StudentID', title: 'Student ID' },
            { id: 'ZeroCriteria', title: 'Zero Criteria' },
        ],
    });

    return csvWriter.writeRecords(data)
        .then(() => console.log('Fichier CSV des étudiants "lesé" a été généré avec succès !'))
        .catch((error) => console.error('Erreur lors de l\'écriture du fichier CSV:', error));
}

// Fonction pour écrire en JSON
function writeNewLeseFileJson(data) {
    const jsonFile = 'new_student_lese.json';
    fs.writeFile(jsonFile, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture du fichier JSON:', err);
        } else {
            console.log('Fichier JSON des étudiants "lesé" a été généré avec succès !');
        }
    });
}

// Fonction principale
async function main() {
    try {
        // Lire les fichiers output.csv et student_lese.csv
        const outputData = await readCsv(outputFile);
        const studentLeseData = await readCsv(studentLeseFile);

        // Extraire les étudiants "lesé" depuis output.csv
        const leseStudents = outputData
            .filter((row) => row['Assigned Stage'] === 'lesé')  // Filtrer ceux qui sont "lesé"
            .map((row) => row['ID'])
            .filter(Boolean);  // Supprimer les valeurs vides

        // Filtrer les informations dans student_lese.csv pour les étudiants "lesé"
        const filteredLeseData = studentLeseData.filter((row) =>
            leseStudents.includes(row['Student ID']) // Ne garder que les étudiants "lesé"
        );

        // Vérifier si les données sont correctes
        if (filteredLeseData.length > 0) {
            // Ecrire les données dans le fichier CSV ou JSON
            await writeNewLeseFileCsv(filteredLeseData);  // Écriture en CSV
            writeNewLeseFileJson(filteredLeseData);  // Écriture en JSON
        } else {
            console.log('Aucun étudiant "lesé" trouvé dans les données.');
        }
    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
    }
}

// Exécution du script principal
main();
