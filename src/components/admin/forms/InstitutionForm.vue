<template>
  <Navbar />
  <div class="px-4 py-8 md:px-6 lg:px-8 institution-form-scroll">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-5xl font-bold">Soumettre une nouvelle institution</h1>
    </section>

    <section class="mt-5">
      <div class="text-center mb-5">
        <p>Utilisez cette interface pour ajouter une nouvelle institution au portail.</p>
      </div>

      <FormShell>
        <Steps :model="steps" :activeIndex="activeIndex" class="mb-5" />

        <div class="p-fluid">
          <form @submit.prevent="handleCreateInstitution">
            <transition name="fade-slide" mode="out-in">
              <!-- Step 1: Institution Details -->
              <div v-if="activeIndex === 0" key="etape1">
                <h4>Détails de l'institution</h4>
                <Divider />
                <div class="grid formgrid">
                  <div class="field col-12 md:col-6">
                    <label for="name">Nom <span class="text-danger">*</span></label>
                    <InputText id="name" v-model="institution.Name" required />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="langue">Langue <span class="text-danger">*</span></label>
                    <Dropdown
                      id="langue"
                      v-model="institution.Language"
                      :options="langues"
                      optionLabel="name"
                      optionValue="code"
                      required
                    />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="locality">Localité <span class="text-danger">*</span></label>
                    <InputText id="locality" v-model="institution.Locality" required />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="canton">Canton <span class="text-danger">*</span></label>
                    <Dropdown
                      id="canton"
                      v-model="institution.Canton"
                      :options="cantons"
                      optionLabel="name"
                      optionValue="code"
                      required
                    />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="address">Adresse</label>
                    <InputText
                      id="address"
                      v-model="institution.Address"
                      class="w-full"
                      placeholder="Adresse"
                    />
                  </div>
                  <div class="field col-6 md:col-3">
                    <label for="latitude">Latitude</label>
                    <InputText
                      id="latitude"
                      v-model="institution.Latitude"
                      class="w-full"
                      placeholder="Ex: 48.8566"
                    />
                  </div>
                  <div class="field col-6 md:col-3">
                    <label for="longitude">Longitude</label>
                    <InputText
                      id="longitude"
                      v-model="institution.Longitude"
                      class="w-full"
                      placeholder="Ex: 2.3522"
                    />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="url">URL</label>
                    <InputText
                      id="url"
                      v-model="institution.URL"
                      class="w-full"
                      placeholder="URL"
                    />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="nomchef">Nom, Prénom du chef</label>
                    <InputText
                      id="nomchef"
                      v-model="institution.NomChef"
                      class="w-full"
                      placeholder="Nom, Prénom du chef"
                    />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="phonechef">Téléphone du chef</label>
                    <InputText
                      id="phonechef"
                      v-model="institution.PhoneChef"
                      class="w-full"
                      placeholder="Téléphone du chef"
                    />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="mailchef">Mail du chef</label>
                    <InputText
                      id="mailchef"
                      v-model="institution.MailChef"
                      class="w-full"
                      placeholder="Mail du chef"
                    />
                  </div>
                </div>
              </div>

              <!-- Step 2: Additional Info -->
              <div v-else-if="activeIndex === 1" key="etape2">
                <h4>Informations supplémentaires</h4>
                <Divider />
                <div class="grid formgrid">
                  <div class="field col-12 md:col-6">
                    <label for="category">Catégorie</label>
                    <Dropdown
                      id="category"
                      v-model="institution.Category"
                      :options="categories"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                    />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="conventionDate">Date de Convention</label>
                    <Calendar
                      id="conventionDate"
                      v-model="institution.ConventionDate"
                      :showIcon="true"
                      dateFormat="dd-mm-yy"
                    />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="accordCadreDate">Date de l'Accord Cadre</label>
                    <Calendar
                      id="accordCadreDate"
                      v-model="institution.AccordCadreDate"
                      :showIcon="true"
                      dateFormat="dd-mm-yy"
                    />
                  </div>
                  <div class="field col-12">
                    <label for="note">Remarques</label>
                    <Textarea id="note" v-model="institution.Note" />
                  </div>
                </div>
              </div>

              <!-- Step 3: Media -->
              <div v-else-if="activeIndex === 2" key="etape3">
                <h4>Média</h4>
                <Divider />
                <div class="text-center">
                  <input
                    type="file"
                    ref="fileInputRef"
                    @change="onFileChange"
                    accept="image/*"
                    class="hidden"
                  />
                  <Button
                    type="button"
                    label="Choisir une image"
                    icon="pi pi-upload"
                    @click="fileInputRef.click()"
                  />
                  <div v-if="localPreview" class="mt-3">
                    <img
                      :src="localPreview"
                      alt="Aperçu"
                      class="mx-auto"
                      style="max-width: 200px; border-radius: 8px"
                    />
                    <Button
                      type="button"
                      label="Supprimer"
                      icon="pi pi-times"
                      class="p-button-danger mt-2"
                      @click="removeImage"
                    />
                  </div>
                </div>
              </div>

              <!-- Step 4: Description -->
              <div v-else-if="activeIndex === 3" key="etape4">
                <h4>Description</h4>
                <Divider />
                <div class="col-12">
                  <label for="description">Description</label>
                  <Textarea
                    id="description"
                    v-model="institution.Description"
                    rows="3"
                    class="w-full"
                    placeholder="Décrivez brièvement l'institution"
                  />
                </div>
              </div>
            </transition>

            <FormActions class="mt-5">
              <Button
                v-if="activeIndex > 0"
                type="button"
                label="Précédent"
                class="p-button-secondary"
                @click="goToPrevStep"
              />
              <Button
                v-if="activeIndex < steps.length - 1"
                type="button"
                label="Suivant"
                class="p-button-primary ml-auto"
                @click="goToNextStep"
              />
              <Button
                v-if="activeIndex === steps.length - 1"
                type="submit"
                label="Créer l'institution"
                class="p-button-primary ml-auto"
                :disabled="loading"
              />
            </FormActions>
          </form>
        </div>
      </FormShell>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useToast } from 'primevue/usetoast'
