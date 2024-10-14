import { promises as fs } from 'fs';
import path from 'path';

// Function to convert JSON to CSV
async function jsonToCsv(inputFilePath, outputFilePath) {
    try {
        // Read the JSON file
        const data = await fs.readFile(inputFilePath, 'utf-8');
        const jsonData = JSON.parse(data);

        // Prepare the CSV rows, including the header
        const csvRows = [['ID', 'choice1', 'choice2', 'choice3', 'choice4', 'choice5']];

        // Extract data from JSON
        for (const [key, value] of Object.entries(jsonData)) {
            const row = [
                key,
                value.selectedStages.choice1.IDENTIFIANT,
                value.selectedStages.choice2.IDENTIFIANT,
                value.selectedStages.choice3.IDENTIFIANT,
                value.selectedStages.choice4.IDENTIFIANT,
                value.selectedStages.choice5.IDENTIFIANT
            ];
            csvRows.push(row);
        }

        // Convert the CSV rows array to a string
        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        // Write the CSV content to the output file
        await fs.writeFile(outputFilePath, csvContent);
        console.log(`CSV file created successfully at ${outputFilePath}`);
    } catch (err) {
        console.error('Error:', err);
    }
}

// Paths for input JSON file and output CSV file
const inputFilePath = path.resolve('output_cleaned_file.json'); // input JSON file
const outputFilePath = path.resolve('listing.csv'); // output CSV file

// Call the function
jsonToCsv(inputFilePath, outputFilePath);
