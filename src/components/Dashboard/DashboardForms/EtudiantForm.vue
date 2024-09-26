<template>
  <Navbar />
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-4">Nouvel étudiant</h1>
    </div>
    <form @submit.prevent="addStudent" class="p-fluid grid">
      <div class="field mb-4 col-6">
        <label for="prenom" class="block text-xl mb-2">Prénom</label>
        <InputText id="prenom" v-model="prenom" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="nom" class="block text-xl mb-2">Nom</label>
        <InputText id="nom" v-model="nom" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="classe" class="block text-xl mb-2">Classe</label>
        <InputText id="classe" v-model="classe" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="email" class="block text-xl mb-2">Email</label>
        <InputText id="email" v-model="email" required type="email" class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="responsable" class="block text-xl mb-2">Responsable de stage</label>
        <Dropdown id="responsable" v-model="responsable" :options="enseignants" optionLabel="Nom" placeholder="Sélectionner un responsable" class="w-full" />
      </div>

      <!-- Ajout d'une case pour SAE -->
      <div class="field mb-4 col-6">
        <label for="sae" class="block text-xl mb-2">SAE (Cas Particulier)</label>
        <input id="sae" type="checkbox" v-model="isSAE" class="w-full" />
      </div>

      <div class="text-center mt-5 col-12">
        <Button type="submit" label="Ajouter" class="p-button-primary w-full lg:w-auto" />
        <Button label="Retour" class="w-full lg:w-auto ml-4" outlined @click="$router.push({ name: 'EtudiantList' })" />
      </div>
    </form>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Navbar from '@/components/Utils/Navbar.vue'

export default {
  name: 'EtudiantForm',
  components: {
    InputText,
    Button,
    Navbar,
    Dropdown
  },
  data() {
    return {
      prenom: '',
      nom: '',
      classe: '',
      email: '',
      responsable: null,
      isSAE: false, // Ajout du champ pour SAE (Cas particulier)
      enseignants: [],
      password: 'defaultPassword123' // Mot de passe par défaut
    };
  },
  async mounted() {
    await this.fetchEnseignants();
  },
  methods: {
    async fetchEnseignants() {
      try {
        const enseignantsRef = dbRef(db, 'enseignants/');
        const snapshot = await get(enseignantsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.enseignants = Object.keys(data).map(key => ({
            ...data[key],
            id: key
          }));
        }
      } catch (error) {
        console.error('Erreur de chargement des enseignants', error);
      }
    },
    async addStudent() {
      try {
        const auth = getAuth();
        const { email, password, prenom, nom, classe, responsable, isSAE } = this;

        // Créer un utilisateur avec son email et un mot de passe par défaut
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid; // ID d'authentification généré

        // Enregistrer les informations dans la base Students
        const newStudentRef = dbRef(db, 'Students/' + userId);
        await set(newStudentRef, {
          Classe: classe,
          Responsable: responsable,
          Cas_Particulier: isSAE ? 'true' : 'false' // Sauvegarde du SAE
        });

        // Enregistrer les informations dans la base Users
        const newUserRef = dbRef(db, 'Users/' + userId);
        await set(newUserRef, {
          Nom: nom,
          Prenom: prenom,
          Mail: email,
        });

        // Réinitialiser les champs
        this.prenom = '';
        this.nom = '';
        this.classe = '';
        this.email = '';
        this.responsable = null;
        this.isSAE = false;

        // Rediriger vers la liste des étudiants
        this.$router.push({ name: 'EtudiantList' });
      } catch (error) {
        console.error('Erreur d’ajout de l’étudiant', error);
      }
    }
  }
};
</script>

<style scoped>
/* Ajoutez vos styles personnalisés ici */
</style>
