import fs from 'fs';

// Charger les fichiers JSON
import etudData from './etud.json' assert { type: 'json' };
import outputData from './output_cleaned_file.json' assert { type: 'json' };
import stagesData from './stages_data.json' assert { type: 'json' };

// Tableau des places disponibles
const availableChoices = [
    '0_1',  '3_1', '4_1', '6_1', '9_1', '13_1', '13_1', '13_1', '14_1',
    '15_1', '16_1', '17_1', '18_1', '20_1', '22_1', '26_1', '28_1', '32_1',
    '32_1', '34_1', '35_1', '36_1', '36_1', '37_1', '38_1', '39_1', '40_1',
    '41_1', '41_1', '42_1', '43_1', '44_1', '45_1', '45_1', '49_1',
    '49_1', '49_1', '50_1', '51_1', '52_1', '55_1', '56_1',
   '59_1', '62_1', '63_1',   '78_1', 
    '85_1', '87_1', '89_1', '92_1', '94_1', '95_1', '101_1'
];

// Fonction pour ajouter les critères aux étudiants
function addCriteriaToStudents(outputData, stagesData) {
    Object.keys(outputData).forEach(id => {
        const selectedStages = outputData[id].selectedStages;
        if (selectedStages) {
            Object.keys(selectedStages).forEach(choiceKey => {
                const choice = selectedStages[choiceKey].IDENTIFIANT;

                // Trouver les informations du stage correspondant
                const stageInfo = stagesData.find(stage => stage.IDPlace === choice);

                if (stageInfo) {
                    outputData[id].criteria = {
                        FR: stageInfo.FR,
                        AIGU: stageInfo.AIGU,
                        SYSINT: stageInfo.SYSINT,
                        NEUROGER: stageInfo.NEUROGER,
                        REHAB: stageInfo.REHAB,
                        ALL: stageInfo.ALL,
                        MSQ: stageInfo.MSQ
                    };
                }
            });
        }
    });
}

// Fonction pour créer un fichier places_define.json
function createPlacesDefine(outputData) {
    const placesCount = {};

    // Parcourir chaque identifiant et ses choix dans outputData
    Object.keys(outputData).forEach(id => {
        const selectedStages = outputData[id].selectedStages;
        if (selectedStages) {
            Object.keys(selectedStages).forEach(choiceKey => {
                const choice = selectedStages[choiceKey].IDENTIFIANT;

                // Initialiser la clé si elle n'existe pas dans placesCount
                if (!placesCount[choice]) {
                    placesCount[choice] = {
                        choice1: 0,
                        choice2: 0,
                        choice3: 0,
                        choice4: 0,
                        choice5: 0,
                        total: 0
                    };
                }

                // Incrémenter le nombre d'étudiants pour chaque choix et en total
                placesCount[choice][choiceKey]++;
                placesCount[choice].total++;
            });
        }
    });

    // Écrire les résultats dans un nouveau fichier JSON
    fs.writeFileSync('places_define.json', JSON.stringify(placesCount, null, 2), 'utf8');

    console.log("Le fichier places_define.json a été créé.");
    return placesCount;
}

// Fonction pour créer un fichier places_manquante.json
function createPlacesManquante(placesCount, stagesData) {
    const placesManquante = {};

    availableChoices.forEach(choice => {
        const count = placesCount[choice] ? placesCount[choice].total : 0;

        // Ajouter les places avec 0 étudiant ou les places ayant un seul étudiant apparaissant plusieurs fois
        const occurrencesInAvailable = availableChoices.filter(c => c === choice).length;
        if (count === 0 || (count === 1 && occurrencesInAvailable > 1)) {
            // Trouver les informations du stage dans le fichier stages_data.json
            const stageInfo = stagesData.find(stage => stage.IDPlace === choice);

            if (stageInfo) {
                placesManquante[choice] = {
                    count,
                    occurrencesInAvailable,
                    NomPlace: stageInfo.NomPlace,
                    Lieu: stageInfo.Lieu,
                    Domaine: stageInfo.Domaine,
                    Criteria: {
                        FR: stageInfo.FR,
                        AIGU: stageInfo.AIGU,
                        SYSINT: stageInfo.SYSINT,
                        NEUROGER: stageInfo.NEUROGER,
                        REHAB: stageInfo.REHAB,
                        ALL: stageInfo.ALL,
                        MSQ: stageInfo.MSQ
                    }
                };
            } else {
                placesManquante[choice] = {
                    count,
                    occurrencesInAvailable,
                    NomPlace: "Inconnu",
                    Lieu: "Inconnu",
                    Domaine: "Inconnu",
                    Criteria: {
                        FR: "Inconnu",
                        AIGU: "Inconnu",
                        SYSINT: "Inconnu",
                        NEUROGER: "Inconnu",
                        REHAB: "Inconnu",
                        ALL: "Inconnu",
                        MSQ: "Inconnu"
                    }
                };
            }
        }
    });

    // Écrire les résultats dans un nouveau fichier JSON
    fs.writeFileSync('places_manquante.json', JSON.stringify(placesManquante, null, 2), 'utf8');

    console.log("Le fichier places_manquante.json a été créé avec les informations supplémentaires.");
}

// Fonction pour calculer le nombre d'étudiants ayant validé le plus de critères
function calculateMaxCriteria(outputData) {
    const studentCriteriaCount = {};

    Object.keys(outputData).forEach(id => {
        const criteria = outputData[id].criteria;
        if (criteria) {
            const criteriaKeys = Object.keys(criteria);
            let validCriteriaCount = 0;

            // Compter le nombre de critères valides (true)
            criteriaKeys.forEach(key => {
                if (criteria[key] === "true") {
                    validCriteriaCount++;
                }
            });

            studentCriteriaCount[id] = validCriteriaCount;
        }
    });

    // Trouver l'étudiant ayant validé le plus de critères
    const maxCriteria = Math.max(...Object.values(studentCriteriaCount));
    const studentsWithMaxCriteria = Object.keys(studentCriteriaCount).filter(id => studentCriteriaCount[id] === maxCriteria);

    console.log(`Nombre maximum de critères validés: ${maxCriteria}`);
    console.log(`Étudiants ayant validé le plus de critères: ${studentsWithMaxCriteria.join(', ')}`);
}

// Ajouter les critères aux étudiants
addCriteriaToStudents(outputData, stagesData);

// Créer le fichier places_define.json
const placesCount = createPlacesDefine(outputData);

// Créer le fichier places_manquante.json
createPlacesManquante(placesCount, stagesData);

// Calculer le nombre d'étudiants ayant validé le plus de critères
calculateMaxCriteria(outputData);

// Écrire les nouvelles données dans un fichier JSON
fs.writeFileSync('output_cleaned_file_with_fields.json', JSON.stringify(outputData, null, 2), 'utf8');

console.log("Les champs ont été ajoutés au fichier output_cleaned_file_with_fields.json");
