
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
                  <input type="file" accept="application/pdf" @change="onPdfChange" class="p-button-outlined p-mt-2" />
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
                  <Dropdown id="canton" v-model="institution.Canton" :options="cantons" optionLabel="name" optionValue="code" class="w-full" />
                </div>
              </div>
              <div class="col-12 md:col-4">
                <div class="p-field">
                  <label for="langue">Langue</label>
                  <Dropdown id="langue" v-model="institution.Language" :options="langues" optionLabel="name" optionValue="code" class="w-full" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="address">Adresse</label>
                  <InputText id="address" v-model="institution.Address" />
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
                    <h6 class="mt-2">Téléchargez les images ici, ou <a href="#!" class="text-primary" @click="triggerImageInput">Parcourir</a></h6>
                    <input ref="imageInputRef" type="file" accept="image/*" multiple class="hidden" @change="onImageChange" />
                    <p class="mt-2">Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px * 450px.</p>
                  </div>
                  <div v-if="localPreviews.length" class="image-preview">
                    <div v-for="(imageURL, index) in localPreviews" :key="index" class="mb-4">
                      <img :src="imageURL" alt="Aperçu de l'image" class="w-full h-auto mb-2" />
                      <Button type="button" label="Supprimer l'image" class="p-button-danger" @click="removeImage(index)" />
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
                  <Calendar id="convention" v-model="institution.ConventionDate" :showIcon="true" placeholder="Date de convention" dateFormat="dd-mm-yy" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="accordCadre">Date de l'Accord Cadre</label>
                  <Calendar id="accordCadre" v-model="institution.AccordCadreDate" :showIcon="true" placeholder="Date de l'accord cadre" dateFormat="dd-mm-yy" />
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
                <Button type="submit" label="Mettre à jour l'institution" class="p-button-warning mt-3 btn-small" />
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useInstitutionsStore } from '@/stores/institutionsStore';
import { useToast } from 'primevue/usetoast';
import { storage } from "../../../../firebase.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Import PrimeVue components
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Button from "primevue/button";
import Badge from "primevue/badge";
import Calendar from "primevue/calendar";
import Textarea from "primevue/textarea";
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";
import Navbar from "@/components/common/utils/Navbar.vue";
import Divider from "primevue/divider";

// --- Setup ---
const route = useRoute();
const router = useRouter();
const institutionsStore = useInstitutionsStore();
const toast = useToast();
const institutionId = route.params.id;

// --- Reactive State ---
const institution = ref(null);
const pdfFile = ref(null);
const imageFiles = ref([]);
const localPreviews = ref([]);
const imageInputRef = ref(null);

// --- Date Handling ---
const parseDateLocal = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  // Assuming YYYY-MM-DD format from backend
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  if (institutionsStore.institutions.length === 0) {
    await institutionsStore.fetchInstitutions();
  }
  const data = institutionsStore.institutions.find(i => i.InstitutionId === institutionId);
  if (data) {
    institution.value = JSON.parse(JSON.stringify(data)); // Deep copy
    // Convert date strings to Date objects for Calendar component
    institution.value.ConventionDate = parseDateLocal(institution.value.ConventionDate);
    institution.value.AccordCadreDate = parseDateLocal(institution.value.AccordCadreDate);
    // Set initial image previews
    if (institution.value.ImageURL && Array.isArray(institution.value.ImageURL)) {
      localPreviews.value = [...institution.value.ImageURL];
    }
  } else {
    console.error("Institution not found in store");
  }
});

// --- Methods ---
const triggerImageInput = () => imageInputRef.value.click();
const goBack = () => router.go(-1);

const onPdfChange = (event) => {
  pdfFile.value = event.target.files[0];
};

const onImageChange = (event) => {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    imageFiles.value.push(file);
    localPreviews.value.push(URL.createObjectURL(file));
  });
};

