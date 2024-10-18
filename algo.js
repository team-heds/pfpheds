import { promises as fs } from 'fs';

// Fonction pour nettoyer les données JSON en ne gardant que l'IDENTIFIANT
function cleanJsonData(data) {
  let cleanedData = {};

  Object.keys(data).forEach(studentId => {
    cleanedData[studentId] = {
      selectedStages: {}
    };

    Object.keys(data[studentId].selectedStages).forEach(choiceKey => {
      const choiceData = data[studentId].selectedStages[choiceKey];
      
      // Garder uniquement le champ IDENTIFIANT
      if (choiceData.IDENTIFIANT) {
        cleanedData[studentId].selectedStages[choiceKey] = {
          IDENTIFIANT: choiceData.IDENTIFIANT
        };
      }
    });
  });

  return cleanedData;
}

// Fonction pour charger, nettoyer, et sauvegarder les données nettoyées
async function cleanLargeJson(inputFilePath, outputFilePath) {
  try {
    // Lire le fichier JSON
    const jsonData = await fs.readFile(inputFilePath, 'utf8');
    
    // Parse le JSON
    const data = JSON.parse(jsonData);

    // Nettoyer les données
    const cleanedData = cleanJsonData(data);

    // Écrire les données nettoyées dans un nouveau fichier
    await fs.writeFile(outputFilePath, JSON.stringify(cleanedData, null, 4), 'utf8');
    console.log(`Données nettoyées sauvegardées dans ${outputFilePath}`);
  } catch (err) {
    console.error('Erreur:', err);
  }
}

// Exemple d'utilisation
cleanLargeJson('votation.json', 'output_cleaned_file.json');

export { cleanLargeJson };
