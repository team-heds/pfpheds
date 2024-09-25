<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
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

          <div class="p-fluid grid">
            <!-- Nom -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="name">Nom</label>
                <InputText id="name" v-model="institution.Name" />
              </div>
            </div>

            <!-- Téléchargement du PDF pour Cyberlearn -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="cyberlearn">Descriptif FP (PDF)</label>
                <input type="file" accept="application/pdf" @change="onPdfChange" class="p-button-outlined p-mt-2" />
                <p v-if="institution.CyberlearnURL" class="mt-2">
                  PDF actuel : <a :href="institution.CyberlearnURL" target="_blank">Voir le PDF</a>
                </p>
              </div>
            </div>

            <!-- Lieu -->
            <div class="col-12 md:col-4">
              <div class="p-field">
                <label for="lieu">Lieu</label>
                <InputText id="locality" v-model="institution.Locality" />
              </div>
            </div>

            <!-- Canton -->
            <div class="col-12 md:col-4">
              <div class="p-field">
                <label for="canton">Canton</label>
                <InputText id="canton" v-model="institution.Canton" />
              </div>
            </div>

            <!-- Langue -->
            <div class="col-12 md:col-4">
              <div class="p-field">
                <label for="langue">Langue</label>
                <InputText id="language" v-model="institution.Language" />
              </div>
            </div>

            <!-- Rue -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="street">Rue</label>
                <InputText id="street" v-model="institution.Address" />
              </div>
            </div>

            <!-- URL -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="url">URL</label>
                <InputGroup>
                  <InputGroupAddon>www</InputGroupAddon>
                  <InputText id="url" v-model="institution.URL" placeholder="Site Web" />
                </InputGroup>
              </div>
            </div>

            <!-- Catégorie -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="categorie">Catégorie</label>
                <InputText id="categorie" v-model="institution.Category" :options="categories" optionLabel="label" optionValue="value" class="w-full" />
              </div>
            </div>

            <!-- Téléchargement de l'image -->
            <div class="col-12">
              <h4>Médias de l'institution</h4>
              <Divider />
              <div class="text-center">
                <div class="border-2 border-dashed surface-border rounded-lg p-5 mb-3">
                  <i class="pi pi-image text-5xl"></i>
                  <h6 class="mt-2">
                    Téléchargez l'image de l'institution ici, ou <a href="#!" class="text-primary" @click="triggerImageInput">Parcourir</a>
                  </h6>
                  <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onImageChange" />
                  <p class="mt-2">Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px * 450px.</p>
                </div>
                <div v-if="institution.ImageURL" class="image-preview">
                  <img :src="institution.ImageURL" alt="Image de l'institution" class="w-full h-auto" />
                  <Button type="button" label="Supprimer l'image" class="p-button-danger mt-2" icon="pi pi-trash" @click="removeImage" />
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="col-12 md:col-12">
              <div class="p-field">
                <label for="remarque">Description</label>
                <Textarea id="remarque" v-model="institution.Description" />
              </div>
            </div>

            <!-- Convention -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="convention">Convention</label>
                <Calendar id="convention" v-model="institution.ConventionDate" dateFormat="yy-mm-dd" />
              </div>
            </div>

            <!-- Accord Cadre -->
            <div class="col-12 md:col-6">
              <div class="p-field">
                <label for="accordCadre">Accord Cadre</label>
                <Calendar id="accordCadre" v-model="institution.AccordCadreDate" dateFormat="yy-mm-dd" />
              </div>
            </div>

            <!-- Remarque sur la convention / accord cadre -->
            <div class="col-12 md:col-12">
              <div class="p-field">
                <label for="remarque">Remarque convention / accord cadre</label>
                <Textarea id="remarque" v-model="institution.Note" />
              </div>
            </div>

            <!-- Section des stages -->
            <div class="col-12">
              <div v-for="(stage, index) in institution.stages" :key="stage.id" class="p-mb-4 stage-form">
                <h2>Place de stage</h2>
                <div class="grid">
                  <div class="col-12 md:col-6">
                    <div class="p-field">
                      <label>Nom de la place</label>
                      <InputText v-model="stage.Sector" />
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="p-field">
                      <label>Praticien.ne Formateur.trice</label>
                      <Dropdown v-model="stage.NpmPractitionerTrainers" :options="availablePractitioners" optionLabel="fullName" optionValue="fullName" multiple placeholder="Sélectionner des praticiens" class="w-full" />
                    </div>
                  </div>
                  <!-- Checkbox pour les stages -->
                  <div class="col-12 md:col-4">
                    <div class="p-field-checkbox">
                      <Checkbox v-model="stage.AIGU" />
                      <label>AIGU</label>
                    </div>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="p-field-checkbox">
                      <Checkbox v-model="stage.AMBU" />
                      <label>AMBU</label>
                    </div>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="p-field-checkbox">
                      <Checkbox v-model="stage.MSQ" />
                      <label>MSQ</label>
                    </div>
                  </div>
                </div>
                <Button label="Supprimer" class="p-button-danger mt-3 btn-small" @click="supprimerStage(stage.id)" />
              </div>
            </div>

            <!-- Bouton pour ajouter un nouveau stage -->
            <div class="col-12">
              <Button label="Ajouter une place de stage" class="p-button-primary mt-3 btn-small" @click="toggleStageForm" />
            </div>

            <!-- Formulaire pour un nouveau stage -->
            <div class="col-12" v-if="showStageForm">
              <div class="p-mb-4 stage-form">
                <h2>Nouvelle place de stage</h2>
                <div class="grid">
                  <div class="col-12 md:col-6">
                    <div class="p-field">
                      <label>Nom de la place</label>
                      <InputText v-model="newStage.Sector" />
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="p-field">
                      <label>Praticien.ne Formateur.trice</label>
                      <MultiSelect v-model="newStage.NpmPractitionerTrainers" :options="availablePractitioners" optionLabel="fullName" optionValue="fullName" multiple placeholder="Sélectionner des praticiens" class="w-full" />
                    </div>
                  </div>
                </div>
                <Button label="Ajouter" class="p-button-primary mt-3 btn-small" @click="ajouterPlaceDeStage" />
              </div>
            </div>

            <!-- Boutons de soumission -->
            <div class="col-12">
              <Button label="Mettre à jour l'institution" class="p-button-warning mt-3 btn-small" @click="updateInstitution" />
              <Button label="Retour" class="p-button-secondary mt-3 btn-small" @click="goBack" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, set, remove } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Badge from 'primevue/badge';
