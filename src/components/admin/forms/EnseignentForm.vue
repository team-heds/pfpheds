<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <FormShell title="Nouvel enseignant" description="Créez un profil enseignant avec ses coordonnées principales." :busy="saving">
      <form id="teacher-create-form" @submit.prevent="addNewEnseignant" class="app-form p-fluid">
        <FormSection title="Identité" icon="pi pi-user-plus">
          <FormField for-id="prenom" label="Prénom" required v-slot="field"><InputText v-bind="field.controlAttrs" v-model="prenom" autocomplete="given-name" required /></FormField>
          <FormField for-id="nom" label="Nom" required v-slot="field"><InputText v-bind="field.controlAttrs" v-model="nom" autocomplete="family-name" required /></FormField>
          <FormField for-id="email" label="Email" required span="12" :error="emailError" v-slot="field"><InputText v-bind="field.controlAttrs" v-model="email" type="email" autocomplete="email" required /></FormField>
        </FormSection>
        <FormStatus :status="formStatus" :message="formMessage" />
      </form>
      <template #actions>
        <Button type="button" label="Annuler" severity="secondary" outlined @click="$router.back()" :disabled="saving" />
        <Button type="submit" form="teacher-create-form" label="Créer l’enseignant" icon="pi pi-check" :loading="saving" />
      </template>
    </FormShell>
  </div>
</template>

<script>
import { getDatabase, ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import FormShell from '@/components/common/forms/FormShell.vue';
import FormSection from '@/components/common/forms/FormSection.vue';
import FormField from '@/components/common/forms/FormField.vue';
import FormStatus from '@/components/common/forms/FormStatus.vue';

export default {
  name: 'EnseignantForm',
  components: {
    InputText,
    Button,
    FormShell,
    FormSection,
    FormField,
    FormStatus
  },
  data() {
    return {
      prenom: '',
      nom: '',
      email: '',
      saving: false,
      emailError: '',
      formStatus: 'idle',
      formMessage: ''
    };
  },
  methods: {
    async addNewEnseignant() {
      this.emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) ? '' : 'Saisissez une adresse email valide.';
      if (this.emailError) {
        this.formStatus = 'error';
        this.formMessage = 'Corrigez le champ signalé avant de créer le profil.';
        await this.$nextTick();
        document.querySelector('#teacher-create-form [aria-invalid="true"]')?.focus();
        return;
      }
      this.saving = true;
      this.formStatus = 'loading';
      this.formMessage = 'Création du profil enseignant…';
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
        this.formStatus = 'success';
        this.formMessage = 'Le profil enseignant a été créé.';
        this.$router.push({ name: 'EnseignantList' });
      } catch (error) {
        console.error('Erreur d’ajout du nouvel enseignant', error);
        this.formStatus = 'error';
        this.formMessage = 'Le profil n’a pas pu être créé. Réessayez.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped></style>
