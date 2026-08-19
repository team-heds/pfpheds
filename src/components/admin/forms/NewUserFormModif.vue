<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <FormShell title="Modifier l’utilisateur" description="Mettez à jour son identité, son rôle et son institution." :busy="saving || loading">
      <FormStatus v-if="loading" status="loading" message="Chargement du compte…" />
      <form v-else id="edit-user-form" @submit.prevent="updateUser" class="app-form p-fluid">
        <FormSection title="Identité et affectation" icon="pi pi-user-edit">
          <FormField for-id="prenom" label="Prénom" required v-slot="field">
            <InputText v-bind="field.controlAttrs" v-model="prenom" autocomplete="given-name" required />
          </FormField>
          <FormField for-id="nom" label="Nom" required v-slot="field">
            <InputText v-bind="field.controlAttrs" v-model="nom" autocomplete="family-name" required />
          </FormField>
          <FormField for-id="role" label="Rôle" required v-slot="field">
            <Dropdown v-bind="field.controlAttrs" v-model="role" :options="roles" optionLabel="label" optionValue="value" placeholder="Sélectionner un rôle" required />
          </FormField>
          <FormField for-id="email" label="Email" required :error="emailError" v-slot="field">
            <InputText v-bind="field.controlAttrs" v-model="email" type="email" autocomplete="email" required />
          </FormField>
          <FormField for-id="institution" label="Institution" optional-label="Facultatif" span="12" v-slot="field">
            <InputText v-bind="field.controlAttrs" v-model="institution" />
          </FormField>
        </FormSection>
        <FormStatus :status="formStatus" :message="formMessage" />
      </form>
      <template #actions>
        <Button type="button" label="Annuler" severity="secondary" outlined @click="$router.back()" :disabled="saving" />
        <Button type="submit" form="edit-user-form" label="Enregistrer les modifications" icon="pi pi-check" :loading="saving" :disabled="loading" />
      </template>
    </FormShell>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import FormShell from '@/components/common/forms/FormShell.vue';
import FormSection from '@/components/common/forms/FormSection.vue';
import FormField from '@/components/common/forms/FormField.vue';
import FormStatus from '@/components/common/forms/FormStatus.vue';

export default {
  name: 'NewUserFormModif',
  components: {
    InputText,
    Dropdown,
    Button,
    FormShell,
    FormSection,
    FormField,
    FormStatus
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
      loading: true,
      saving: false,
      emailError: '',
      formStatus: 'idle',
      formMessage: '',
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
          this.formStatus = 'error';
          this.formMessage = 'Ce compte est introuvable.';
        }
      } catch (error) {
        console.error('Erreur de chargement des données de l’utilisateur', error);
        this.formStatus = 'error';
        this.formMessage = 'Le compte n’a pas pu être chargé.';
      }
    } else {
      console.error('Aucun ID d’utilisateur fourni');
      this.formStatus = 'error';
      this.formMessage = 'Aucun compte n’a été sélectionné.';
    }
    this.loading = false;
  },
  methods: {
    async updateUser() {
      this.emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) ? '' : 'Saisissez une adresse email valide.';
      if (this.emailError) {
        this.formStatus = 'error';
        this.formMessage = 'Corrigez le champ signalé avant d’enregistrer.';
        await this.$nextTick();
        document.querySelector('#edit-user-form [aria-invalid="true"]')?.focus();
        return;
      }

      if (confirm('Êtes-vous sûr de vouloir mettre à jour cet utilisateur ?')) {
        this.saving = true;
        this.formStatus = 'loading';
        this.formMessage = 'Enregistrement des modifications…';
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
          this.formStatus = 'success';
          this.formMessage = 'Les modifications ont été enregistrées.';
          this.$router.push({ name: 'UserList' });
        } catch (error) {
          console.error('Erreur de mise à jour de l’utilisateur', error);
          this.formStatus = 'error';
          this.formMessage = 'La mise à jour a échoué. Réessayez.';
        } finally {
          this.saving = false;
        }
      }
    }
  }
};
</script>

<style scoped>

</style>
