<template>
  <div class="admin-scrollable">
    <Navbar />
    <div v-if="institution" class="px-4 py-8 md:px-6 lg:px-8">
      <section class="text-center py-5 rounded-lg mb-5 text-white">
        <h1 class="text-5xl font-bold">Modifier l'institution</h1>
      </section>

      <div class="grid">
        <div class="col-12 lg:col-12">
          <div class="card p-4 shadow-lg">
            <h1 class="mb-4">{{ institution.Name }}</h1>
            <div class="flex align-items-center mb-4">
              <h2 class="me-3 mb-0">{{ institution.Locality }}</h2>
              <Badge :value="institution.Canton" class="p-mr-2 p-ml-auto" />
            </div>

            <form @submit.prevent="handleUpdateInstitution" class="p-fluid grid">
              <!-- All form fields here -->
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="name">Nom</label>
                  <InputText id="name" v-model="institution.Name" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="cyberlearn">Descriptif FP (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    @change="onPdfChange"
                    class="p-button-outlined p-mt-2"
                  />
                  <p v-if="institution.CyberleanURL" class="mt-2">
                    PDF actuel: <a :href="institution.CyberleanURL" target="_blank">Voir le PDF</a>
                  </p>
                </div>
              </div>
              <div class="col-12 md:col-4">
                <div class="p-field">
                  <label for="locality">Lieu</label>
                  <InputText id="locality" v-model="institution.Locality" />
                </div>
              </div>
              <div class="col-12 md:col-4">
                <div class="p-field">
                  <label for="canton">Canton</label>
                  <Dropdown
                    id="canton"
                    v-model="institution.Canton"
                    :options="cantons"
                    optionLabel="name"
                    optionValue="code"
                    class="w-full"
                  />
                </div>
              </div>
              <div class="col-12 md:col-4">
                <div class="p-field">
                  <label for="langue">Langue</label>
                  <Dropdown
                    id="langue"
                    v-model="institution.Language"
                    :options="langues"
                    optionLabel="name"
                    optionValue="code"
                    class="w-full"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="address">Adresse</label>
                  <InputText id="address" v-model="institution.Address" />
                </div>
              </div>
              <div class="col-6 md:col-3">
                <div class="p-field">
                  <label for="latitude">Latitude</label>
                  <InputText
                    id="latitude"
                    v-model="institution.Latitude"
                    class="w-full"
                    placeholder="Ex: 46.2331"
                  />
                </div>
              </div>
              <div class="col-6 md:col-3">
                <div class="p-field">
                  <label for="longitude">Longitude</label>
                  <InputText
                    id="longitude"
                    v-model="institution.Longitude"
                    class="w-full"
                    placeholder="Ex: 7.3606"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="url">URL</label>
                  <InputGroup>
                    <InputGroupAddon>www</InputGroupAddon>
                    <InputText id="url" v-model="institution.URL" placeholder="Site Web" />
                  </InputGroup>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="category">Catégorie</label>
                  <InputText id="category" v-model="institution.Category" class="w-full" />
                </div>
              </div>
              <div class="col-12">
                <h4>Médias de l'institution</h4>
                <Divider />
                <div class="text-center">
                  <div class="border-2 border-dashed surface-border rounded-lg p-5 mb-3">
                    <i class="pi pi-image text-5xl"></i>
                    <h6 class="mt-2">
                      Téléchargez les images ici, ou
                      <a href="#!" class="text-primary" @click="triggerImageInput">Parcourir</a>
                    </h6>
                    <input
                      ref="imageInputRef"
                      type="file"
                      accept="image/*"
                      multiple
                      class="hidden"
                      @change="onImageChange"
                    />
                    <p class="mt-2">
                      Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px * 450px.
                    </p>
                  </div>
                  <div v-if="localPreviews.length" class="image-preview">
                    <div v-for="(imageURL, index) in localPreviews" :key="index" class="mb-4">
                      <img :src="imageURL" alt="Aperçu de l'image" class="w-full h-auto mb-2" />
                      <Button
                        type="button"
                        label="Supprimer l'image"
                        class="p-button-danger"
                        @click="removeImage(index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-12 md:col-12">
                <div class="p-field">
                  <label for="description">Description</label>
                  <Textarea id="description" v-model="institution.Description" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="convention">Date de Convention</label>
                  <Calendar
                    id="convention"
                    v-model="institution.ConventionDate"
                    :showIcon="true"
                    placeholder="Date de convention"
                    dateFormat="dd-mm-yy"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="accordCadre">Date de l'Accord Cadre</label>
                  <Calendar
                    id="accordCadre"
                    v-model="institution.AccordCadreDate"
                    :showIcon="true"
                    placeholder="Date de l'accord cadre"
                    dateFormat="dd-mm-yy"
                  />
                </div>
              </div>
              <div class="col-12 md:col-12">
                <div class="p-field">
                  <label for="note">Remarque convention / accord cadre</label>
                  <Textarea id="note" v-model="institution.Note" />
                </div>
              </div>
              <div class="field col-4">
                <label for="nomChef">Nom, Prénom resp phy</label>
                <InputText id="nomChef" v-model="institution.NomChef" class="w-full" />
              </div>
              <div class="field col-4">
                <label for="phoneChef">Téléphone resp phy</label>
                <InputText id="phoneChef" v-model="institution.PhoneChef" class="w-full" />
              </div>
              <div class="field col-4">
                <label for="mailChef">Mail resp phy</label>
                <InputText id="mailChef" v-model="institution.MailChef" class="w-full" />
              </div>
              <div class="col-12">
                <Button
                  type="submit"
                  label="Mettre à jour l'institution"
                  class="p-button-warning mt-3 btn-small"
                />
                <Button label="Retour" class="p-button-secondary mt-3 btn-small" @click="goBack" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center">
      <p>Chargement de l'institution...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useToast } from 'primevue/usetoast'
import { storage } from '../../../../firebase.js'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

// Import PrimeVue components
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import Navbar from '@/components/common/utils/Navbar.vue'
import Divider from 'primevue/divider'

// --- Setup ---
const route = useRoute()
const router = useRouter()
const institutionsStore = useInstitutionsStore()
const toast = useToast()
const institutionId = route.params.id
const INSTITUTIONS_BUCKET = 'institutions'
const API_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:3000/api'
    : '/api')

