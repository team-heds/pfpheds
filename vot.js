import fs from 'fs'; // Remplace l'importation des promises ici
import path from 'path';
import csv from 'csv-parser';

// Function to analyze the CSV and find idChoix voted only once
async function findUniqueChoices(csvFilePath) {
    try {
        const choiceCounts = {};

        // Read the CSV file and parse it
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath) // Utilise createReadStream de fs standard
                .pipe(csv())
                .on('data', (row) => {
                    // For each row, count the occurrences of each choice
                    const choices = [row.choice1, row.choice2, row.choice3, row.choice4, row.choice5];
                    choices.forEach(choice => {
                        if (choice) {
                            choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
                        }
                    });
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // Find the choices that were voted only once
        const uniqueChoices = Object.keys(choiceCounts).filter(choice => choiceCounts[choice] === 1);

        // Display the unique choices
        if (uniqueChoices.length > 0) {
            console.log('idChoix voted only once:', uniqueChoices);
        } else {
            console.log('No idChoix was voted only once.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

// Path to the input CSV file
const csvFilePath = path.resolve('listing.csv');

// Call the function to find unique choices
findUniqueChoices(csvFilePath);