import institutionMediaService from '@/service/institutionMediaService'

// PrimeVue Components
import Steps from 'primevue/steps'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Calendar from 'primevue/calendar'
import Navbar from '@/components/common/utils/Navbar.vue'
import FormShell from '@/components/common/forms/FormShell.vue'
import FormActions from '@/components/common/forms/FormActions.vue'

// Setup
const router = useRouter()
const institutionsStore = useInstitutionsStore()
const toast = useToast()

// State
const activeIndex = ref(0)
const loading = ref(false)
const fileInputRef = ref(null)
const imageFile = ref(null)
const localPreview = ref('')

const institution = ref({
  Name: '',
  Locality: '',
  Canton: '',
  Language: '',
  Address: '',
  URL: '',
  Category: '',
  Latitude: '',
  Longitude: '',
  Description: '',
  ConventionDate: null,
  AccordCadreDate: null,
  Note: '',
  MailChef: '',
  NomChef: '',
  PhoneChef: '',
  ImageURL: []
})

// Form Steps
const steps = [
  { label: 'Détails' },
  { label: 'Informations' },
  { label: 'Média' },
  { label: 'Description' }
]

// Methods
const goToNextStep = () => {
  if (activeIndex.value < steps.length - 1) activeIndex.value++
}

const goToPrevStep = () => {
  if (activeIndex.value > 0) activeIndex.value--
}

const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    localPreview.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  URL.revokeObjectURL(localPreview.value)
  localPreview.value = ''
}