const removeImage = async (index) => {
  const urlToRemove = localPreviews.value[index];

  // If it's a firebase URL, delete from storage
  if (urlToRemove.includes('firebasestorage.googleapis.com')) {
    try {
      const imageHttpRef = storageRef(storage, urlToRemove);
      await deleteObject(imageHttpRef);
    } catch (error) {
      // Ignore object-not-found error, as it might have been deleted already or never existed
      if (error.code !== 'storage/object-not-found') {
        console.error("Erreur lors de la suppression de l'image de Firebase Storage:", error);
        // Optionally, alert the user that the deletion failed
        alert("La suppression de l'image du serveur a échoué.");
        return; // Stop execution if deletion fails for other reasons
      }
    }
  } else {
    // If it's a local blob URL, revoke it and remove the corresponding file from the upload queue
    URL.revokeObjectURL(urlToRemove);
    const fileIndex = localPreviews.value.indexOf(urlToRemove);
    if(fileIndex > -1) {
        // This logic assumes a 1-to-1 mapping between new files and blob previews
        // A more robust implementation might be needed if the order can change
        const newFileIndex = fileIndex - (institution.value.ImageURL?.length || 0);
        if(newFileIndex >= 0 && newFileIndex < imageFiles.value.length) {
            imageFiles.value.splice(newFileIndex, 1);
        }
    }
  }

  // Remove from the institution's data model
  const imageUrlIndex = institution.value.ImageURL.indexOf(urlToRemove);
  if (imageUrlIndex > -1) {
    institution.value.ImageURL.splice(imageUrlIndex, 1);
  }

  // Remove from the preview list
  localPreviews.value.splice(index, 1);
};

const handleUpdateInstitution = async () => {
  if (!institution.value) return;

  try {
    // 1. Handle PDF Upload to Firebase Storage
    if (pdfFile.value) {
      const pdfStorageRef = storageRef(storage, `Institutions/${institutionId}/cyberlearn.pdf`);
      const pdfSnapshot = await uploadBytes(pdfStorageRef, pdfFile.value);
      institution.value.CyberleanURL = await getDownloadURL(pdfSnapshot.ref);
    }

    // 2. Handle Image Uploads to Firebase Storage
    if (imageFiles.value.length > 0) {
        const uploadPromises = imageFiles.value.map(file => {
            const imgStorageRef = storageRef(storage, `Institutions/${institutionId}/${file.name}`);
            return uploadBytes(imgStorageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
        });
        const newImageUrls = await Promise.all(uploadPromises);
        // Combine old and new URLs
        institution.value.ImageURL = [...(institution.value.ImageURL || []), ...newImageUrls];
    }

    // 3. Prepare data for the store (format dates back to string YYYY-MM-DD)
    const dataToUpdate = {
      ...institution.value,
      ConventionDate: institution.value.ConventionDate ? new Date(institution.value.ConventionDate).toLocaleDateString('fr-CA') : null,
      AccordCadreDate: institution.value.AccordCadreDate ? new Date(institution.value.AccordCadreDate).toLocaleDateString('fr-CA') : null,
    };

    // 4. Update data via Pinia Store
    await institutionsStore.updateInstitution(institutionId, dataToUpdate);

    // Petit délai pour propagation Supabase
    console.log('⏱️ [InstitutionFormModif] Attente propagation Supabase...');
    await new Promise(resolve => setTimeout(resolve, 300));

    toast.add({ severity: 'success', summary: 'Succès', detail: 'Institution mise à jour avec succès!', life: 3000 });
    console.log('✅ [InstitutionFormModif] Redirection vers liste...');
    router.push({ name: 'InstitutionListView' });

  } catch (error) {
    console.error("Erreur lors de la mise à jour:", error);
    alert("Erreur lors de la mise à jour de l’institution.");
  }
};

// --- Static Data ---
const cantons = [{ code: "AG", name: "Argovie" }, { code: "AI", name: "Appenzell Rhodes-Intérieures" }, { code: "AR", name: "Appenzell Rhodes-Extérieures" }, { code: "BE", name: "Berne" }, { code: "FR", name: "Fribourg" }, { code: "VS", name: "Valais" }, { code: "VD", name: "Vaud" }, { code: "GE", name: "Genève" }, { code: "ZH", name: "Zurich" }, { code: "NE", name: "Neuchâtel" }, { code: "JU", name: "Jura" }, { code: "LU", name: "Lucerne" }, { code: "ET", name: "Étranger" }];
const langues = [{ code: "FR", name: "Français" }, { code: "ALL", name: "Allemand" }, { code: "IT", name: "Italien" }, { code: "ANG", name: "Anglais" }, { code: "BIL", name: "Bilingue" }];

</script>

<style scoped>
.hidden { display: none; }
.image-preview img { max-width: 30%; height: auto; border-radius: 8px; }
.btn-small { font-size: 0.875rem; padding: 0.5rem 1rem; }
.admin-scrollable { height: 100vh; overflow-y: auto; padding-bottom: 2rem; scrollbar-width: none; -ms-overflow-style: none; }
.admin-scrollable::-webkit-scrollbar { display: none; }
.p-field { margin-bottom: 1rem; }
</style>
