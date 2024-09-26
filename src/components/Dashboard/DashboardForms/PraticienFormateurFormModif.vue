<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Modifier le praticien formateur</h1>
    </section>

    <div class="card p-4 shadow-lg">
      <form @submit.prevent="updatePraticienFormateur" class="p-fluid">
        <div class="p-field">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="prenom" required />
        </div>
        <div class="p-field">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="nom" required />
        </div>
        <div class="p-field">
          <label for="mail">Mail</label>
          <InputText id="mail" v-model="mail" required />
        </div>
        <Button type="submit" label="Mettre à jour" class="p-button-primary" />
      </form>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

export default {
  name: 'PraticienFormateurModif',
  components: {
    InputText,
    Button
  },
  props: {
    praticienFormateurId: String
  },
  data() {
    return {
      prenom: '',
      nom: '',
      mail: '',
    };
  },
  async mounted() {
    if (this.praticienFormateurId) {
      const praticienFormateurRef = ref(db, 'PraticienFormateurs/' + this.praticienFormateurId);
      try {
        const snapshot = await get(praticienFormateurRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.prenom = data.Prenom;
          this.nom = data.Nom;
          this.mail = data.Mail;
        } else {
          console.error('Praticien formateur non trouvé');
        }
      } catch (error) {
        console.error('Erreur de chargement des données du praticien formateur:', error);
      }
    } else {
      console.error('Aucun ID de praticien formateur fourni');
    }
  },
  methods: {
    async updatePraticienFormateur() {
      if (confirm('Êtes-vous sûr de vouloir mettre à jour ce praticien formateur ?')) {
        try {
          const praticienFormateurRef = ref(db, 'PraticienFormateurs/' + this.praticienFormateurId);
          await set(praticienFormateurRef, {
            Prenom: this.prenom,
            Nom: this.nom,
            Mail: this.mail,
          });
          this.$router.push({ name: 'PraticienFormateurList' });
        } catch (error) {
          console.error('Erreur de mise à jour du praticien formateur:', error);
        }
      }
    }
  }
};
</script>

<style scoped>
</style>
