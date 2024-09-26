<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-4">Modifier les enseignants</h1>
    </div>
    <form @submit.prevent="updateEnseignant" class="p-fluid grid">
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
        <Button :disabled="loading" type="submit" label="Mettre à jour" class="p-button-primary w-full lg:w-auto" />
      </div>
    </form>
  </div>
</template>

<script>
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

export default {
  name: 'EnseignantFormModif',
  components: {
    InputText,
    Button
  },
  props: {
    enseignantId: {
      type: String,
      required: true // Make sure the ID is passed when you open this form
    }
  },
  data() {
    return {
      prenom: '',
      nom: '',
      email: '',
      loading: true, // Track loading state
    };
  },
  async mounted() {
    if (this.enseignantId) {
      try {
        const db = getDatabase();
        const enseignantRef = dbRef(db, 'Enseignants/' + this.enseignantId);
        const snapshot = await get(enseignantRef);
        if (snapshot.exists()) {
          const enseignantData = snapshot.val();
          this.prenom = enseignantData.Prenom || '';
          this.nom = enseignantData.Nom || '';
          this.email = enseignantData.Email || '';
        } else {
          console.error('Enseignant non trouvé');
        }
      } catch (error) {
        console.error('Erreur de chargement des données de l’enseignant', error);
      } finally {
        this.loading = false; // Stop loading once the data is fetched
      }
    } else {
      console.error('Aucun ID d’enseignant fourni');
    }
  },
  methods: {
    async updateEnseignant() {
      if (confirm('Êtes-vous sûr de vouloir mettre à jour cet enseignant ?')) {
        try {
          this.loading = true; // Set loading to true while updating
          const db = getDatabase();
          const enseignantRef = dbRef(db, 'Enseignants/' + this.enseignantId);
          await set(enseignantRef, {
            Forname: this.prenom,
            Name: this.nom,
            Mail: this.email,
          });

          // Redirect to the list of enseignants after successful update
          this.$router.push({ name: 'EnseignantList' });
        } catch (error) {
          console.error('Erreur de mise à jour de l’enseignant', error);
        } finally {
          this.loading = false; // Stop loading after update
        }
      }
    }
  }
};
</script>

<style scoped>
/* Add styles if needed */
</style>
