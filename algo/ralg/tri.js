import fs from 'fs';
import path from 'path';

// Lire le fichier JSON updated_data.json
const updatedDataPath = path.join(process.cwd(), 'updated_data.json');
const updatedData = JSON.parse(fs.readFileSync(updatedDataPath, 'utf-8'));

// Fonction pour créer un fichier avec la liste de tous les IDs des étudiants
function createStudentIdList() {
    const studentIds = new Set(); // Utiliser un Set pour éviter les doublons

    // Parcourir chaque étudiant dans updated_data.json
    Object.keys(updatedData).forEach(studentId => {
        if (studentId && typeof studentId === 'string') {  // Vérifier que l'ID existe et est valide
            studentIds.add(studentId); // Ajouter l'ID de l'étudiant au Set
        }
    });

    // Générer un fichier texte avec la liste des IDs
    const studentIdFilePath = path.join(process.cwd(), 'student_ids.txt');
    fs.writeFileSync(studentIdFilePath, Array.from(studentIds).join('\n'), 'utf-8'); // Convertir le Set en Array et écrire dans un fichier
    console.log('Le fichier student_ids.txt a été généré avec succès.');
}

// Exécuter la fonction
createStudentIdList();
