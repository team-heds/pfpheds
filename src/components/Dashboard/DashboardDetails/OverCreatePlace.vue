<template>
    <Dialog
      header="Créer une nouvelle place"
      v-model:visible="internalVisible"
      modal
      closable
      :style="{ width: '50vw' }"
    >
      <form @submit.prevent="createPlace">
        <div class="p-fluid p-formgrid p-grid">
          <!-- Institution -->
          <div class="p-field p-col-12">
            <label for="institutionId">Institution</label>
            <Dropdown
              v-model="newPlace.InstitutionId"
              :options="institutionsOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez une institution"
              required
            />
          </div>
  
          <!-- Nom de la Place -->
          <div class="p-field p-col-12">
            <label for="NomPlace">Nom de la Place</label>
            <InputText v-model="newPlace.NomPlace" required />
          </div>
  
          <!-- Spécialités -->
          <div class="p-field p-col-12">
            <label>Spécialités :</label>
            <div class="p-formgrid p-grid">
              <div class="p-field-checkbox p-col-2" v-for="spec in specialties" :key="spec.name">
                <Checkbox :inputId="spec.name" v-model="newPlace[spec.name]" binary />
                <label :for="spec.name">{{ spec.label }}</label>
              </div>
            </div>
          </div>
  
          <!-- Langues -->
          <div class="p-field p-col-12">
            <label>Langues :</label>
            <div class="p-formgrid p-grid">
              <div class="p-field-checkbox p-col-3" v-for="lang in languages" :key="lang.name">
                <Checkbox :inputId="lang.name" v-model="newPlace[lang.name]" binary />
                <label :for="lang.name">{{ lang.label }}</label>
              </div>
            </div>
          </div>
  
          <!-- Champs PFP -->
          <div class="p-field p-col-6" v-for="pfp in pfps" :key="pfp.name">
            <label :for="pfp.name">{{ pfp.label }}</label>
            <InputText v-model="newPlace[pfp.name]" />
          </div>
  
          <!-- Praticien Formateur -->
          <div class="p-field p-col-12">
            <label for="PraticienFormateur">Praticien Formateur</label>
            <MultiSelect
              v-model="newPlace.selectedPraticiensFormateurs"
              :options="praticiensFormateursOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner"
              display="chip"
              class="w-full"
            />
          </div>
  
          <!-- Remarques -->
          <div class="p-field p-col-12">
            <label for="Remarques">Remarques</label>
            <Textarea v-model="newPlace.Remarques" autoResize rows="3" cols="30" class="w-full" />
          </div>
        </div>
  
        <!-- Boutons -->
        <div class="p-d-flex p-jc-end p-mt-3">
          <Button label="Annuler" class="p-button-secondary p-mr-2" @click="handleClose" />
          <Button label="Créer" type="submit" class="p-button-primary" />
        </div>
      </form>
    </Dialog>
  </template>
  
  <script>
  import { ref, set, push } from "firebase/database";
  import { db } from "../../../../firebase.js";
  import Button from "primevue/button";
  import InputText from "primevue/inputtext";
  import Checkbox from "primevue/checkbox";
  import Dropdown from "primevue/dropdown";
  import MultiSelect from "primevue/multiselect";
  import Textarea from "primevue/textarea";
  import Dialog from "primevue/dialog";
  
  export default {
    name: "OverCreatePlace",
    components: {
      Button,
      InputText,
      Checkbox,
      Dropdown,
      MultiSelect,
      Textarea,
      Dialog
    },
    props: {
      visible: {
        type: Boolean,
        default: false
      },
      institutionsOptions: {
        type: Array,
        default: () => []
      },
      praticiensFormateursOptions: {
        type: Array,
        default: () => []
      }
    },
    data() {
      return {
        newPlace: {
          InstitutionId: "",
          NomPlace: "",
          MSQ: false,
          SYSINT: false,
          NEUROGER: false,
          AIGU: false,
          REHAB: false,
          AMBU: false,
          FR: false,
          DE: false,
          IT: false,
          ENG: false,
          PFP2: "",
          PFP1A: "",
          PFP1B: "",
          PFP4: "",
          PFP3: "",
          selectedPraticiensFormateurs: [],
          Remarques: ""
        },
        specialties: [
          { name: "MSQ", label: "MSQ" },
          { name: "SYSINT", label: "SYSINT" },
          { name: "NEUROGER", label: "NEUROGER" },
          { name: "AIGU", label: "AIGU" },
          { name: "REHAB", label: "REHAB" },
          { name: "AMBU", label: "AMBU" }
        ],
        languages: [
          { name: "FR", label: "FR" },
          { name: "DE", label: "DE" },
          { name: "IT", label: "IT" },
          { name: "ENG", label: "ENG" }
        ],
        pfps: [
          { name: "PFP2", label: "PFP2" },
          { name: "PFP1A", label: "PFP1A" },
          { name: "PFP1B", label: "PFP1B" },
          { name: "PFP4", label: "PFP4" },
          { name: "PFP3", label: "PFP3" }
        ]
      };
    },
    computed: {
      // Liaison bidirectionnelle avec la propriété visible
      internalVisible: {
        get() {
          return this.visible;
        },
        set(value) {
          if (!value) {
            this.handleClose();
          }
          this.$emit("update:visible", value);
        }
      }
    },
    methods: {
      async createPlace() {
        try {
          const newPlaceRef = push(ref(db, "Places"));
          const placeData = {
            InstitutionId: this.newPlace.InstitutionId,
            NomPlace: this.newPlace.NomPlace,
            MSQ: this.newPlace.MSQ,
            SYSINT: this.newPlace.SYSINT,
            NEUROGER: this.newPlace.NEUROGER,
            AIGU: this.newPlace.AIGU,
            REHAB: this.newPlace.REHAB,
            AMBU: this.newPlace.AMBU,
            FR: this.newPlace.FR,
            DE: this.newPlace.DE,
            IT: this.newPlace.IT,
            ENG: this.newPlace.ENG,
            PFP2: this.newPlace.PFP2,
            PFP1A: this.newPlace.PFP1A,
            PFP1B: this.newPlace.PFP1B,
            PFP4: this.newPlace.PFP4,
            PFP3: this.newPlace.PFP3,
            Note: this.newPlace.Remarques,
            praticiensFormateurs: this.newPlace.selectedPraticiensFormateurs
          };
          await set(newPlaceRef, placeData);
          this.resetForm();
          this.$emit("created");
        } catch (error) {
          console.error("Erreur lors de la création de la place", error);
        }
      },
      handleClose() {
        this.resetForm();
        this.$emit("close");
      },
      resetForm() {
        this.newPlace = {
          InstitutionId: "",
          NomPlace: "",
          MSQ: false,
          SYSINT: false,
          NEUROGER: false,
          AIGU: false,
          REHAB: false,
          AMBU: false,
          FR: false,
          DE: false,
          IT: false,
          ENG: false,
          PFP2: "",
          PFP1A: "",
          PFP1B: "",
          PFP4: "",
          PFP3: "",
          selectedPraticiensFormateurs: [],
          Remarques: ""
        };
      }
    }
  };
  </script>
  
  <style scoped>
  /* Ajoutez ici vos styles spécifiques pour ce composant si nécessaire */
  </style>
  