import { createReadStream, writeFileSync } from 'fs';

import { resolve } from 'path';
import csv from 'csv-parser';


// Paths to the CSV files
const institutionDataPath  = resolve('institution_data.csv');
const placeDataPath  = resolve('place_data.csv');
const outputJsonPath = resolve('placetotal.json');

// Read the institution data
function readInstitutionData() {
  return new Promise((resolve, reject) => {
    const institutions = {};
    createReadStream(institutionDataPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        institutions[row.IDENTIFIANT] = row;
      })
      .on('end', () => {
        resolve(institutions);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Read the place data
function readPlaceData() {
  return new Promise((resolve, reject) => {
    const places = [];
    createReadStream(placeDataPath)
      .pipe(csv({ separator: ';' }))
      .on('data', (row) => {
        places.push(row);
      })
      .on('end', () => {
        resolve(places);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}



// Merge data and write to JSON
async function mergeDataAndWriteJson() {
  try {
    const institutions = await readInstitutionData();
    const places = await readPlaceData();
    const mergedData = places.map((place) => {
      const institution = institutions[place.Identifiant];
      return {
        ...place,
 Nom: institution.Nom,
        Lieu: institution.Lieu,
        MSQ: institution.MSQ,
        SYSINT: institution.SYSINT,
        NEUROGER: institution.NEUROGER,
        AIGU: institution.AIGU,
        REHAB: institution.REHAB,
        AMBU: institution.AMBU,
        Langue: institution.Langue,
        FR: FR,
        ALL: ALL      };
    });

    writeFileSync(outputJsonPath, JSON.stringify(mergedData, null, 2), 'utf8');
    console.log('Data merged and written to placetotal.json');
  } catch (error) {
    console.error('Error:', error);
  }
}

mergeDataAndWriteJson();
