<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Nouveau praticien formateur</h1>
    </section>

    <div class="card p-4 shadow-lg">
      <form @submit.prevent="addNewPraticienFormateur" class="p-fluid grid">
        <div class="p-field col-6">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="prenom" required />
        </div>
        <div class="p-field col-6">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="nom" required />
        </div>
        <div class="p-field col-6">
          <label for="mail">Mail</label>
          <InputText id="mail" v-model="mail" required />
        </div>
        <Button type="submit" label="Ajouter" class="p-button-primary" />
      </form>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, push, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

export default {
  name: 'PraticienFormateurForm',
  components: {
    InputText,
    Button
  },
  data() {
    return {
      prenom: '',
      nom: '',
      mail: '',
    };
  },
  methods: {
    async addNewPraticienFormateur() {
      try {
        const praticiensFormateursRef = ref(db, 'PraticienFormateurs');

        // Utilisation de push pour générer une nouvelle clé unique
        const newPraticienFormateurRef = push(praticiensFormateursRef);
        await set(newPraticienFormateurRef, {
          Prenom: this.prenom,
          Nom: this.nom,
          Mail: this.mail,
        });

        // Réinitialiser les champs du formulaire
        this.prenom = '';
        this.nom = '';
        this.mail = '';

        // Rediriger vers la liste des praticiens formateurs
        this.$router.push({ name: 'PraticienFormateurList' });
      } catch (error) {
        console.error('Erreur d’ajout du nouveau praticien formateur', error);
      }
    }
  }
};
</script>

<style scoped>

</style>