// --- Reactive State ---
const institution = ref(null)
const pdfFile = ref(null)
const imageFiles = ref([])
const localPreviews = ref([])
const imageInputRef = ref(null)

// --- Date Handling ---
const parseDateLocal = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  // Assuming YYYY-MM-DD format from backend
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
}

const parseCoordinate = (value) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

const cloneInstitution = (data) => {
  const cloned = JSON.parse(JSON.stringify(data))
  cloned.ImageURL = Array.isArray(cloned.ImageURL) ? [...cloned.ImageURL] : []
  cloned.ConventionDate = parseDateLocal(cloned.ConventionDate)
  cloned.AccordCadreDate = parseDateLocal(cloned.AccordCadreDate)
  cloned.Latitude = cloned.Latitude ?? ''
  cloned.Longitude = cloned.Longitude ?? ''
  return cloned
}

const getSupabaseStoragePath = (url, bucket) => {
  if (!url || typeof url !== 'string') return null

  try {
    const parsedUrl = new URL(url)
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = parsedUrl.pathname.indexOf(marker)

    if (index === -1) return null
    return decodeURIComponent(parsedUrl.pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

const uploadImagesToBackend = async (files) => {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))

  const response = await fetch(`${API_URL}/institutions/${institutionId}/images`, {
    method: 'POST',
    body: formData
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || "Erreur lors de l'upload des images.")
  }

  return payload.files || []
}

const deleteSupabaseImageFromBackend = async (imageUrl) => {
  const response = await fetch(`${API_URL}/institutions/${institutionId}/images`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: imageUrl })
  })

  if (response.status === 204) return

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || "Erreur lors de la suppression de l'image.")
  }
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  if (institutionsStore.institutions.length === 0) {
    await institutionsStore.fetchInstitutions()
  }
  const data = institutionsStore.getInstitutionById(institutionId)
  if (data) {
    institution.value = cloneInstitution(data)
    localPreviews.value = [...institution.value.ImageURL]
  } else {
    console.error('Institution not found in store')
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: "Impossible de charger l'institution.",
      life: 4000
    })
  }
})

// --- Methods ---
const triggerImageInput = () => imageInputRef.value.click()
const goBack = () => router.go(-1)

const onPdfChange = (event) => {
  pdfFile.value = event.target.files[0]
}

