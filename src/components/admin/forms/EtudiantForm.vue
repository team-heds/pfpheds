<template>
  <Navbar />
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <FormShell title="Nouvel étudiant" description="Créez le profil et attribuez sa classe ainsi que son responsable de stage." :busy="saving">
      <form id="legacy-student-form" @submit.prevent="addStudent" class="app-form p-fluid">
        <FormSection title="Identité et formation" icon="pi pi-user-plus">
          <FormField for-id="prenom" label="Prénom" required v-slot="field"><InputText v-bind="field.controlAttrs" v-model="prenom" autocomplete="given-name" required /></FormField>
          <FormField for-id="nom" label="Nom" required v-slot="field"><InputText v-bind="field.controlAttrs" v-model="nom" autocomplete="family-name" required /></FormField>
          <FormField for-id="classe" label="Classe" required v-slot="field"><InputText v-bind="field.controlAttrs" v-model="classe" required /></FormField>
          <FormField for-id="email" label="Email" required :error="emailError" v-slot="field"><InputText v-bind="field.controlAttrs" v-model="email" type="email" autocomplete="email" required /></FormField>
          <FormField for-id="responsable" label="Responsable de stage" optional-label="Facultatif" v-slot="field"><Dropdown v-bind="field.controlAttrs" v-model="responsable" :options="enseignants" optionLabel="Nom" placeholder="Sélectionner un responsable" /></FormField>
          <div class="form-choice"><input id="sae" type="checkbox" v-model="isSAE" /><label for="sae">SAE (cas particulier)</label></div>
        </FormSection>
        <FormStatus :status="formStatus" :message="formMessage" />
      </form>
      <template #actions>
        <Button type="button" label="Annuler" severity="secondary" outlined @click="$router.push({ name: 'EtudiantList' })" :disabled="saving" />
        <Button type="submit" form="legacy-student-form" label="Créer l’étudiant" icon="pi pi-check" :loading="saving" />
      </template>
    </FormShell>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { ref as dbRef, get, set } from "firebase/database";
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import Navbar from '@/components/common/utils/Navbar.vue'
import FormShell from '@/components/common/forms/FormShell.vue'
import FormSection from '@/components/common/forms/FormSection.vue'
import FormField from '@/components/common/forms/FormField.vue'
import FormStatus from '@/components/common/forms/FormStatus.vue'

export default {
  name: 'EtudiantForm',
  components: {
    InputText,
    Button,
    Navbar,
    Dropdown,
    FormShell,
    FormSection,
    FormField,
    FormStatus
  },
  data() {
    return {
      prenom: '',
      nom: '',
      classe: '',
      email: '',
      responsable: null,
      isSAE: false, // Ajout du champ pour SAE (Cas particulier)
      saving: false,
      emailError: '',
      formStatus: 'idle',
      formMessage: '',
      enseignants: [],
      password: 'defaultPassword123' // Mot de passe par défaut
    };
  },
  async mounted() {
    await this.fetchEnseignants();
  },
  methods: {
    async fetchEnseignants() {
      try {
        const enseignantsRef = dbRef(db, 'enseignants/');
        const snapshot = await get(enseignantsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.enseignants = Object.keys(data).map(key => ({
            ...data[key],
            id: key
          }));
        }
      } catch (error) {
        console.error('Erreur de chargement des enseignants', error);
      }
    },
    async addStudent() {
      this.emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email) ? '' : 'Saisissez une adresse email valide.';
      if (this.emailError) {
        this.formStatus = 'error';
        this.formMessage = 'Corrigez le champ signalé avant de créer le profil.';
        await this.$nextTick();
        document.querySelector('#legacy-student-form [aria-invalid="true"]')?.focus();
        return;
      }
      this.saving = true;
      this.formStatus = 'loading';
      this.formMessage = 'Création du profil étudiant…';
      try {
        const auth = getAuth();
        const { email, password, prenom, nom, classe, responsable, isSAE } = this;

        // Créer un utilisateur avec son email et un mot de passe par défaut
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid; // ID d'authentification généré

        // Enregistrer les informations dans la base Students
        const newStudentRef = dbRef(db, 'Students/' + userId);
        await set(newStudentRef, {
          Classe: classe,
          Responsable: responsable,
          Cas_Particulier: isSAE ? 'true' : 'false' // Sauvegarde du SAE
        });

        // Enregistrer les informations dans la base Users
        const newUserRef = dbRef(db, 'Users/' + userId);
        await set(newUserRef, {
          Nom: nom,
          Prenom: prenom,
          Mail: email,
        });

        // Réinitialiser les champs
        this.prenom = '';
        this.nom = '';
        this.classe = '';
        this.email = '';
        this.responsable = null;
        this.isSAE = false;

        // Rediriger vers la liste des étudiants
        this.formStatus = 'success';
        this.formMessage = 'Le profil étudiant a été créé.';
        this.$router.push({ name: 'EtudiantList' });
      } catch (error) {
        console.error('Erreur d’ajout de l’étudiant', error);
        this.formStatus = 'error';
        this.formMessage = 'Le profil n’a pas pu être créé. Réessayez.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>

<style scoped>
.form-choice{grid-column:span 6;display:flex;align-items:center;gap:.625rem;min-height:2.75rem;padding:.375rem}.form-choice input{inline-size:1.25rem;block-size:1.25rem}.form-choice label{font-weight:600}@media(max-width:48rem){.form-choice{grid-column:1/-1}}
</style>
