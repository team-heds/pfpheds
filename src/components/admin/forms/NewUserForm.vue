<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Nouvel utilisateur</h1>
    </section>

    <div class="card p-4 shadow-lg">
      <form @submit.prevent="addNewUser" class="p-fluid grid">
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
        <Button type="submit" label="Ajouter" class="p-button-primary" />
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
  name: 'NewUserForm',
  components: {
    InputText,
    Dropdown,
    Button
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
  methods: {
    async addNewUser() {
      try {
        const usersRef = ref(db, 'users');

        // Obtenir les données actuelles pour compter le nombre d'utilisateurs
        const snapshot = await get(usersRef);
        const usersData = snapshot.val();
        const nextUserId = usersData ? Object.keys(usersData).length + 1 : 1;

        // Création d'un nouvel utilisateur avec un identifiant séquentiel
        const newUserRef = ref(db, 'users/' + nextUserId);
        await set(newUserRef, {
          Prenom: this.prenom,
          Nom: this.nom,
          Role: this.role,
          Email: this.email,
          Institution: this.institution,
        });

        // Réinitialiser les champs du formulaire
        this.prenom = '';
        this.nom = '';
        this.role = '';
        this.email = '';
        this.institution = '';

        // Rediriger vers la liste des utilisateurs
        this.$router.push({ name: 'UserList' });
      } catch (error) {
        console.error('Erreur d’ajout du nouvel utilisateur', error);
      }
    }
  }
};
</script>

<style scoped>
.card {
  background-color: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}



.text-center {
  text-align: center;
}

.p-fluid .p-field {
  margin-bottom: 1.5rem;
}

</style>