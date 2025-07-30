<template>
  <div class="admin-scrollable">
    <Navbar />
    <div class="px-4 py-8 md:px-6 lg:px-8">
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
                  <input
                    type="file"
                    accept="application/pdf"
                    @change="onPdfChange"
                    class="p-button-outlined p-mt-2"
                  />
                  <p v-if="institution.CyberleanURL" class="mt-2">
                    PDF actuel :
                    <a :href="institution.CyberleanURL" target="_blank"
                    >Voir le PDF</a
                    >
                  </p>
                </div>
              </div>

              <!-- Lieu -->
              <div class="col-12 md:col-4">
                <div class="p-field">
                  <label for="locality">Lieu</label>
                  <InputText id="locality" v-model="institution.Locality" />
                </div>
              </div>

              <!-- Canton -->
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

              <!-- Langue -->
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

              <!-- Rue -->
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="address">Adresse</label>
                  <InputText id="address" v-model="institution.Address" />
                </div>
              </div>

              <!-- URL -->
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="url">URL</label>
                  <InputGroup>
                    <InputGroupAddon>www</InputGroupAddon>
                    <InputText
                      id="url"
                      v-model="institution.URL"
                      placeholder="Site Web"
                    />
                  </InputGroup>
                </div>
              </div>

              <!-- Catégorie -->
              <div class="col-12 md:col-6">
                <div class="p-field">
                  <label for="category">Catégorie</label>
                  <InputText
                    id="category"
                    v-model="institution.Category"
                    class="w-full"
                  />
                </div>
              </div>

              <!-- Téléchargement des images -->
              <div class="col-12">
                <h4>Médias de l'institution</h4>
                <Divider />
                <div class="text-center">
                  <div class="border-2 border-dashed surface-border rounded-lg p-5 mb-3">
                    <i class="pi pi-image text-5xl"></i>
                    <h6 class="mt-2">
                      Téléchargez les images de l'institution ici, ou
                      <a href="#!" class="text-primary" @click="triggerImageInput"
                      >Parcourir</a
                      >
                    </h6>
                    <input
                      ref="imageInput"
                      type="file"
                      accept="image/*"
                      multiple
                      class="hidden"
                      @change="onImageChange"
                    />
                    <p class="mt-2">
                      Seulement JPG, JPEG et PNG. Dimensions suggérées: 600px *
                      450px.
                    </p>
                  </div>
                  <div v-if="Array.isArray(localPreviews) && localPreviews.length" class="image-preview">
                    <div
                      v-for="(imageURL, index) in localPreviews"
                      :key="index"
                      class="mb-4"
                    >
                      <img
                        :src="imageURL"
                        alt="Image de l'institution"
                        class="w-full h-auto mb-2"
                      />
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

              <!-- Description -->
              <div class="col-12 md:col-12">
                <div class="p-field">
                  <label for="description">Description</label>
                  <Textarea
                    id="description"
                    v-model="institution.Description"
                  />
                </div>
              </div>

              <!-- Convention -->
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

              <!-- Accord Cadre -->
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

              <!-- Remarque sur la convention / accord cadre -->
              <div class="col-12 md:col-12">
                <div class="p-field">
                  <label for="note">Remarque convention / accord cadre</label>
                  <Textarea id="note" v-model="institution.Note" />
                </div>
              </div>

              <!-- Informations du responsable physique -->
              <div class="field col-4">
                <label for="nomChef">Nom, Prénom resp phy</label>
                <InputText
                  id="nomChef"
                  v-model="institution.NomChef"
                  class="w-full"
                />
              </div>
              <div class="field col-4">
                <label for="phoneChef">Téléphone resp phy</label>
                <InputText
                  id="phoneChef"
                  v-model="institution.PhoneChef"
                  class="w-full"
                />
              </div>
              <div class="field col-4">
                <label for="mailChef">Mail resp phy</label>
                <InputText
                  id="mailChef"
                  v-model="institution.MailChef"
                  class="w-full"
                />
              </div>

              <!-- Boutons de soumission -->
              <div class="col-12">
                <Button
                  label="Mettre à jour l'institution"
                  class="p-button-warning mt-3 btn-small"
                  @click="updateInstitution"
                />
                <Button
                  label="Retour"
                  class="p-button-secondary mt-3 btn-small"
                  @click="goBack"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, storage } from "../../../../firebase.js";
