const fs = require('fs');
const path = require('path');
const supabase = require('../supabaseClient'); // Utilise le client admin

const usersFilePath = path.join(__dirname, '../../pfpheds-default-rtdb-Users-export.json');

// Fonction pour générer un mot de passe aléatoire et sécurisé
function generateRandomPassword() {
  return Math.random().toString(36).slice(-10) + 'A1!';
}

async function importUsers() {
  console.log("Lecture du fichier JSON des enseignants...");
  const usersData = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

  for (const firebaseUid in usersData) {
    const user = usersData[firebaseUid];
    if (!user.Mail) {
        console.warn(`Utilisateur avec ID ${firebaseUid} ignoré car il n'a pas d'email.`);
        continue;
    }

    const email = user.Mail;
    const password = generateRandomPassword();
    const prenom = user.Forname;
    const nom = user.Name ? user.Name.trim() : '';

    console.log(`Traitement de l'utilisateur : ${email}`);

    // 1. Vérifier si un utilisateur avec cet email existe déjà
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("Erreur lors de la récupération des utilisateurs existants:", listError.message);
        continue;
    }
    
    let existingUser = users.find(u => u.email === email);
    let supabaseUserId;

    if (existingUser) {
        console.warn(`L'utilisateur avec l'email ${email} existe déjà. Mise à jour du profil uniquement.`);
        supabaseUserId = existingUser.id;
    } else {
        // 2. Créer l'utilisateur dans auth.users s'il n'existe pas
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirme automatiquement l'email
        });

        if (authError) {
            console.error(`Erreur lors de la création de l'utilisateur d'authentification pour ${email}:`, authError.message);
            continue; // Passe à l'utilisateur suivant
        }
        console.log(`Utilisateur d'authentification créé pour ${email}.`);
        supabaseUserId = authData.user.id;
    }

    // 3. Créer ou mettre à jour le profil dans public.user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: supabaseUserId,      // Le nouvel UUID de auth.users
        firebase_uid: firebaseUid,    // L'ancien ID de Firebase
        email: email,
        prenom: prenom,
        nom: nom,
        username: `${prenom}.${nom}`.toLowerCase().replace(/ /g, '') // Crée un nom d'utilisateur simple
      }, {
        onConflict: 'user_id' // En cas de conflit sur user_id, met à jour la ligne
      });

    if (profileError) {
      console.error(`Erreur lors de la création/mise à jour du profil pour ${email}:`, profileError.message);
    } else {
      console.log(`Profil pour ${email} créé/mis à jour avec succès. Firebase UID: ${firebaseUid} lié.`);
    }
  }
  console.log("\nImportation des utilisateurs terminée.");
}

importUsers().catch(console.error);
