<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <FormShell title="Nouvel utilisateur" description="Créez un compte et attribuez-lui son rôle initial.">
      <form id="new-user-form" @submit.prevent="addNewUser" class="app-form p-fluid">
        <FormSection title="Identité et accès" description="Renseignez les informations nécessaires à la création du compte." icon="pi pi-user-plus">
        <div class="grid">
        <FormField for-id="email" label="Email" required hint="Une adresse institutionnelle permet d’identifier plus facilement le compte." :error="emailError ? 'Saisissez une adresse email valide.' : ''" v-slot="field">
          <InputText 
            v-bind="field.controlAttrs"
            v-model="email" 
            type="email" 
            placeholder="exemple@hedsvs.ch"
            :class="{ 'p-invalid': emailError }" 
            autocomplete="email"
            required 
          />
        </FormField>

        <FormField for-id="password" label="Mot de passe" required hint="Au moins 8 caractères." :error="passwordError ? 'Le mot de passe doit contenir au moins 8 caractères.' : ''" v-slot="field">
          <Password 
            v-bind="field.controlAttrs"
            v-model="password" 
            placeholder="Au moins 8 caractères"
            toggleMask 
            :feedback="true"
            autocomplete="new-password"
            :class="{ 'p-invalid': passwordError }" 
            required 
          />
        </FormField>

        <FormField for-id="prenom" label="Prénom" optional-label="Facultatif" v-slot="field">
          <InputText v-bind="field.controlAttrs" v-model="prenom" autocomplete="given-name" />
        </FormField>

        <FormField for-id="nom" label="Nom de famille" optional-label="Facultatif" v-slot="field">
          <InputText v-bind="field.controlAttrs" v-model="nom" autocomplete="family-name" />
        </FormField>

        <FormField for-id="role" label="Rôle initial" required hint="Les permissions détaillées pourront être ajustées ensuite." v-slot="field">
          <Dropdown 
            v-bind="field.controlAttrs"
            v-model="role" 
            :options="roles" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Sélectionner un rôle" 
          />
        </FormField>
        </div>
        </FormSection>

        <FormStatus :status="creatingUser ? 'loading' : createUserError ? 'error' : 'idle'" :message="creatingUser ? 'Création du compte en cours…' : createUserError" />

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
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/authStore';
import FormShell from '@/components/common/forms/FormShell.vue';
import FormSection from '@/components/common/forms/FormSection.vue';
import FormField from '@/components/common/forms/FormField.vue';
import FormStatus from '@/components/common/forms/FormStatus.vue';
import { db } from '../../../../firebase.js';
import { get, ref, set } from 'firebase/database';

export default {
  name: 'NewUserForm',
  components: {
    InputText,
    Dropdown,
    PrimeButton,
    Password,
    Toast,
    FormShell,
    FormSection,
    FormField,
    FormStatus
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
      this.emailError = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
      this.passwordError = this.password.length < 8
      this.createUserError = ''
      if (this.emailError || this.passwordError) {
        this.createUserError = 'Corrigez les champs signalés avant de créer le compte.'
        await this.$nextTick()
        document.querySelector('#new-user-form [aria-invalid="true"]')?.focus()
        return
      }

      this.creatingUser = true
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
        this.createUserError = 'Le compte n’a pas pu être créé. Vérifiez votre connexion puis réessayez.'
      } finally {
        this.creatingUser = false
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


</style>
