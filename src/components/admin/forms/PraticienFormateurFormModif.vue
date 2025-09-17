<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Modifier le praticien formateur</h1>
    </section>

    <div v-if="praticien" class="card p-4 shadow-lg">
      <form @submit.prevent="submitUpdate" class="p-fluid">
        <div class="field">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="praticien.prenom" required />
        </div>
        <div class="field">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="praticien.nom" required />
        </div>
        <div class="field">
          <label for="mail">Mail</label>
          <InputText id="mail" v-model="praticien.mail" type="email" required />
        </div>
        <div class="field">
          <label for="institution">Institution</label>
          <InputText id="institution" v-model="praticien.institution" />
        </div>
        <div class="field">
          <label for="localite">Localité</label>
          <InputText id="localite" v-model="praticien.localite" />
        </div>
        <Button type="submit" label="Mettre à jour" class="p-button-primary mt-4" />
      </form>
    </div>
    <div v-else class="text-center">
      <p>Chargement du praticien formateur ou praticien non trouvé...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePraticiensFormateursStore } from '@/stores/praticiensFormateursStore';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();
const store = usePraticiensFormateursStore();

const praticien = ref(null);
const praticienFormateurId = route.params.praticienFormateurId;

onMounted(async () => {
  if (store.praticiensFormateurs.length === 0) {
    await store.fetchPraticiensFormateurs();
  }
  
  const foundPraticien = store.praticiensFormateurs.find(p => p.id === praticienFormateurId);
  
  if (foundPraticien) {
    praticien.value = { ...foundPraticien };
  } else {
    console.error('Praticien formateur non trouvé dans le store');
  }
});

const submitUpdate = async () => {
  if (confirm('Êtes-vous sûr de vouloir mettre à jour ce praticien formateur ?')) {
    if (praticien.value) {
      await store.updatePraticienFormateur(praticien.value.id, praticien.value);
      router.push({ name: 'TrainerListView' });
    }
  }
};
</script>

<style scoped>
.field {
  margin-bottom: 1.5rem;
}
</style>
