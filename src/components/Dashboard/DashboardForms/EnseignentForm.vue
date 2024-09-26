<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-4">Nouvel enseignant</h1>
    </div>
    <form @submit.prevent="addNewEnseignant" class="p-fluid grid">
      <div class="field mb-4 col-6">
        <label for="prenom" class="block text-xl mb-2">Prénom</label>
        <InputText id="prenom" v-model="prenom" required class="w-full" />
      </div>
      <div class="field mb-4 col-6">
        <label for="nom" class="block text-xl mb-2">Nom</label>
        <InputText id="nom" v-model="nom" required class="w-full" />
      </div>
      <div class="field mb-4 col-12">
        <label for="email" class="block text-xl mb-2">Email</label>
        <InputText id="email" v-model="email" required type="email" class="w-full" />
      </div>
      <div class="text-center mt-5 col-12">
        <Button type="submit" label="Ajouter" class="p-button-primary w-full lg:w-auto" />
      </div>
    </form>
  </div>
</template>

<script>
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

export default {
  name: 'EnseignantForm',
  components: {
    InputText,
    Button
  },
  data() {
    return {
      prenom: '',
      nom: '',
      email: ''
    };
  },
  methods: {
    async addNewEnseignant() {
      try {
        const db = getDatabase();
        const enseignantsRef = dbRef(db, 'Enseignants');

        // Obtenir les données actuelles pour obtenir le nombre d'enseignants
        const snapshot = await get(enseignantsRef);
        const enseignantsData = snapshot.val();
        const nextEnseignantId = enseignantsData ? Object.keys(enseignantsData).length + 1 : 1;

        // Création d'un nouvel enseignant avec un identifiant séquentiel
        const newEnseignantRef = dbRef(db, 'Enseignants/' + nextEnseignantId);
        await set(newEnseignantRef, {
          Forname: this.prenom,
          Name: this.nom,
          Mail: this.email
        });

        // Réinitialiser les champs du formulaire
        this.prenom = '';
        this.nom = '';
        this.email = '';

        // Rediriger vers la liste des enseignants
        this.$router.push({ name: 'EnseignantList' });
      } catch (error) {
        console.error('Erreur d’ajout du nouvel enseignant', error);
      }
    }
  }
};
</script>

<style scoped>
.surface-section {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-center {
  text-align: center;
}

.field {
  margin-bottom: 1.5rem;
}

.p-button-primary {
  background-color: #007bff;
  border: none;
}

.p-button-primary:hover {
  background-color: #0056b3;
}
</style>
