      <template>
        <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
          <section class="text-white text-center py-5 rounded-lg mb-5">
            <h1 class="text-5xl font-bold">Modifier le praticien formateur</h1>
          </section>
 
          <div v-if="praticien" class="card p-4 shadow-lg">
            <form @submit.prevent="submitUpdate" class="p-fluid">
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
      // ✅ utilise le nouveau store : items + fetchPraticiens
      if (store.items.length === 0) {
        await store.fetchPraticiens()
      }
 
      const found = store.items.find(p => p.id === praticienFormateurId)
      if (found) {
        praticien.value = { ...found }
      } else {
        console.warn('⚠️ Praticien non trouvé dans le store, tentative de rechargement')
        await store.fetchPraticiens()
        praticien.value = store.items.find(p => p.id === praticienFormateurId) ?? null
        if (!praticien.value) console.error('❌ Toujours introuvable après rechargement')
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
          await store.updatePraticien(praticien.value.id, praticien.value) // ✅ nouveau nom de méthode
          router.push({ name: 'TrainerListView' })
        } catch (error) {
          console.error('❌ [UPDATE] Error updating praticien:', error)
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
 
 