const handleCreateInstitution = async () => {
  loading.value = true
  try {
    console.log('🏥 [InstitutionForm] Début création institution:', institution.value.Name)

    // Format data before sending
    const dataToSend = {
      ...institution.value,
      ConventionDate: institution.value.ConventionDate
        ? new Date(institution.value.ConventionDate).toLocaleDateString('fr-CA')
        : null,
      AccordCadreDate: institution.value.AccordCadreDate
        ? new Date(institution.value.AccordCadreDate).toLocaleDateString('fr-CA')
        : null,
      ImageURL: institution.value.ImageURL || [], // Ensure ImageURL is an array
      Latitude: institution.value.Latitude === '' ? null : parseFloat(institution.value.Latitude),
      Longitude: institution.value.Longitude === '' ? null : parseFloat(institution.value.Longitude)
    }

    // 1. Create institution record without image URL
    console.log('💾 [InstitutionForm] Création dans Supabase...')
    const newInstitution = await institutionsStore.createInstitution(dataToSend)
    console.log('✅ [InstitutionForm] Institution créée, ID:', newInstitution.InstitutionId)

    // If creation is successful, proceed with image upload if any
    if (newInstitution && newInstitution.InstitutionId) {
      if (imageFile.value) {
        console.log('🖼️ [InstitutionForm] Upload image Supabase...')
        const uploadedFiles = await institutionMediaService.uploadInstitutionImages(
          newInstitution.InstitutionId,
          [imageFile.value]
        )

        // 3. Update the institution with the image URL
        console.log('🔄 [InstitutionForm] Mise à jour avec URL image...')
        await institutionsStore.updateInstitution(newInstitution.InstitutionId, {
          ...newInstitution,
          ImageURL: uploadedFiles.map((file) => file.url)
        })
        console.log('✅ [InstitutionForm] Image enregistrée')
      }
    }

    // Petit délai pour propagation Supabase
    console.log('⏱️ [InstitutionForm] Attente propagation Supabase...')
    await new Promise((resolve) => setTimeout(resolve, 300))

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Institution créée avec succès!',
      life: 3000
    })
    console.log('✅ [InstitutionForm] Redirection vers liste...')
    router.push({ name: 'InstitutionListView' })
  } catch (error) {
    console.error('❌ [InstitutionForm] Erreur détaillée:', error.message)
    toast.add({
      severity: 'error',
      summary: 'Erreur de Création',
      detail: error.message || 'Une erreur est survenue.',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Static Data
const cantons = [
  { code: 'AG', name: 'Argovie' },
  { code: 'AI', name: 'Appenzell Rhodes-Intérieures' },
  { code: 'AR', name: 'Appenzell Rhodes-Extérieures' },
  { code: 'BE', name: 'Berne' },
  { code: 'FR', name: 'Fribourg' },
  { code: 'VS', name: 'Valais' },
  { code: 'VD', name: 'Vaud' },
  { code: 'GE', name: 'Genève' },
  { code: 'ZH', name: 'Zurich' },
  { code: 'NE', name: 'Neuchâtel' },
  { code: 'JU', name: 'Jura' },
  { code: 'LU', name: 'Lucerne' }
]
const categories = [
  { label: 'Institution valaisanne', value: 'Institution valaisanne' },
  { label: 'Cabinet privé valaisan', value: 'Cabinet privé valaisan' },
  { label: 'Institution hors canton', value: 'Institution hors canton' },
  { label: 'Cabinet privé hors canton', value: 'Cabinet privé hors canton' }
]
const langues = [
  { code: 'FR', name: 'Français' },
  { code: 'ALL', name: 'Allemand' },
  { code: 'IT', name: 'Italien' },
  { code: 'ANG', name: 'Anglais' },
  { code: 'BIL', name: 'Bilingue' }
]
</script>

<style scoped>
.institution-form-scroll {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.institution-form-scroll::-webkit-scrollbar {
  display: none;
}
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
.fade-slide-leave-from,
.fade-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.hidden {
  display: none;
}
.text-danger {
  color: #ff5252;
}
</style>
