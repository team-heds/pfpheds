import { studentChoiceOnly } from './1studenttchoiceonly.js';
import { definelessStudents } from './2definelessstudents.js';
import { deleteStudentAssigned } from './3deletestudentassigned.js';
import { sortedPlace } from './4sortedPlace.js';
import { addCriteria } from './5addcriteria.js';
import { defineLesse } from './6definelesse.js';
import { deleteStudentInfolese } from './7deletestudentinfolese.js';
import { sortedAgain } from './8sortedagain.js';
import { defineVot } from './9definevot.js';
import { deleteDatasStudent } from './10deletedatasstudent.js';
import { sorted } from './11sorted.js';
import { vote } from './12vote.js';
import { voteSecond } from './13vote.js';

// Fonction principale qui orchestre l'exécution des scripts
async function main() {
    // Exécute les scripts 1 à 8
    await studentChoiceOnly();
    await definelessStudents();
    await deleteStudentAssigned();
    await sortedPlace();
    await addCriteria();
    await defineLesse();
    await deleteStudentInfolese();
    await sortedAgain();

    // Vérifie le résultat de script9
    const result9 = await defineVot();

    if (result9) {
        // Si script9 fait quelque chose, exécute 10 et 11
        await deleteDatasStudent();
        await sorted();
        // Retourne à script9
        await defineVot();
    } else {
        // Si script9 ne fait aucun changement, tente 12
        const result12 = await vote();

        if (!result12) {
            // Si aucun changement dans script12, exécute 13
            await voteSecond();
            // Ensuite exécute 10 et 11
            await deleteDatasStudent();
            await sorted();
            // Retourne à script9
            await defineVot();
        }
    }
}

// Lancer le script principal
main().catch(err => console.error(err));
