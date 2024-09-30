// Importer les modules nécessaires avec la syntaxe ES module
import fs from 'fs';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';

// Chemin vers les fichiers CSV et JSON
const csvFilePath = 'institonetudiantsX.csv';
const jsonFilePath = 'students.json';

// Charger le JSON existant
let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

// Créer une structure de mapping pour le CSV
let csvData = {};

// Lire et parser le fichier CSV
createReadStream(csvFilePath)
  .pipe(csvParser({ separator: ';' }))
  .on('data', (row) => {
    // Concaténer Institution et secteur dans un seul champ
    csvData[row.ID_Firebase] = `${row.institution} - ${row.secteur}`;
  })
  .on('end', () => {
    console.log('CSV file successfully processed');

    // Parcourir le JSON pour ajouter le champ PFP_1
    for (let key in jsonData) {
      if (csvData[key]) {
        jsonData[key]["PFP_1"] = csvData[key]; // Ajouter le champ PFP_1 avec l'institution et le secteur concaténés
      }
    }

    // Sauvegarder le fichier JSON mis à jour
    fs.writeFileSync('students_news.json', JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('Le fichier JSON a été mis à jour avec le champ PFP_1.');
  });