import Calendar from 'primevue/calendar';
import Textarea from 'primevue/textarea';

export default {
  name: 'InstitutionFormModif',
  components: {
    InputText,
    Dropdown,
    Checkbox,
    Button,
    Badge,
    Calendar,
    Textarea,
  },
  data() {
    return {
      institution: {
        CyberlearnURL: '',
        Name: '',
        Lieu: '',
        Canton: '',
        Description: '',
        Street: '',
        URL: '',
        Categorie: '',
        Convention: null,
        AccordCadre: null,
        Note: '',
        Langue: '',
        ImageURL: '',
        stages: [],
        key: '',
      },
      newStage: {
        Sector: '',
        NpmPractitionerTrainers: [],
        AIGU: false,
        AMBU: false,
        MSQ: false,
      },
      pdfFile: null, // Pour stocker le fichier PDF sélectionné
      imageFile: null, // Pour stocker l'image sélectionnée
      showStageForm: false,
      cantons: [
        { name: 'Argovie', code: 'AG' },
        { name: 'Valais', code: 'VS' },
        { name: 'Genève', code: 'GE' },
        // Ajouter d'autres cantons
      ],
      langues: [
        { name: 'Français', code: 'FR' },
        { name: 'Allemand', code: 'ALL' },
      ],
      categories: [
        { label: 'Institution valaisanne', value: 'valaisanne' },
        { label: 'Cabinet privé', value: 'prive' },
      ],
      availablePractitioners: [],
    };
  },
  methods: {
    async updateInstitution() {
      try {
        const instRef = ref(db, 'Institutions/' + this.$route.params.id);

        if (this.pdfFile) {
          const storage = getStorage();
          const pdfRef = storageRef(storage, `Institutions/${this.$route.params.id}/cyberlearn.pdf`);
          await uploadBytes(pdfRef, this.pdfFile);
          const pdfURL = await getDownloadURL(pdfRef);
          this.institution.CyberlearnURL = pdfURL;
        }

        if (this.imageFile) {
          const storage = getStorage();
          const imageRef = storageRef(storage, `Institutions/${this.$route.params.id}/image`);
          await uploadBytes(imageRef, this.imageFile);
          const imageURL = await getDownloadURL(imageRef);
          this.institution.ImageURL = imageURL;
        }

        await set(instRef, this.institution);
        alert('Institution mise à jour avec succès.');
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    },
    async onPdfChange(event) {
      this.pdfFile = event.target.files[0];
    },
    async onImageChange(event) {
      this.imageFile = event.target.files[0];
      this.institution.ImageURL = URL.createObjectURL(this.imageFile); // Prévisualisation de l'image localement
    },
    async removeImage() {
      this.imageFile = null;
      this.institution.ImageURL = '';
    },
    ajouterPlaceDeStage() {
      this.institution.stages.push({ ...this.newStage });
      this.newStage = {
        Sector: '',
        NpmPractitionerTrainers: [],
        AIGU: false,
        AMBU: false,
        MSQ: false,
      };
      this.showStageForm = false;
    },
    supprimerStage(stageId) {
      this.institution.stages = this.institution.stages.filter((stage) => stage.id !== stageId);
    },
    goBack() {
      this.$router.go(-1);
    },
    loadInstitutionData() {
      const instRef = ref(db, 'Institutions/' + this.$route.params.id);
      onValue(instRef, (snapshot) => {
        if (snapshot.exists()) {
          this.institution = snapshot.val();
        }
      });
    },
    loadAvailablePractitioners() {
      const practitionersRef = ref(db, 'practitioners');
      onValue(practitionersRef, (snapshot) => {
        if (snapshot.exists()) {
          this.availablePractitioners = Object.values(snapshot.val());
        }
      });
    },
  },
  mounted() {
    this.loadInstitutionData();
    this.loadAvailablePractitioners();
  },
};
</script>

<style scoped>
.stage-form {
  border: 1px solid #e0e0e0;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 0.5rem;
}

.hidden {
  display: none;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.btn-small {
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
}
</style>
