import { initializeApp } from "firebase/app";
import { getDatabase, ref, update } from "firebase/database";
import fs from 'fs';
import csv from 'csv-parser';

// Initialiser Firebase avec les configurations fournies
const firebaseConfig = {
  apiKey: "AIzaSyDV0Fbiu8ds-WLLG9WrH4eNqTfWLe84_8g",
  authDomain: "pfpheds.firebaseapp.com",
  databaseURL: "https://pfpheds-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pfpheds",
  storageBucket: "pfpheds.appspot.com",
  messagingSenderId: "985064549276",
  appId: "1:985064549276:web:732edc591f04477e8eb659"
};

// Initialiser Firebase App
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fonction pour importer des données depuis un fichier CSV et uploader vers Firebase
function importCsvAndUploadToFirebase(filePath) {

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ';' })) // Spécifiez le séparateur utilisé dans le fichier CSV
    .on('data', (row) => {
      const institutionId = row.ID;
      const dataToUpload = {
        NomChef: row.NomChef,
        MailChef: row.MailChef,
        PhoneChef: row.PhoneChef
      };

      // Uploader chaque ligne dans Firebase Realtime Database
      update(ref(db, `Institutions/${institutionId}`), dataToUpload)
        .then(() => {
          console.log(`Données mises à jour pour ${institutionId}`);
        })
        .catch((error) => {
          console.error(`Erreur lors de l'upload de ${institutionId}: `, error);
        });
    })
    .on('end', () => {
      console.log('CSV importé et upload terminé.');
    });
}

// Exécuter la fonction avec le chemin du fichier CSV
importCsvAndUploadToFirebase('chefp.csv');
