<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <FormShell title="Nouvel utilisateur" description="Créez un compte et attribuez-lui son rôle initial.">
      <form id="new-user-form" @submit.prevent="addNewUser" class="app-form p-fluid grid">
        <div class="p-field col-12 md:col-6">
          <label for="email" class="font-semibold">Email *</label>
          <InputText 
            id="email" 
            v-model="email" 
            type="email" 
            placeholder="exemple@hedsvs.ch"
            :class="{ 'p-invalid': emailError }" 
            required 
          />
          <small v-if="emailError" class="p-error">Veuillez entrer un email valide</small>
        </div>

        <div class="p-field col-12 md:col-6">
          <label for="password" class="font-semibold">Mot de passe *</label>
          <Password 
            id="password" 
            v-model="password" 
            placeholder="Minimum 6 caractères" 
            toggleMask 
            :feedback="true"
            :class="{ 'p-invalid': passwordError }" 
            required 
          />
          <small v-if="passwordError" class="p-error">Le mot de passe doit contenir au moins 6 caractères</small>
        </div>

        <div class="p-field col-12 md:col-6">
          <label for="prenom" class="font-semibold">Prénom</label>
          <InputText id="prenom" v-model="prenom" placeholder="Prénom" />
        </div>

        <div class="p-field col-12 md:col-6">
          <label for="nom" class="font-semibold">Nom de famille</label>
          <InputText id="nom" v-model="nom" placeholder="Nom de famille" />
        </div>

        <div class="p-field col-12 md:col-6">
          <label for="role" class="font-semibold">Rôle</label>
          <Dropdown 
            id="role" 
            v-model="role" 
            :options="roles" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Sélectionner un rôle" 
          />
        </div>

        <div v-if="createUserError" class="col-12">
          <Message severity="error" :closable="false">{{ createUserError }}</Message>
        </div>

      </form>
      <template #actions>
        <PrimeButton label="Annuler" icon="pi pi-times" @click="goBack" type="button" outlined severity="secondary" />
        <PrimeButton form="new-user-form" type="submit" label="Créer l'utilisateur" icon="pi pi-check" :loading="creatingUser" />
      </template>
    </FormShell>

    <Toast />
  </div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import PrimeButton from 'primevue/button';
import Password from 'primevue/password';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/authStore';
import FormShell from '@/components/common/forms/FormShell.vue';
import { db } from '../../../../firebase.js';
import { get, ref, set } from 'firebase/database';

export default {
  name: 'NewUserForm',
  components: {
    InputText,
    Dropdown,
    PrimeButton,
    Password,
    Message,
    Toast,
    FormShell
  },
  setup() {
    const toast = useToast();
    const authStore = useAuthStore();
    return { toast, authStore };
  },
  data() {
    return {
      prenom: '',
      nom: '',
      role: 'student',
      email: '',
      password: '',
      creatingUser: false,
      emailError: false,
      passwordError: false,
      createUserError: '',
      roles: [
        { label: 'Étudiant', value: 'student' },
        { label: 'Enseignant', value: 'teacher' },
        { label: 'Administrateur', value: 'admin' },
        { label: 'Modérateur', value: 'moderator' },
        { label: 'Praticien', value: 'practitioner' }
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
