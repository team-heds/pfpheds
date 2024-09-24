<template>
  <div class="surface-section px-4 py-8 md:px-6 lg:px-8">
    <section class="text-white text-center py-5 rounded-lg">
      <h1 class="text-5xl font-bold">Soumettre une nouvelle institution</h1>
    </section>

    <section class="mt-5">
      <div class="text-center mb-5">
        <p>Utilisez cette interface pour ajouter une nouvelle institution au portail. Une fois que vous avez terminé, l'institution sera examinée pour la qualité. Si approuvée, elle apparaîtra dans la liste et vous serez informé par e-mail.</p>
      </div>

      <div class="card p-4">
        <Steps :model="steps" :activeIndex="activeIndex" class="mb-5" />
        <div class="p-fluid">
          <form @submit.prevent="envoyerDonnees">
            <!-- Détails de l'institution -->
            <div v-if="activeIndex === 0">
              <h4>Détail de l'institution</h4>
              <Divider />
              <div class="grid formgrid">
                <div class="field col-12">
                  <label for="name">Nom</label>
                  <InputText id="name" v-model="institution.Name" class="w-full" />
                </div>
                <div class="field col-6">
                  <label for="cyberlearn">Cyberlearn</label>
                  <InputGroup>
                    <InputGroupAddon>www</InputGroupAddon>
                    <InputText id="cyberlearn" v-model="institution.Cyberlearn" class="w-full" />
                  </InputGroup>
                </div>
                <div class="field col-6">
                  <label for="url">URL</label>
                  <InputGroup>
                    <InputGroupAddon>www</InputGroupAddon>
                    <InputText id="url" v-model="institution.URL" class="w-full" />
                  </InputGroup>
                </div>
                <div class="field col-6">
                  <label for="lieu">Lieu</label>
                  <InputText id="lieu" v-model="institution.Lieu" class="w-full" />
                </div>
                <div class="field col-6">
                  <label for="canton">Canton</label>
                  <Dropdown id="canton" v-model="institution.Canton" :options="cantons" optionLabel="name" optionValue="name" class="w-full" />
                </div>
                <div class="field col-6">
                  <label for="street">Rue</label>
                  <InputText id="street" v-model="institution.Street" class="w-full" />
                </div>
                <div class="field col-3">
                  <label for="latitude">Latitude</label>
                  <InputText id="latitude" v-model="institution.Latitude" class="w-full" placeholder="Ex: 48.8566" />
                </div>
                <div class="field col-3">
                  <label for="longitude">Longitude</label>
                  <InputText id="longitude" v-model="institution.Longitude" class="w-full" placeholder="Ex: 2.3522" />
                </div>
                <div class="col-12">
                  <label for="description">Description</label>
                  <Textarea id="description" v-model="institution.Description" rows="3" class="w-full" />
                </div>
              </div>
            </div>

            <!-- Informations supplémentaires -->
            <div v-if="activeIndex === 1">
              <h4>Informations supplémentaires</h4>
              <Divider />
              <div class="grid formgrid">
                <div class="col-12 md:col-6">
                  <label for="key">ID</label>
                  <InputText id="key" v-model="institution.key" />
                </div>
                <div class="col-12 md:col-6">
                  <label for="categorie">Catégorie</label>
                  <Dropdown id="categorie" v-model="institution.Categorie" :options="categories" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div class="col-12 md:col-6">
                  <label for="convention">Convention</label>
                  <Calendar id="convention" v-model="institution.Convention" dateFormat="yy-mm-dd" />
                </div>
                <div class="col-12 md:col-6">
                  <label for="accordCadre">Accord Cadre</label>
                  <Calendar id="accordCadre" v-model="institution.AccordCadre" dateFormat="yy-mm-dd" />
                </div>
                <div class="col-12">
                  <label for="remarque">Remarque convention / accord cadre</label>
                  <Textarea id="remarque" v-model="institution.Remarque" />
                </div>
                <div class="col-12 md:col-8">
                  <label for="nomResponsablePhysio">Nom Responsable Physio</label>
                  <InputText id="nomResponsablePhysio" v-model="institution.NomResponsablePhysio" class="w-full" />
                </div>
                <div class="col-12 md:col-4">
                  <div class="p-field">
                    <label for="canton">Langue</label>
                    <Dropdown id="langue" v-model="institution.Language" :options="langues" optionLabel="name" optionValue="name" class="w-full" />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <label for="phoneResponsablePhysio">Téléphone Responsable Physio</label>
                  <InputText id="phoneResponsablePhysio" v-model="institution.PhoneResponsablePhysio" class="w-full" />
                </div>
                <div class="col-12 md:col-6">
                  <label for="emailResponsablePhysio">Email Responsable Physio</label>
                  <InputText id="emailResponsablePhysio" v-model="institution.EmailResponsablePhysio" type="email" class="w-full" />
                </div>
              </div>
            </div>

            <!-- Médias de l'institution -->
            <div v-if="activeIndex === 2">
              <h4>Médias de l'institution</h4>
              <Divider />
              <div class="text-center">
                <div class="border-2 border-dashed surface-border rounded-lg p-5 mb-3">
                  <i class="pi pi-image text-5xl"></i>
                  <h6 class="mt-2">Téléchargez l'image de l'institution ici, ou <a href="#!" class="text-primary" @click.prevent="$refs.fileInput.click()">Parcourir</a></h6>
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
                  <p class="mt-2">Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px * 450px.</p>
                </div>
                <Button type="button" label="Supprimer l'image" class="p-button-danger mt-2" icon="pi pi-trash" @click="removeImage" />
              </div>
              <div class="field mt-4">
                <label for="imageUrl">URL de l'image</label>
                <InputText id="imageUrl" v-model="institution.ImageURL" class="w-full" readonly />
              </div>
            </div>

            <!-- Description de l'institution -->
            <div v-if="activeIndex === 3">
              <h4>Description</h4>
              <Divider />
              <div class="field">
                <label for="description">Description du lieu</label>
                <Textarea id="description" v-model="institution.Description" rows="5" class="w-full" placeholder="Entrez la description du lieu ici..."></Textarea>
              </div>
            </div>

            <!-- Boutons de navigation -->
            <div class="flex justify-content-between mt-5">
              <Button v-if="activeIndex > 0" type="button" label="Précédent" class="p-button-secondary" @click="goToPrevStep" />
              <Button v-if="activeIndex < steps.length - 1" type="button" label="Suivant" class="p-button-primary ml-auto" @click="goToNextStep" />
              <Button v-if="activeIndex === steps.length - 1" type="submit" label="Envoyer" class="p-button-primary ml-auto" />
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
<script>
import { db } from '../../../../firebase.js';
import { ref, set, push } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import Calendar from 'primevue/calendar';

