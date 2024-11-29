import { promises as fs } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

// Fonction pour charger le fichier JSON
async function loadJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lors du chargement du fichier JSON:', error);
        throw error;
    }
}

// Liste des stages disponibles avec des doublons
let choices = ['0_1', '2_1', '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '13_1', '14_1', '15_1', '16_1', '17_1', '18_1', '20_1', '22_1', '26_1', '28_1', '32_1', '32_1', '34_1', '35_1', '36_1', '36_1', '37_1', '38_1', '39_1', '40_1', '41_1', '41_1', '42_1', '43_1', '44_1', '44_2', '45_1', '45_2', '49_1', '49_2', '49_3', '50_1', '51_1', '52_1', '53_1', '53_1', '55_1', '56_1', '57_1', '59_1', '62_1', '63_1', '64_1', '65_1', '74_1', '78_1', '83_1', '85_1', '87_1', '89_1', '91_1', '92_1', '94_1', '95_1', '101_1'];

// Fonction pour compter les occurrences de chaque stage
function countChoices(choices) {
    const count = {};
    choices.forEach(choice => {
        count[choice] = (count[choice] || 0) + 1;
    });
    return count;
}

// Fonction pour assigner les stages
function assignStages(data, choices) {
    let choiceCount = countChoices(choices); // Suivi du nombre d'occurrences de chaque choix
    let assignedChoices = {}; // Suivi des attributions
    let results = [];
    let studentsLese = []; // Liste des étudiants lesé
    let remainingChoices = {...choiceCount}; // Clone du nombre d'occurrences de chaque place

    // Itérer sur tous les étudiants pour chaque priorité (1er choix, 2e choix, etc.)
    for (let priority = 1; priority <= 5; priority++) {
        for (const id in data) {
            let result = results.find(r => r.id === id); // Vérifier si l'étudiant a déjà été traité
            if (result && result.assignedStage !== '') continue; // Si déjà attribué, passer

            if (!result) {
                result = { id: id, assignedStage: '', assignedChoiceRank: '' };
                results.push(result);
            }

            const studentStages = data[id].selectedStages || {}; // Assurer que selectedStages existe
            const choiceKey = `choice${priority}`;
            const stage = studentStages[choiceKey]; // Assurer que le choix existe

            if (stage && stage.IDENTIFIANT && remainingChoices[stage.IDENTIFIANT] > 0) {
                // Tenter d'attribuer le stage préféré si disponible
                assignedChoices[stage.IDENTIFIANT] = (assignedChoices[stage.IDENTIFIANT] || 0) + 1;
                remainingChoices[stage.IDENTIFIANT]--; // Réduire le nombre de fois où la place est disponible

                result.assignedStage = stage.IDENTIFIANT;
                result.assignedChoiceRank = priority;
            }
        }
    }

    // Marquer ceux qui n'ont pas reçu de stage comme "lesé" et collecter les critères à 0
    results.forEach(result => {
        if (!result.assignedStage) {
            result.assignedStage = 'lesé';
            result.assignedChoiceRank = 'none';

            // Récupérer les critères qui sont à "0" pour cet étudiant
            let studentData = data[result.id];
            let zeroCriteria = [];
            let criteriaKeys = ["AIGU", "ALL", "AMBU", "MSQ", "NEUROGER", "REHAB", "SYSINT", "FR"];
            criteriaKeys.forEach(key => {
                if (studentData?.[key] === "0" || studentData?.[key] === false) {
                    zeroCriteria.push(key);
                }
            });

            // Ajouter à la liste des "lesé" avec leurs critères à "0"
            studentsLese.push({ id: result.id, zeroCriteria: zeroCriteria.join(', ') });
        }
    });

    // Préparation des places non assignées pour placemanquant.csv
    let placemanquant = [];
    for (const placeId in remainingChoices) {
        let remainingCount = remainingChoices[placeId];
        while (remainingCount > 0) {
            placemanquant.push({ id: placeId });
            remainingCount--;
        }
    }

    return { results, studentsLese, placemanquant };
}

// Fonction pour transformer les résultats en CSV
function exportToCsv(finalResults, studentsLese, placemanquant) {
    // Création du fichier principal des attributions
    const csvWriter = createObjectCsvWriter({
        path: 'xxy.csv',
        header: [
            { id: 'id', title: 'ID' },
            { id: 'assignedStage', title: 'Assigned Stage' },
            { id: 'assignedChoiceRank', title: 'Assigned Choice Rank' } // Nouvelle colonne pour le rang du choix
        ]
    });

    // Préparation des données pour le CSV principal
    let records = finalResults.map(result => ({
        id: result.id,
        assignedStage: result.assignedStage,
        assignedChoiceRank: result.assignedChoiceRank
    }));

    // Écriture du fichier CSV principal
    csvWriter.writeRecords(records)
        .then(() => {
            console.log('Fichier CSV des résultats généré avec succès!');
        });

    // Création du fichier des étudiants "lesé"
    const studentLeseWriter = createObjectCsvWriter({
        path: 'student_lese.csv',
        header: [
            { id: 'id', title: 'Student ID' },
            { id: 'zeroCriteria', title: 'Zero Criteria' }
        ]
    });

    // Écriture du fichier CSV des étudiants "lesé" avec critères à 0
    studentLeseWriter.writeRecords(studentsLese)
        .then(() => {
            console.log('Fichier CSV des étudiants lesé généré avec succès!');
        });

    // Création du fichier des places manquantes
    const placeManquantWriter = createObjectCsvWriter({
        path: 'xx.csv',
        header: [
            { id: 'id', title: 'Place ID' }
        ]
    });

    // Écriture du fichier CSV des places manquantes
    let placeRecords = Array.from(placemanquant).map(choice => ({
        id: choice.id
    }));

    placeManquantWriter.writeRecords(placeRecords)
        .then(() => {
            console.log('Fichier CSV des places manquantes généré avec succès!');
        });
}

// Fonction principale
async function main() {
    try {
        const etudData = await loadJsonFile('etud.json'); // Charger le fichier etud.json
        let { results: finalResults, studentsLese, placemanquant } = assignStages(etudData, choices);
        exportToCsv(finalResults, studentsLese, placemanquant);
    } catch (error) {
        console.error('Erreur lors de l\'exécution du script:', error);
    }
}

// Appel de la fonction principale
main();
