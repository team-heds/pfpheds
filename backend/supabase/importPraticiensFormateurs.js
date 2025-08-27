const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient'); // Utilise le client partagé

// Le chemin vers le fichier JSON doit être calculé depuis la racine du projet.
// Ce script est dans pfpheds/backend/supabase, donc nous remontons de 3 niveaux.
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const jsonFilePath = path.resolve(projectRoot, 'pfpheds-default-rtdb-PraticienFormateurs-export (2).json');

async function importData() {
  console.log('Démarrage de l\'importation des praticiens formateurs...');

  if (!supabase) {
    console.error('Erreur: Client Supabase non initialisé. Vérifiez supabaseClient.js et vos variables .env');
    return;
  }

  try {
    // 1. Lire le fichier JSON
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Erreur : Le fichier JSON n'a pas été trouvé à l'emplacement : ${jsonFilePath}`);
      return;
    }
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // 2. Transformer les données
    const praticiens = Object.values(jsonData).map(item => ({
      nom: item.Nom,
      prenom: item.Prenom,
      mail: item.Mail,
      institution: item.Institution,
      localite: item.Localite,
    }));

    if (praticiens.length === 0) {
        console.log('Aucun praticien à importer.');
        return;
    }

    console.log(`${praticiens.length} praticiens à importer.`);

    // 3. Insérer les données dans Supabase
    const { data, error } = await supabase
      .from('praticiens_formateurs')
      .insert(praticiens)
      .select();

    if (error) {
      // Fournit un message d'erreur plus détaillé
      console.error('Erreur lors de l\'insertion dans Supabase:', error.message);
      if (error.details) console.error('Détails:', error.details);
      throw error;
    }

    console.log(`Importation réussie : ${data.length} praticiens ont été ajoutés à la table.`);

  } catch (err) {
    console.error('Une erreur est survenue lors de l\'importation :', err.message);
  }
}

importData();