export default {
  name: 'InstitutionForm',
  components: {
    Steps,
    InputText,
    Textarea,
    Dropdown,
    Button,
    Divider,
    Calendar
  },
  data() {
    return {
      activeIndex: 0,
      institution: {
        Cyberlearn: '',
        Name: '',
        Lieu: '',
        Canton: '',
        Description: '',
        Street: '',
        URL: '',
        Categorie: '',
        Latitude: '',
        Longitude: '',
        Langue: '',
        ImageURL: '',
        Convention: null,
        AccordCadre: null,
        Remarque: '',
        key: '',
        NomResponsablePhysio: '',
        PhoneResponsablePhysio: '',
        EmailResponsablePhysio: '',
      },
      imageFile: null, // Pour stocker l'image sélectionnée
      documentFile: null, // Pour stocker le document sélectionné
      cantons: [
        { code: 'Argovie', name: 'AG' },
        { code: 'Appenzell Rhodes-Intérieures', name: 'AI' },
        { code: 'Appenzell Rhodes-Extérieures', name: 'AR' },
        { code: 'Bâle-Campagne', name: 'BL' },
        { code: 'Bâle-Ville', name: 'BS' },
        { code: 'Berne', name: 'BE' },
        { code: 'Fribourg', name: 'FR' },
        { code: 'Genève', name: 'GE' },
        { code: 'Glaris', name: 'GL' },
        { code: 'Grisons', name: 'GR' },
        { code: 'Jura', name: 'JU' },
        { code: 'Lucerne', name: 'LU' },
        { code: 'Neuchâtel', name: 'NE' },
        { code: 'Nidwald', name: 'NW' },
        { code: 'Obwald', name: 'OW' },
        { code: 'Saint-Gall', name: 'SG' },
        { code: 'Schaffhouse', name: 'SH' },
        { code: 'Schwytz', name: 'SZ' },
        { code: 'Soleure', name: 'SO' },
        { code: 'Tessin', name: 'TI' },
        { code: 'Thurgovie', name: 'TG' },
        { code: 'Uri', name: 'UR' },
        { code: 'Valais', name: 'VS' },
        { code: 'Vaud', name: 'VD' },
        { code: 'Zoug', name: 'ZG' },
        { code: 'Zurich', name: 'ZH' },
        { code: 'Etranger', name: 'Etranger' }
      ],
      categories: [
        { label: 'Institution valaisanne', value: 'Institution valaisanne' },
        { label: 'Cabinet privé valaisan', value: 'Cabinet privé valaisan' },
        { label: 'Institution hors canton', value: 'Institution hors canton' },
        { label: 'Cabinet privé hors canton', value: 'Cabinet privé hors canton' },
        { label: 'Institution étrangère', value: 'Institution étrangère' }
      ],
      langues: [
        { code: 'Français', name: 'FR' },
        { code: 'Allemand', name: 'ALL' },
        { code: 'Billingue', name: 'BIL' },
        { code: 'Italien', name: 'IT' },
      ],
      steps: [
        { label: 'Détail de l\'institution' },
        { label: 'Informations supplémentaires' },
        { label: 'Médias de l\'institution' },
        { label: 'Description' }
      ]
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
      try {
        const newInstRef = push(ref(db, 'institutions'));
        const newInstKey = newInstRef.key;
        this.institution.key = newInstKey;

        const storage = getStorage();

        // Si une image a été sélectionnée, on l'upload d'abord
        if (this.imageFile) {
          const imageRef = storageRef(storage, `Institutions/${newInstKey}/image`);
          await uploadBytes(imageRef, this.imageFile);
          const imageURL = await getDownloadURL(imageRef);
          this.institution.ImageURL = imageURL;
        }

        // Si un document a été sélectionné, on l'upload d'abord
        if (this.documentFile) {
          const documentRef = storageRef(storage, `Institutions/${newInstKey}/document`);
          await uploadBytes(documentRef, this.documentFile);
          const documentURL = await getDownloadURL(documentRef);
          this.institution.DocumentURL = documentURL;
        }

        // Ensuite, on sauvegarde les informations de l'institution
        await set(newInstRef, this.institution);
        this.$router.push({ name: 'InstitutionList' });
      } catch (error) {
        console.error('Erreur lors de l’envoi des données:', error);
      }
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.imageFile = file;
        this.institution.ImageURL = URL.createObjectURL(file); // Afficher l'image localement
      }
    },
    onDocumentChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.documentFile = file;
      }
    },
    removeImage() {
      this.imageFile = null;
      this.institution.ImageURL = '';
    },
    removeDocument() {
      this.documentFile = null;
      this.institution.DocumentURL = '';
    }
  }
};
</script>


<style scoped>
.hidden {
  display: none;
}
</style>
