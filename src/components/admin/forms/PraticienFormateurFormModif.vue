<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg mb-5">
      <h1 class="text-5xl font-bold">Modifier le praticien formateur</h1>
    </section>

    <div v-if="praticien" class="card p-4 shadow-lg">
      <form @submit.prevent="submitUpdate" class="app-form p-fluid">
        <div class="field">
          <label for="prenom">Prénom</label>
          <InputText id="prenom" v-model="praticien.prenom" required @input="validateNameField('prenom')" />
          <small v-if="hasNumbers(praticien.prenom)" class="p-error">
            ⚠️ Les chiffres seront automatiquement supprimés du prénom lors de la sauvegarde
          </small>
        </div>
        <div class="field">
          <label for="nom">Nom</label>
          <InputText id="nom" v-model="praticien.nom" required @input="validateNameField('nom')" />
          <small v-if="hasNumbers(praticien.nom)" class="p-error">
            ⚠️ Les chiffres seront automatiquement supprimés du nom lors de la sauvegarde
          </small>
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
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePraticiensStore } from '@/stores/praticiensStore'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const store = usePraticiensStore()

const praticien = ref(null)
const praticienFormateurId = route.params.praticienFormateurId

onMounted(async () => {
  try {
    console.log('🔍 [FORM MODIF] Loading praticien with ID:', praticienFormateurId)
    
    // Essayer d'abord de récupérer directement par ID
    const foundPraticien = await store.getPraticienById(praticienFormateurId)
    
    if (foundPraticien) {
      praticien.value = { ...foundPraticien }
      console.log('✅ [FORM MODIF] Praticien loaded:', praticien.value)
    } else {
      console.warn('⚠️ [FORM MODIF] Praticien non trouvé avec ID:', praticienFormateurId)
      // Fallback: essayer de charger tous les praticiens
      await store.fetchPraticiens()
      const fallbackFound = store.items.find(p => p.id === praticienFormateurId)
      if (fallbackFound) {
        praticien.value = { ...fallbackFound }
        console.log('✅ [FORM MODIF] Praticien found via fallback:', praticien.value)
      } else {
        console.error('❌ [FORM MODIF] Praticien introuvable même après fallback')
      }
    }
  } catch (error) {
    console.error('❌ [FORM MODIF] Error loading praticien:', error)
  }
})

const hasNumbers = (value) => value && /\d/.test(value)

const validateNameField = (fieldName) => {
  console.log(`🔍 [VALIDATION] Checking field ${fieldName}:`, praticien.value?.[fieldName])
}

const submitUpdate = async () => {
  if (!praticien.value) return

  let confirmMessage = 'Êtes-vous sûr de vouloir mettre à jour ce praticien formateur ?'
  if (hasNumbers(praticien.value.nom) || hasNumbers(praticien.value.prenom)) {
    confirmMessage += '\n\n⚠️ ATTENTION: Les chiffres dans le nom et/ou prénom seront automatiquement supprimés.'
  }

  if (confirm(confirmMessage)) {
    try {
      console.log('📝 [FORM MODIF] Updating praticien:', praticien.value)
      await store.updatePraticien(praticien.value.id, praticien.value)
      console.log('✅ [FORM MODIF] Praticien updated successfully')
      router.push({ name: 'TrainerListView' })
    } catch (error) {
      console.error('❌ [FORM MODIF] Error updating praticien:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    }
  }
}
</script>

<style scoped>
.field {
  margin-bottom: 1.5rem;
}
</style>
