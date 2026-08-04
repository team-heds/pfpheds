<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Nouveau praticien formateur</h1>
    </section>
 
    <div class="card p-4 shadow-lg">
      <form @submit.prevent="submitForm" class="app-form p-fluid">
        <div class="field">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="newPraticien.prenom" required />
        </div>
        <div class="field">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="newPraticien.nom" required />
        </div>
        <div class="field">
          <label for="mail">Mail</label>
          <InputText id="mail" v-model="newPraticien.mail" type="email" required />
        </div>
        <div class="field">
          <label for="institution">Institution</label>
          <InputText id="institution" v-model="newPraticien.institution" />
        </div>
        <div class="field">
          <label for="localite">Localité</label>
          <InputText id="localite" v-model="newPraticien.localite" />
        </div>
        <Button type="submit" label="Ajouter" class="p-button-primary mt-4" />
      </form>
    </div>
  </div>
</template>
 
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePraticiensStore } from '@/stores/praticiensStore';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
 
const router = useRouter();
const store = usePraticiensStore();
 
const newPraticien = ref({
  prenom: '',
  nom: '',
  mail: '',
  institution: '',
  localite: '',
});
 
const submitForm = async () => {
  if (confirm('Êtes-vous sûr de vouloir ajouter ce nouveau praticien formateur ?')) {
    try {
      console.log('➕ [FORM] Creating new praticien:', newPraticien.value);
      await store.createPraticien(newPraticien.value);
      console.log('✅ [FORM] Praticien created successfully');
      router.push({ name: 'TrainerListView' });
    } catch (error) {
      console.error('❌ [FORM] Error creating praticien:', error);
      alert('Erreur lors de la création: ' + error.message);
    }
  }
};
</script>
 
<style scoped>
.field {
  margin-bottom: 1.5rem;
}
</style>
