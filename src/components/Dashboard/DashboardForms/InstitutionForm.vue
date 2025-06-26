<template>
  <Navbar />
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8 institution-form-scroll">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-5xl font-bold">Soumettre une nouvelle institution</h1>
    </section>

    <section class="mt-5">
      <div class="text-center mb-5">
        <p>
          Utilisez cette interface pour ajouter une nouvelle institution au
          portail. Une fois que vous avez terminé, l'institution sera examinée
          pour la qualité. Si approuvée, elle apparaîtra dans la liste et vous
          serez informé par e-mail.
        </p>
      </div>

      <div class="card p-4">
        <!-- Étapes -->
        <Steps :model="steps" :activeIndex="activeIndex" class="mb-5" />

        <div class="p-fluid">
          <form @submit.prevent="envoyerDonnees">
            <transition name="fade-slide" mode="out-in">
              <!-- Étape 1 : Détails de l'institution -->
              <div v-if="activeIndex === 0" key="etape1">
                <h4>Détails de l'institution</h4>
                <Divider />
                <div class="grid formgrid">
                  <div class="field col-12 md:col-6">
                    <label for="name">Nom de l'institution <span class="text-danger">*</span></label>
                    <InputText id="name" v-model="institution.Name" class="w-full" required :class="{'p-invalid': submitted && !institution.Name}" placeholder="Nom de l'institution" />
                    <small v-if="submitted && !institution.Name" class="p-error">Champ requis</small>
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="langue">Langue <span class="text-danger">*</span></label>
                    <Dropdown id="langue" v-model="institution.Language" :options="langues" optionLabel="name" optionValue="code" class="w-full" required :class="{'p-invalid': submitted && !institution.Language}" placeholder="Sélectionner la langue" />
                    <small v-if="submitted && !institution.Language" class="p-error">Champ requis</small>
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="locality">Localité <span class="text-danger">*</span></label>
                    <InputText id="locality" v-model="institution.Locality" class="w-full" required :class="{'p-invalid': submitted && !institution.Locality}" placeholder="Localité" />
                    <small v-if="submitted && !institution.Locality" class="p-error">Champ requis</small>
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="canton">Canton <span class="text-danger">*</span></label>
                    <Dropdown id="canton" v-model="institution.Canton" :options="cantons" optionLabel="name" optionValue="code" class="w-full" required :class="{'p-invalid': submitted && !institution.Canton}" placeholder="Sélectionner le canton" />
                    <small v-if="submitted && !institution.Canton" class="p-error">Champ requis</small>
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="address">Adresse</label>
                    <InputText id="address" v-model="institution.Address" class="w-full" placeholder="Adresse" />
                  </div>
                  <div class="field col-6 md:col-3">
                    <label for="latitude">Latitude</label>
                    <InputText id="latitude" v-model="institution.Latitude" class="w-full" placeholder="Ex: 48.8566" />
                  </div>
                  <div class="field col-6 md:col-3">
                    <label for="longitude">Longitude</label>
                    <InputText id="longitude" v-model="institution.Longitude" class="w-full" placeholder="Ex: 2.3522" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="url">URL</label>
                    <InputText id="url" v-model="institution.URL" class="w-full" placeholder="URL" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="nomchef">Nom, Prénom du chef</label>
                    <InputText id="nomchef" v-model="institution.NomChef" class="w-full" placeholder="Nom, Prénom du chef" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="phonechef">Téléphone du chef</label>
                    <InputText id="phonechef" v-model="institution.PhoneChef" class="w-full" placeholder="Téléphone du chef" />
                  </div>
                  <div class="field col-12 md:col-4">
                    <label for="mailchef">Mail du chef</label>
                    <InputText id="mailchef" v-model="institution.MailChef" class="w-full" placeholder="Mail du chef" />
                  </div>
                  <div class="col-12">
                    <label for="description">Description</label>
                    <Textarea id="description" v-model="institution.Description" rows="3" class="w-full" placeholder="Décrivez brièvement l'institution" />
                  </div>
                </div>
              </div>
              <!-- Étape 2 : Informations supplémentaires -->
              <div v-else-if="activeIndex === 1" key="etape2">
                <h4>Informations supplémentaires</h4>
                <Divider />
                <div class="grid formgrid">
                  <div class="field col-12 md:col-6">
                    <label for="institutionId">ID Institution</label>
                    <div class="flex align-items-center mb-2" style="gap:0.5rem;">
                      <Checkbox v-model="manualInstitutionId" :binary="true" inputId="manualIdCheckbox" />
                      <label for="manualIdCheckbox" class="text-xs">Définir manuellement</label>
                    </div>
                    <InputText id="institutionId"
                      v-model="institution.InstitutionId"
                      :disabled="!manualInstitutionId"
                      class="w-full"
                      :style="!manualInstitutionId ? 'background:#eee;color:#888;' : ''"
                    />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="category">Catégorie</label>
                    <Dropdown id="category" v-model="institution.Category" :options="categories" optionLabel="label" optionValue="value" class="w-full" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="conventionDate">Date de Convention</label>
                    <Calendar id="conventionDate" v-model="institution.ConventionDate" :showIcon="true" placeholder="Date de convention" dateFormat="dd-mm-yy" />
                  </div>
                  <div class="field col-12 md:col-6">
                    <label for="accordCadreDate">Date de l'Accord Cadre</label>
                    <Calendar id="accordCadreDate" v-model="institution.AccordCadreDate" :showIcon="true" placeholder="Date de l'accord cadre" dateFormat="dd-mm-yy" />
                  </div>
                  <div class="field col-12">
                    <label for="note">Remarques</label>
                    <Textarea id="note" v-model="institution.Note" />
                  </div>
                </div>
              </div>
              <!-- Étape 3 : Médias -->
              <div v-else-if="activeIndex === 2" key="etape3">
                <h4>Médias de l'institution</h4>
                <Divider />
                <div class="text-center">
                  <div class="border-2 border-dashed surface-border rounded-lg p-5 mb-3">
                    <i class="pi pi-image text-5xl"></i>
                    <h6 class="mt-2">
                      Téléchargez l'image de l'institution ici, ou <a href="#" class="text-primary" @click.prevent="$refs.fileInput.click()">Parcourir</a>
                    </h6>
                    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                    <p class="mt-2">Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px * 450px.</p>
                    <img v-if="institution.ImageURL" :src="institution.ImageURL" alt="Preview" class="mt-3 mx-auto" style="max-width:200px;max-height:150px;border-radius:8px;" />
                  </div>
                  <Button v-if="institution.ImageURL" type="button" label="Supprimer l'image" class="p-button-danger mt-2" icon="pi pi-trash" @click="removeImage" />
                </div>
                <div class="field mt-4">
                  <label for="imageUrl">URL de l'image</label>
                  <InputText id="imageUrl" v-model="institution.ImageURL" class="w-full" readonly />
                </div>
              </div>
              <!-- Étape 4 : Description -->
              <div v-else-if="activeIndex === 3" key="etape4">
                <h4>Description</h4>
                <Divider />
                <div class="field">
                  <label for="description">Description du lieu</label>
                  <Textarea id="description" v-model="institution.Description" rows="5" class="w-full" placeholder="Entrez la description du lieu ici..."></Textarea>
                </div>
              </div>
            </transition>
            <!-- Boutons de navigation -->
            <div class="flex justify-content-between mt-5">
              <Button v-if="activeIndex > 0" type="button" label="Précédent" class="p-button-secondary" @click="goToPrevStep" />
              <Button v-if="activeIndex < steps.length - 1" type="button" label="Suivant" class="p-button-primary ml-auto" @click="goToNextStep" />
              <Button v-if="activeIndex === steps.length - 1" type="submit" label="Envoyer" class="p-button-primary ml-auto" :disabled="loading" />
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { db , storage } from '../../../../firebase.js';
import { ref, set, push } from "firebase/database";
import {  ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Calendar from 'primevue/calendar';
import Navbar from '@/components/Utils/Navbar.vue'
import Checkbox from 'primevue/checkbox';

function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default {
  name: 'InstitutionForm',
  components: {
    Navbar,
    Steps,
    InputText,
    Textarea,
    Dropdown,
    Button,
    Divider,
    Calendar,
    Checkbox,
  },
  data() {
    return {
      activeIndex: 0,
      submitted: false,
      steps: [
        { label: 'Détails de l\'institution' },
        { label: 'Informations supplémentaires' },
        { label: 'Médias' },
        { label: 'Description' },
      ],
      institution: {
        CyberlearnURL: '',
        Name: '',
        Locality: '',
        Canton: '',
        Description: '',
        URL: '',
        Category: '',
        Latitude: '',
        Longitude: '',
        Language: '',
        ImageURL: '',
        ConventionDate: null,
        AccordCadreDate: null,
        Note: '',
        MailChef: '',
        NomChef: '',
        PhoneChef: '',
      },
      imageFile: null,
      manualInstitutionId: false,
      cantons: [
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
        { code: 'LU', name: 'Lucerne'}
        // Ajouter d'autres cantons si nécessaire
      ],
      categories: [
        { label: 'Institution valaisanne', value: 'Institution valaisanne' },
        { label: 'Cabinet privé valaisan', value: 'Cabinet privé valaisan' },
        { label: 'Institution hors canton', value: 'Institution hors canton' },
        { label: 'Cabinet privé hors canton', value: 'Cabinet privé hors canton' },
      ],
      langues: [
        { code: 'FR', name: 'Français' },
        { code: 'ALL', name: 'Allemand' },
        { code: 'IT', name: 'Italien' },
        { code: 'ANG', name: 'Anglais' },
        { code: 'BIL', name: 'Bilingue' }
      ],
      errorMsg: '',
      loading: false,
    };
  },
  methods: {
    goToNextStep() {
      if (this.activeIndex < this.steps.length - 1) {
        this.activeIndex++;
      }
    },
    goToPrevStep() {
      if (this.activeIndex > 0) {
        this.activeIndex--;
      }
    },
    async envoyerDonnees() {
      this.submitted = true;
      this.errorMsg = '';
      // Validation simple des champs requis de la première étape
      if (!this.institution.Name || !this.institution.Language || !this.institution.Locality || !this.institution.Canton) {
        this.activeIndex = 0;
        this.errorMsg = 'Veuillez remplir tous les champs obligatoires.';
        return;
      }
      this.loading = true;
      try {
        // Conversion des dates en string ISO (yyyy-mm-dd)
        const dataToSend = {
          ...this.institution,
          ConventionDate: this.institution.ConventionDate
            ? this.institution.ConventionDate.toLocaleDateString('fr-CA')
            : '',
          AccordCadreDate: this.institution.AccordCadreDate
            ? this.institution.AccordCadreDate.toLocaleDateString('fr-CA')
            : '',
        };
        const newInstRef = push(ref(db, 'Institutions'));
        const newInstKey = newInstRef.key;
        dataToSend.key = newInstKey;
        // Upload de l'image si sélectionnée
        if (this.imageFile) {
          const imageRef = storageRef(storage, `Institutions/${newInstKey}/image`);
          await uploadBytes(imageRef, this.imageFile);
          const imageURL = await getDownloadURL(imageRef);
          dataToSend.ImageURL = imageURL;
        }
        await set(newInstRef, dataToSend);
        this.$router.push('/institution_list');
      } catch (error) {
        this.errorMsg = "Erreur lors de l'envoi des données : " + error.message;
        console.error("Erreur lors de l'envoi des données :", error);
      } finally {
        this.loading = false;
      }
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.imageFile = file;
        this.institution.ImageURL = URL.createObjectURL(file);
      }
    },
    removeImage() {
      this.imageFile = null;
      this.institution.ImageURL = '';
    },
  },
  mounted() {
    if (this.institution.ConventionDate && typeof this.institution.ConventionDate === 'string') {
      this.institution.ConventionDate = parseDateLocal(this.institution.ConventionDate);
    }
    if (this.institution.AccordCadreDate && typeof this.institution.AccordCadreDate === 'string') {
      this.institution.AccordCadreDate = parseDateLocal(this.institution.AccordCadreDate);
    }
  },
};
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
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
}
.fade-slide-enter-from, .fade-slide-leave-to {
  opacity: 0;
  transform: translateX(50px);
}
.fade-slide-leave-from, .fade-slide-enter-to {
  opacity: 1;
  transform: translateX(0);
}
.hidden {
  display: none;
}
.text-danger { color: #ff5252; }
</style>