import { ref, onValue, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

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

// --- Fonctions utilitaires pour parser/formatter la date dd-mm-yyyy ---
function parseDDMMYYYY(str) {
  // Evite les erreurs si str est vide
  if (!str) return null;
  const [dd, mm, yyyy] = str.split("-");
  // Crée l'objet Date (mois commence à 0)
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function formatDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-');
  return new Date(Number(year), Number(month) - 1, Number(day));
}

export default {
  name: "InstitutionFormModif",
  components: {
    Navbar,
    InputText,
    Dropdown,
    Button,
    Badge,
    Calendar,
    Textarea,
    InputGroup,
    InputGroupAddon,
    Divider,
  },
  data() {
    return {
      institution: {
        CyberleanURL: "",
        Name: "",
        Locality: "",
        Canton: "",
        Address: "",
        URL: "",
        Category: "",
        Language: "",
        Description: "",
        ConventionDate: "",
        AccordCadreDate: "",
        Note: "",
        MailChef: "",
        PhoneChef: "",
        NomChef: "",
        ImageURL: [], // Toujours un tableau
      },
      pdfFile: null, // Fichier PDF sélectionné
      imageFiles: [], // Tableau de fichiers images sélectionnés
      localPreviews: [], // Tableau d'aperçus locaux des images sélectionnées
      cantons: [
        { code: "AG", name: "Argovie" },
        { code: "AI", name: "Appenzell Rhodes-Intérieures" },
        { code: "AR", name: "Appenzell Rhodes-Extérieures" },
        { code: "BE", name: "Berne" },
        { code: "FR", name: "Fribourg" },
        { code: "VS", name: "Valais" },
        { code: "VD", name: "Vaud" },
        { code: "GE", name: "Genève" },
        { code: "ZH", name: "Zurich" },
        { code: "NE", name: "Neuchâtel" },
        { code: "JU", name: "Jura" },
        { code: "LU", name: "Lucerne" },
        { code: "ET", name: "Étranger" },
      ],
      categories: [
        { label: "Institution valaisanne", value: "Institution valaisanne" },
        { label: "Cabinet privé valaisan", value: "Cabinet privé valaisan" },
        { label: "Institution hors canton", value: "Institution hors canton" },
        { label: "Cabinet privé hors canton", value: "Cabinet privé hors canton" },
      ],
      langues: [
        { code: "FR", name: "Français" },
        { code: "ALL", name: "Allemand" },
        { code: "IT", name: "Italien" },
        { code: "ANG", name: "Anglais" },
        { code: "BIL", name: "Bilingue" },
      ],
    };
  },
  methods: {
    // Déclenche le sélecteur de fichier pour les images
    triggerImageInput() {
      this.$refs.imageInput.click();
    },

    // Met à jour l'institution dans Firebase
    async updateInstitution() {
      try {
        console.log("Starting institution update...");
        const instRef = ref(db, "Institutions/" + this.$route.params.id);

        // Gestion du téléchargement du PDF
        if (this.pdfFile) {
          console.log("Uploading PDF...");
          const pdfRef = storageRef(
            storage,
            `Institutions/${this.$route.params.id}/cyberlearn.pdf`
          );
          const pdfSnapshot = await uploadBytes(pdfRef, this.pdfFile);
          const pdfURL = await getDownloadURL(pdfSnapshot.ref);
          this.institution.CyberleanURL = pdfURL;
          console.log("PDF uploaded:", pdfURL);
        }

        // Gestion de l'image
        if (this.imageFiles.length > 0) {
          // Supprimer l'ancienne image si elle existe
          if (this.institution.ImageURL) {
            try {
              const oldImageRef = storageRef(storage, `Institutions/${this.$route.params.id}/image`);
              await deleteObject(oldImageRef);
            } catch (err) {
              // L'image n'existait peut-être pas, on ignore l'erreur
              console.warn('Ancienne image non trouvée ou déjà supprimée.', err);
            }
          }
          // Uploader la nouvelle image
          const newImageRef = storageRef(storage, `Institutions/${this.$route.params.id}/image`);
          const imageSnapshot = await uploadBytes(newImageRef, this.imageFiles[0]);
          const newImageURL = await getDownloadURL(imageSnapshot.ref);
          this.institution.ImageURL = [newImageURL];
        }

        const dataToUpdate = {
          ...this.institution,
          ConventionDate: this.institution.ConventionDate
            ? this.institution.ConventionDate.toLocaleDateString('fr-CA')
            : '',
          AccordCadreDate: this.institution.AccordCadreDate
            ? this.institution.AccordCadreDate.toLocaleDateString('fr-CA')
            : '',
        };

        // Mise à jour des détails de l'institution dans Firebase
        await update(instRef, dataToUpdate);

        console.log("Institution updated successfully!");
        alert("Institution mise à jour avec succès.");
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        alert("Erreur lors de la mise à jour de l’institution.");
      }
    },

    // Récupération du PDF sélectionné
    onPdfChange(event) {
      this.pdfFile = event.target.files[0];
    },

    // Récupération des images sélectionnées
    onImageChange(event) {
      const files = Array.from(event.target.files);
      if (!this.localPreviews) {
        this.localPreviews = [];
      }
      files.forEach((file) => {
        const safeName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
        const alreadyAdded = this.imageFiles.some(
          (f) => f.name === safeName && f.size === file.size
        );
        if (!alreadyAdded) {
          const newFile = new File([file], safeName, { type: file.type });
          this.imageFiles.push(newFile);
          const previewURL = URL.createObjectURL(newFile);
          this.localPreviews.push(previewURL);
        }
      });
    },

    // Suppression d'une image
    removeImage(index) {
      if (this.localPreviews && this.localPreviews[index]) {
        URL.revokeObjectURL(this.localPreviews[index]);
        this.localPreviews.splice(index, 1);
        this.imageFiles.splice(index, 1);
      }
    },

    // Retour à la page précédente
    goBack() {
      this.$router.go(-1);
    },

    // Chargement des données de l'institution depuis Firebase
    loadInstitutionData() {
      const instRef = ref(db, "Institutions/" + this.$route.params.id);
      onValue(instRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();

          // Convertir les chaînes dd-mm-yyyy en objets Date
          if (data.ConventionDate && typeof data.ConventionDate === 'string') {
            data.ConventionDate = parseDateLocal(data.ConventionDate);
          }
          if (data.AccordCadreDate && typeof data.AccordCadreDate === 'string') {
            data.AccordCadreDate = parseDateLocal(data.AccordCadreDate);
          }

          this.institution = {
            ...data,
            ImageURL: data.ImageURL || [],
          };
        }
      });
    },
  },
  mounted() {
    this.loadInstitutionData();
  },
};
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
</style>
