<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Modifier l'utilisateur</h1>
    </section>

    <div class="card p-4 shadow-lg">
      <form @submit.prevent="updateUser" class="p-fluid grid">
        <div class="p-field col-6">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="prenom" required />
        </div>
        <div class="p-field col-6">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="nom" required />
        </div>
        <div class="p-field col-6">
          <label for="role">Rôle</label>
          <Dropdown id="role" v-model="role" :options="roles" optionLabel="label" placeholder="Sélectionner un rôle" required />
        </div>
        <div class="p-field col-6">
          <label for="email">Email</label>
          <InputText id="email" v-model="email" type="email" required />
        </div>
        <div class="p-field col-6">
          <label for="institution">Institution</label>
          <InputText id="institution" v-model="institution" />
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
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

export default {
  name: 'NewUserFormModif',
  components: {
    InputText,
    Dropdown,
    Button
  },
  props: {
    userId: String
  },
  data() {
    return {
      prenom: '',
      nom: '',
      role: '',
      email: '',
      institution: '',
      roles: [
        { label: 'Admin', value: 'admin' },
        { label: 'PF', value: 'PF' },
        { label: 'Prof', value: 'Prof' }
      ]
    };
  },
  async mounted() {
    if (this.userId) {
      try {
        const userRef = ref(db, 'Users/' + this.userId);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          this.prenom = userData.Prenom || '';
          this.nom = userData.Nom || '';
          this.role = userData.Role || '';
          this.email = userData.Email || '';
          this.institution = userData.Institution || '';
        } else {
          console.error('Utilisateur non trouvé');
          // Gérer le cas où l'utilisateur n'est pas trouvé
        }
      } catch (error) {
        console.error('Erreur de chargement des données de l’utilisateur', error);
        // Gérer les erreurs de chargement des données
      }
    } else {
      console.error('Aucun ID d’utilisateur fourni');
      // Gérer le cas où aucun ID d'utilisateur n'est fourni
    }
  },
  methods: {
    async updateUser() {
      if (confirm('Êtes-vous sûr de vouloir mettre à jour cet utilisateur ?')) {
        try {
          const userRef = ref(db, 'Users/' + this.userId);
          await set(userRef, {
            Forname: this.prenom,
            Name: this.nom,
            Roles: this.role,
            Mail: this.email,
            Institution: this.institution,
          });

          // Rediriger vers la liste des utilisateurs
          this.$router.push({ name: 'UserList' });
        } catch (error) {
          console.error('Erreur de mise à jour de l’utilisateur', error);
          // Gérer les erreurs de mise à jour
        }
      }
    }
  }
};
</script>

<style scoped>

</style>