const onImageChange = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  files.forEach((file) => {
    imageFiles.value.push(file)
    localPreviews.value.push(URL.createObjectURL(file))
  })

  event.target.value = ''
}

const removeImage = async (index) => {
  const urlToRemove = localPreviews.value[index]
  const isLocalPreview = typeof urlToRemove === 'string' && urlToRemove.startsWith('blob:')
  const supabasePath = getSupabaseStoragePath(urlToRemove, INSTITUTIONS_BUCKET)

  if (!isLocalPreview && supabasePath) {
    try {
      await deleteSupabaseImageFromBackend(urlToRemove)
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image Supabase Storage:", error)
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: "La suppression de l'image a échoué.",
        life: 4000
      })
      return
    }
  }

  if (!isLocalPreview && typeof urlToRemove === 'string' && urlToRemove.includes('firebasestorage.googleapis.com')) {
    try {
      await deleteObject(storageRef(storage, urlToRemove))
    } catch (error) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Erreur lors de la suppression de l'image Firebase Storage:", error)
        toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: "La suppression de l'image a échoué.",
          life: 4000
        })
        return
      }
    }
  }

  if (isLocalPreview) {
    URL.revokeObjectURL(urlToRemove)
    const localPreviewUrls = localPreviews.value.filter(
      (url) => typeof url === 'string' && url.startsWith('blob:')
    )
    const newFileIndex = localPreviewUrls.indexOf(urlToRemove)
    if (newFileIndex > -1) {
      imageFiles.value.splice(newFileIndex, 1)
    }
  }

  if (!isLocalPreview) {
    institution.value.ImageURL = (institution.value.ImageURL || []).filter(
      (url) => url !== urlToRemove
    )
  }

  localPreviews.value.splice(index, 1)
}

const handleUpdateInstitution = async () => {
  if (!institution.value) return

  try {
    // 1. Handle PDF Upload to Firebase Storage
    if (pdfFile.value) {
      const pdfStorageRef = storageRef(storage, `Institutions/${institutionId}/cyberlearn.pdf`)
      const pdfSnapshot = await uploadBytes(pdfStorageRef, pdfFile.value)
      institution.value.CyberleanURL = await getDownloadURL(pdfSnapshot.ref)
    }

    // 2. Handle Image Uploads to Firebase Storage
    if (imageFiles.value.length > 0) {
      const uploadedFiles = await uploadImagesToBackend(imageFiles.value)
      institution.value.ImageURL = [
        ...(institution.value.ImageURL || []),
        ...uploadedFiles.map((file) => file.url)
      ]
    }

    const dataToUpdate = {
      ...institution.value,
      ConventionDate: institution.value.ConventionDate
        ? new Date(institution.value.ConventionDate).toLocaleDateString('fr-CA')
        : null,
      AccordCadreDate: institution.value.AccordCadreDate
        ? new Date(institution.value.AccordCadreDate).toLocaleDateString('fr-CA')
        : null,
      Latitude: parseCoordinate(institution.value.Latitude),
      Longitude: parseCoordinate(institution.value.Longitude),
      ImageURL: institution.value.ImageURL || []
    }

    await institutionsStore.updateInstitution(institutionId, dataToUpdate)
    await new Promise((resolve) => setTimeout(resolve, 300))

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Institution mise à jour avec succès!',
      life: 3000
    })
    router.push({ name: 'InstitutionListView' })
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || "Erreur lors de la mise à jour de l'institution.",
      life: 5000
    })
  } finally {
    imageFiles.value = []
  }
}

// --- Static Data ---
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
  { code: 'LU', name: 'Lucerne' },
  { code: 'ET', name: 'Étranger' }
]
const langues = [
  { code: 'FR', name: 'Français' },
  { code: 'ALL', name: 'Allemand' },
  { code: 'IT', name: 'Italien' },
  { code: 'ANG', name: 'Anglais' },
  { code: 'ES', name: 'Espagnol' },
  { code: 'BIL', name: 'Bilingue' }
]
</script>

<style scoped>
.hidden {
  display: none;
}
.image-preview img {
  max-width: 30%;
  height: auto;
  border-radius: 8px;
}
.btn-small {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}
.admin-scrollable {
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 2rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.p-field {
  margin-bottom: 1rem;
}
</style>
