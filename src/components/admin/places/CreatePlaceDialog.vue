<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Créer une nouvelle place"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    :dismissableMask="false"
    appendTo="body"
    @hide="onClose"
  >
    <div class="p-fluid">
      <!-- Informations de base -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Informations de base</h3>
        
        <div class="field mb-3">
          <label for="nomPlace" class="font-semibold">Nom de la place *</label>
          <InputText
            id="nomPlace"
            v-model="formData.NomPlace"
            placeholder="Ex: Orthopédie HUG"
            :class="{ 'p-invalid': submitted && !formData.NomPlace }"
          />
          <small v-if="submitted && !formData.NomPlace" class="p-error">Le nom est requis</small>
        </div>

        <div class="field mb-3">
          <div class="flex align-items-center justify-content-between mb-2">
            <label for="institution" class="font-semibold">
              Institution *
              <span v-if="institutionsOptions.length" class="text-500 font-normal ml-2">
                ({{ institutionsOptions.length }} disponibles)
              </span>
            </label>
            <Button
              v-if="!institutionsStore.loading"
              icon="pi pi-refresh"
              text
              size="small"
              @click="reloadInstitutions"
              v-tooltip.top="'Recharger les institutions'"
            />
          </div>
          <Dropdown
            id="institution"
            v-model="formData.InstitutionId"
            :options="institutionsOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionnez une institution ou tapez pour rechercher..."
            :class="{ 'p-invalid': submitted && !formData.InstitutionId }"
            :loading="institutionsStore.loading"
            filter
            filterMatchMode="contains"
            filterPlaceholder="Rechercher une institution..."
            :filterFields="['label']"
            showClear
            :virtualScrollerOptions="{ itemSize: 38 }"
            emptyMessage="Aucune institution trouvée"
            emptyFilterMessage="Aucune institution ne correspond à votre recherche"
            class="w-full"
            panelClass="institution-dropdown-panel"
            appendTo="body"
            :autoOptionFocus="true"
            scrollHeight="400px"
          />
          <small v-if="submitted && !formData.InstitutionId" class="p-error">L'institution est requise</small>
          <small v-else-if="!institutionsStore.loading && !institutionsOptions.length" class="text-500">
            Aucune institution disponible. Veuillez en créer une d'abord.
          </small>
        </div>

      </div>

      <!-- Critères / Spécialités -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Critères</h3>
        <div class="grid">
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.MSQ" inputId="msq" :binary="true" />
              <label for="msq">MSQ</label>
            </div>
          </div>
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.SYSINT" inputId="sysint" :binary="true" />
              <label for="sysint">SYSINT</label>
            </div>
          </div>
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.AIGU" inputId="aigu" :binary="true" />
              <label for="aigu">AIGU</label>
            </div>
          </div>
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.REHAB" inputId="rehab" :binary="true" />
              <label for="rehab">REHAB</label>
            </div>
          </div>
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.AMBU" inputId="ambu" :binary="true" />
              <label for="ambu">AMBU</label>
            </div>
          </div>
          <div class="col-6 md:col-4">
            <div class="field-checkbox">
              <Checkbox v-model="formData.NEUROGER" inputId="neuroger" :binary="true" />
              <label for="neuroger">NEUROGER</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Langues -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Langues</h3>
        <div class="grid">
          <div class="col-6 md:col-3">
            <div class="field-checkbox">
              <Checkbox v-model="formData.FR" inputId="fr" :binary="true" />
              <label for="fr">Français</label>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="field-checkbox">
              <Checkbox v-model="formData.DE" inputId="de" :binary="true" />
              <label for="de">Allemand</label>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="field-checkbox">
              <Checkbox v-model="formData.IT" inputId="it" :binary="true" />
              <label for="it">Italien</label>
            </div>
          </div>
          <div class="col-6 md:col-3">
            <div class="field-checkbox">
              <Checkbox v-model="formData.ENG" inputId="eng" :binary="true" />
              <label for="eng">Anglais</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Places par module (PFP) -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Nombre de places par module</h3>
        
        <TabView>
          <TabPanel header="2025">
            <div class="grid mt-3">
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp1a-2025" class="font-semibold">PFP1A</label>
                  <InputText
                    id="pfp1a-2025"
                    v-model="formData.pfpValues2025.PFP1A"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp1b-2025" class="font-semibold">PFP1B</label>
                  <InputText
                    id="pfp1b-2025"
                    v-model="formData.pfpValues2025.PFP1B"
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp2-2025" class="font-semibold">PFP2</label>
                  <InputText
                    id="pfp2-2025"
                    v-model="formData.pfpValues2025.PFP2"
                    placeholder="Ex: 3"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp3-2025" class="font-semibold">PFP3</label>
                  <InputText
                    id="pfp3-2025"
                    v-model="formData.pfpValues2025.PFP3"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp4-2025" class="font-semibold">PFP4</label>
                  <InputText
                    id="pfp4-2025"
                    v-model="formData.pfpValues2025.PFP4"
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
            </div>
          </TabPanel>
          
          <TabPanel header="2026">
            <div class="grid mt-3">
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp1a-2026" class="font-semibold">PFP1A</label>
                  <InputText
                    id="pfp1a-2026"
                    v-model="formData.pfpValues2026.PFP1A"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp1b-2026" class="font-semibold">PFP1B</label>
                  <InputText
                    id="pfp1b-2026"
                    v-model="formData.pfpValues2026.PFP1B"
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp2-2026" class="font-semibold">PFP2</label>
                  <InputText
                    id="pfp2-2026"
                    v-model="formData.pfpValues2026.PFP2"
                    placeholder="Ex: 3"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp3-2026" class="font-semibold">PFP3</label>
                  <InputText
                    id="pfp3-2026"
                    v-model="formData.pfpValues2026.PFP3"
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
              <div class="col-6 md:col-4">
                <div class="field">
                  <label for="pfp4-2026" class="font-semibold">PFP4</label>
                  <InputText
                    id="pfp4-2026"
                    v-model="formData.pfpValues2026.PFP4"
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- Praticiens formateurs -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <div class="flex align-items-center justify-content-between mb-3">
          <h3 class="text-lg font-semibold m-0">
            Praticiens formateurs
            <span v-if="praticiensOptions.length" class="text-500 font-normal ml-2">
              ({{ praticiensOptions.length }} disponibles)
            </span>
          </h3>
          <Button
            v-if="!praticiensStore.loading"
            icon="pi pi-refresh"
            text
            size="small"
            @click="reloadPraticiens"
            v-tooltip.top="'Recharger les praticiens'"
          />
        </div>
        <div class="field">
          <MultiSelect
            v-model="formData.praticiensFormateurs"
            :options="praticiensOptions"
            optionLabel="label"
            optionValue="id"
            placeholder="Sélectionnez les praticiens formateurs ou tapez pour rechercher..."
            :loading="praticiensStore.loading"
            display="chip"
            filter
            filterPlaceholder="Rechercher un praticien..."
            :filterFields="['label']"
            :virtualScrollerOptions="{ itemSize: 38 }"
            emptyMessage="Aucun praticien formateur trouvé"
            emptyFilterMessage="Aucun praticien ne correspond à votre recherche"
            class="w-full"
            panelClass="praticiens-dropdown-panel"
            appendTo="body"
            :maxSelectedLabels="3"
            selectedItemsLabel="{0} praticiens sélectionnés"
          />
          <small v-if="!praticiensStore.loading && !praticiensOptions.length" class="text-500">
            Aucun praticien formateur disponible.
          </small>
        </div>
      </div>

      <!-- Remarques -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Remarques</h3>
        <TabView>
          <TabPanel header="2025">
            <div class="field mt-3">
              <Textarea
                v-model="formData.remarques2025"
                rows="4"
                placeholder="Remarques pour 2025..."
                class="w-full"
              />
            </div>
          </TabPanel>
          <TabPanel header="2026">
            <div class="field mt-3">
              <Textarea
                v-model="formData.remarques2026"
                rows="4"
                placeholder="Remarques pour 2026..."
                class="w-full"
              />
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- Fichier PDF -->
      <div class="surface-card fp-dark p-3 border-round mb-3">
        <h3 class="text-lg font-semibold mb-3">Fichier PDF (optionnel)</h3>
        
        <!-- Upload de fichier -->
        <div class="field mb-3">
          <label class="font-semibold mb-2 block">Uploader un fichier PDF</label>
          <div class="flex gap-2 align-items-center">
            <input
              ref="fileInput"
              type="file"
              accept="application/pdf"
              @change="onFileSelected"
              style="display: none"
            />
            <Button
              label="Choisir un fichier"
              icon="pi pi-upload"
              @click="$refs.fileInput.click()"
              outlined
              :disabled="uploading"
            />
            <Button
              v-if="selectedFile"
              :label="uploading ? 'Upload en cours...' : 'Uploader'"
              icon="pi pi-cloud-upload"
              @click="uploadFile"
              :loading="uploading"
              :disabled="!selectedFile || uploading"
            />
            <Button
              v-if="selectedFile && !uploading"
              icon="pi pi-times"
              text
              severity="danger"
              @click="clearFile"
              v-tooltip.top="'Annuler'"
            />
          </div>
          
          <!-- Aperçu du fichier sélectionné -->
          <div v-if="selectedFile" class="mt-2 p-2 surface-100 border-round">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-file-pdf text-red-500"></i>
              <span class="flex-1">{{ selectedFile.name }}</span>
              <span class="text-500 text-sm">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </div>
        </div>
        
        <!-- OU champ texte pour URL -->
        <div class="field">
          <label for="fileUrl" class="font-semibold">Ou entrer l'URL manuellement</label>
          <InputText
            id="fileUrl"
            v-model="formData.fileURL"
            placeholder="https://..."
            :disabled="uploading"
          />
          <small class="text-500">URL du fichier PDF descriptif de la place</small>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Annuler" icon="pi pi-times" text @click="onClose" />
      <Button 
        label="Créer" 
        icon="pi pi-check" 
        @click="onCreate" 
        :loading="loading"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePraticiensStore } from '@/stores/praticiensStore'
import { useDataRefresh } from '@/composables/useDataRefresh'
import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  selectedYear: {
    type: String,
    default: '2025'
  }
})

const emit = defineEmits(['update:visible', 'created'])

const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const praticiensStore = usePraticiensStore()
const { emitAndWait } = useDataRefresh()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const loading = ref(false)
const submitted = ref(false)
const uploading = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)

// Options pour les institutions
const institutionsOptions = computed(() => {
  const institutions = institutionsStore.institutions || []
  console.log('📋 Institutions brutes:', institutions.length)
  
  const options = institutions
    .filter(inst => {
      if (!inst.InstitutionId) {
        console.warn('⚠️ Institution sans ID trouvée:', inst)
        return false
      }
      return true
    })
    .map(inst => {
      // Construire le label avec nom, localité et canton
      const parts = [
        inst.Name || 'Sans nom',
        inst.Locality || '',
        inst.Canton ? `(${inst.Canton})` : ''
      ].filter(p => p).join(' ')
      
      const option = {
        label: parts.trim(),
        value: inst.InstitutionId
      }
      
      return option
    })
    .sort((a, b) => a.label.localeCompare(b.label)) // Trier alphabétiquement
  
  console.log('📋 Options formatées pour le dropdown:', options.length)
  if (options.length > 0) {
    console.log('📋 Premiers exemples:', options.slice(0, 3))
  }
  
  return options
})

// Options pour les praticiens formateurs
const praticiensOptions = computed(() => {
  const praticiens = praticiensStore.items || []
  console.log('👨‍⚕️ Praticiens formateurs disponibles:', praticiens.length, praticiens)
  return praticiens
    .filter(p => p.id) // Filtrer ceux qui ont un ID
    .map(p => {
      const prenom = p.prenom || p.Prenom || ''
      const nom = p.nom || p.Nom || ''
      const mail = p.mail || p.Mail || ''
      return {
        id: p.id,
        label: `${prenom} ${nom}`.trim() || mail || p.id,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label)) // Trier alphabétiquement
})

// Données du formulaire
const formData = ref({
  NomPlace: '',
  InstitutionId: null,
  fileURL: '',
  // Critères
  MSQ: false,
  SYSINT: false,
  AIGU: false,
  REHAB: false,
  AMBU: false,
  NEUROGER: false,
  // Langues
  FR: false,
  DE: false,
  IT: false,
  ENG: false,
  // Praticiens formateurs
  praticiensFormateurs: [],
  // Remarques par année
  remarques2025: '',
  remarques2026: '',
  // Valeurs PFP pour 2025
  pfpValues2025: {
    PFP1A: '',
    PFP1B: '',
    PFP2: '',
    PFP3: '',
    PFP4: ''
  },
  // Valeurs PFP pour 2026
  pfpValues2026: {
    PFP1A: '',
    PFP1B: '',
    PFP2: '',
    PFP3: '',
    PFP4: ''
  }
})

// Générer un ID unique pour la nouvelle place
function generatePlaceId() {
  // Format Firebase-like: -NxxxYYYzzz...
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `-N${timestamp}${random}`
}

// Créer la place
async function onCreate() {
  submitted.value = true

  // Validation
  if (!formData.value.NomPlace || !formData.value.InstitutionId) {
    return
  }

  loading.value = true

  try {
    // Si un fichier est sélectionné mais pas encore uploadé, l'uploader automatiquement
    if (selectedFile.value && !formData.value.fileURL) {
      console.log('📤 Upload automatique du fichier avant création...')
      await uploadFile()
      console.log('✅ Fichier uploadé automatiquement, URL:', formData.value.fileURL)
    }

    // Récupérer les infos de l'institution pour les champs dupliqués
    const institution = institutionsStore.institutions.find(
      inst => inst.InstitutionId === formData.value.InstitutionId
    )

    console.log('🏥 Institution sélectionnée:', institution)

    // Construire les objets JSONB pour les PFP (2025 et 2026)
    const pfpData = {}
    
    // PFP 2025
    const pfp2025 = {}
    if (formData.value.pfpValues2025.PFP1A) pfp2025.PFP1A = formData.value.pfpValues2025.PFP1A
    if (formData.value.pfpValues2025.PFP1B) pfp2025.PFP1B = formData.value.pfpValues2025.PFP1B
    if (formData.value.pfpValues2025.PFP2) pfp2025.PFP2 = formData.value.pfpValues2025.PFP2
    if (formData.value.pfpValues2025.PFP3) pfp2025.PFP3 = formData.value.pfpValues2025.PFP3
    if (formData.value.pfpValues2025.PFP4) pfp2025.PFP4 = formData.value.pfpValues2025.PFP4
    
    // PFP 2026
    const pfp2026 = {}
    if (formData.value.pfpValues2026.PFP1A) pfp2026.PFP1A = formData.value.pfpValues2026.PFP1A
    if (formData.value.pfpValues2026.PFP1B) pfp2026.PFP1B = formData.value.pfpValues2026.PFP1B
    if (formData.value.pfpValues2026.PFP2) pfp2026.PFP2 = formData.value.pfpValues2026.PFP2
    if (formData.value.pfpValues2026.PFP3) pfp2026.PFP3 = formData.value.pfpValues2026.PFP3
    if (formData.value.pfpValues2026.PFP4) pfp2026.PFP4 = formData.value.pfpValues2026.PFP4
    
    // Combiner les PFP des deux années
    if (formData.value.pfpValues2025.PFP1A || formData.value.pfpValues2026.PFP1A) {
      pfpData.PFP1A = { '2025': pfp2025.PFP1A || '', '2026': pfp2026.PFP1A || '' }
    }
    if (formData.value.pfpValues2025.PFP1B || formData.value.pfpValues2026.PFP1B) {
      pfpData.PFP1B = { '2025': pfp2025.PFP1B || '', '2026': pfp2026.PFP1B || '' }
    }
    if (formData.value.pfpValues2025.PFP2 || formData.value.pfpValues2026.PFP2) {
      pfpData.PFP2 = { '2025': pfp2025.PFP2 || '', '2026': pfp2026.PFP2 || '' }
    }
    if (formData.value.pfpValues2025.PFP3 || formData.value.pfpValues2026.PFP3) {
      pfpData.PFP3 = { '2025': pfp2025.PFP3 || '', '2026': pfp2026.PFP3 || '' }
    }
    if (formData.value.pfpValues2025.PFP4 || formData.value.pfpValues2026.PFP4) {
      pfpData.PFP4 = { '2025': pfp2025.PFP4 || '', '2026': pfp2026.PFP4 || '' }
    }

    // Construire l'objet remarques (2025 et 2026)
    const remarques = {}
    if (formData.value.remarques2025) remarques['2025'] = formData.value.remarques2025
    if (formData.value.remarques2026) remarques['2026'] = formData.value.remarques2026

    // Données de la nouvelle place (UNIQUEMENT les colonnes de la table places)
    const newPlaceData = {
      PlaceId: generatePlaceId(),
      NomPlace: formData.value.NomPlace,
      InstitutionId: formData.value.InstitutionId,
      // NOTE: fileURL n'existe pas dans la table places - le PDF est géré ailleurs
      // Critères booléens
      MSQ: formData.value.MSQ || false,
      SYSINT: formData.value.SYSINT || false,
      AIGU: formData.value.AIGU || false,
      REHAB: formData.value.REHAB || false,
      AMBU: formData.value.AMBU || false,
      NEUROGER: formData.value.NEUROGER || false,
      // Langues booléennes
      FR: formData.value.FR || false,
      DE: formData.value.DE || false,
      IT: formData.value.IT || false,
      ENG: formData.value.ENG || false,
      // PFP (strings vides par défaut)
      PFP1A: pfpData.PFP1A || '',
      PFP1B: pfpData.PFP1B || '',
      PFP2: pfpData.PFP2 || '',
      PFP3: pfpData.PFP3 || '',
      PFP4: pfpData.PFP4 || '',
      // Remarques (objet JSON)
      Remarques: remarques
      // NOTE: praticiensFormateurs est une relation many-to-many, pas une colonne directe
      // NOTE: InstitutionName, Lieu, Categorie, etc. sont récupérés via JOIN avec institutions
    }

    console.log('📝 Création de la place:', newPlaceData)
    console.log('📝 Clés de l\'objet:', Object.keys(newPlaceData))
    console.log('📝 JSON stringifié:', JSON.stringify(newPlaceData, null, 2))

    // Créer la place via le store
    const createdPlace = await placesStore.createPlace(newPlaceData)

    console.log('✅ Place créée avec succès:', createdPlace)
    const placeId = createdPlace?.PlaceId || newPlaceData.PlaceId

    // Si un fichier PDF a été uploadé, mettre à jour la place avec l'URL
    if (formData.value.fileURL) {
      console.log('📄 Mise à jour du PDF pour la place:', placeId)
      await placesStore.updatePlace(placeId, {
        fileurl: formData.value.fileURL,
        filename: selectedFile.value?.name || 'document.pdf'
      })
      console.log('✅ PDF enregistré')
    }

    // Si des praticiens formateurs ont été sélectionnés, les sauvegarder
    if (formData.value.praticiensFormateurs && formData.value.praticiensFormateurs.length > 0) {
      console.log('👥 Mise à jour des praticiens pour la place:', placeId, formData.value.praticiensFormateurs)
      await placesStore.updatePlace(placeId, {
        praticiensFormateurs: formData.value.praticiensFormateurs
      })
      console.log('✅ Praticiens enregistrés')
    }

    // Forcer un rechargement de la place pour s'assurer d'avoir toutes les données
    console.log('🔄 Rechargement de la place pour vérification...')
    await placesStore.fetchPlaceById(placeId)
    console.log('✅ Place rechargée')

    // Attendre un peu pour que Supabase propage les changements
    console.log('⏱️ Attente de propagation des changements dans Supabase...')
    await new Promise(resolve => setTimeout(resolve, 800))

    console.log('🔄 Émission de l\'événement created et attente du refresh parent...')
    
    // Émettre l'événement ET attendre que le parent refresh
    await emitAndWait(emit, 'created', createdPlace)

    console.log('✅ Refresh parent terminé')

    alert('✅ Place créée avec succès!')

    // Fermer le dialog
    onClose()
  } catch (error) {
    console.error('❌ Erreur lors de la création de la place:', error)
    alert('Erreur lors de la création de la place: ' + error.message)
  } finally {
    loading.value = false
  }
}

// Gestion du fichier
function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  // Vérifier le type
  if (file.type !== 'application/pdf') {
    alert('Veuillez sélectionner un fichier PDF')
    return
  }

  // Vérifier la taille (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 10MB)')
    return
  }

  selectedFile.value = file
  console.log('📎 Fichier sélectionné:', file.name, formatFileSize(file.size))
}

function clearFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function uploadFile() {
  if (!selectedFile.value) return

  // Générer un ID temporaire pour le path si pas encore de PlaceId
  const tempPlaceId = generatePlaceId()
  
  uploading.value = true

  try {
    console.log('📤 Upload du fichier:', selectedFile.value.name)

    // Créer un nom de fichier unique avec timestamp
    const timestamp = Date.now()
    const fileName = `${timestamp}_${selectedFile.value.name}`
    const filePath = `places/${tempPlaceId}/${fileName}`

    console.log('📁 Upload vers Firebase Storage:', filePath)

    // Créer la référence Firebase Storage
    const fileRef = storageRef(storage, filePath)

    // Upload le fichier vers Firebase Storage
    const snapshot = await uploadBytes(fileRef, selectedFile.value, {
      contentType: 'application/pdf',
      customMetadata: {
        uploadedAt: new Date().toISOString()
      }
    })

    console.log('✅ Fichier uploadé:', snapshot.metadata.fullPath)

    // Obtenir l'URL de téléchargement avec token
    const downloadURL = await getDownloadURL(fileRef)

    console.log('🔗 URL du fichier:', downloadURL)

    // Mettre à jour le champ fileURL du formulaire
    formData.value.fileURL = downloadURL

    alert('✅ Fichier uploadé avec succès !')
    
    // Nettoyer
    clearFile()

  } catch (error) {
    console.error('❌ Erreur lors de l\'upload:', error)
    alert('Erreur lors de l\'upload du fichier: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// Fermer le dialog
function onClose() {
  isVisible.value = false
  submitted.value = false
  // Nettoyer le fichier sélectionné
  clearFile()
  // Réinitialiser le formulaire
  setTimeout(() => {
    formData.value = {
      NomPlace: '',
      InstitutionId: null,
      fileURL: '',
      MSQ: false,
      SYSINT: false,
      AIGU: false,
      REHAB: false,
      AMBU: false,
      NEUROGER: false,
      FR: false,
      DE: false,
      IT: false,
      ENG: false,
      praticiensFormateurs: [],
      remarques2025: '',
      remarques2026: '',
      pfpValues2025: {
        PFP1A: '',
        PFP1B: '',
        PFP2: '',
        PFP3: '',
        PFP4: ''
      },
      pfpValues2026: {
        PFP1A: '',
        PFP1B: '',
        PFP2: '',
        PFP3: '',
        PFP4: ''
      }
    }
  }, 200)
}

// Recharger manuellement les praticiens
async function reloadPraticiens() {
  try {
    console.log('🔄 Rechargement manuel des praticiens...')
    await praticiensStore.fetchPraticiens()
    console.log('✅ Praticiens rechargés:', praticiensStore.items.length)
  } catch (error) {
    console.error('❌ Erreur lors du rechargement des praticiens:', error)
    alert('Erreur lors du rechargement des praticiens: ' + error.message)
  }
}

// Recharger manuellement les institutions
async function reloadInstitutions() {
  try {
    console.log('🔄 Rechargement manuel des institutions...')
    await institutionsStore.fetchInstitutions()
    console.log('✅ Institutions rechargées:', institutionsStore.institutions.length)
  } catch (error) {
    console.error('❌ Erreur lors du rechargement des institutions:', error)
    alert('Erreur lors du rechargement des institutions: ' + error.message)
  }
}

// Charger les institutions et praticiens au montage
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    console.log('🔄 Dialog ouvert, chargement des données...')
    try {
      if (!institutionsStore.institutions?.length) {
        console.log('📥 Chargement des institutions...')
        await institutionsStore.fetchInstitutions()
        console.log('✅ Institutions chargées:', institutionsStore.institutions.length)
      } else {
        console.log('✅ Institutions déjà en cache:', institutionsStore.institutions.length)
      }
      if (!praticiensStore.items?.length) {
        console.log('📥 Chargement des praticiens formateurs...')
        await praticiensStore.fetchPraticiens()
        console.log('✅ Praticiens chargés:', praticiensStore.items.length)
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error)
    }
  }
})
</script>

<style scoped>
.fp-dark {
  background: #0f1f33;
  border: 1px solid rgba(255,255,255,0.06);
}

.fp-dark :deep(.p-inputtext),
.fp-dark :deep(.p-dropdown),
.fp-dark :deep(.p-multiselect),
.fp-dark :deep(textarea) {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f8fafc;
}

.fp-dark :deep(.p-inputtext::placeholder),
.fp-dark :deep(textarea::placeholder) {
  color: #cbd5e1;
}

.fp-dark label {
  color: #e5e7eb;
}

.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox label {
  margin: 0;
  color: #e5e7eb;
}

/* Styles pour le dropdown des institutions */
/* Note: Le panel est appendTo body, donc ces styles doivent être globaux */
:deep(.institution-dropdown-panel) {
  max-height: 400px !important;
  background: #1a2a42 !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  z-index: 9999 !important;
}

:deep(.institution-dropdown-panel .p-dropdown-items) {
  background: #1a2a42;
}

:deep(.institution-dropdown-panel .p-dropdown-item) {
  color: #e5e7eb !important;
  padding: 0.75rem 1rem;
  background: transparent;
}

:deep(.institution-dropdown-panel .p-dropdown-item:hover) {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #fff !important;
}

:deep(.institution-dropdown-panel .p-dropdown-item.p-highlight) {
  background: rgba(59, 130, 246, 0.25) !important;
  color: #fff !important;
}

:deep(.institution-dropdown-panel .p-dropdown-filter) {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: #f8fafc !important;
  padding: 0.75rem 1rem;
}

:deep(.institution-dropdown-panel .p-dropdown-filter::placeholder) {
  color: #cbd5e1 !important;
}

:deep(.institution-dropdown-panel .p-dropdown-filter:focus) {
  border-color: rgba(59, 130, 246, 0.5) !important;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
}

:deep(.institution-dropdown-panel .p-dropdown-empty-message) {
  color: #cbd5e1;
  padding: 1rem;
  text-align: center;
}

/* Styles pour le dropdown trigger */
.fp-dark :deep(.p-dropdown) {
  min-width: 100%;
}

.fp-dark :deep(.p-dropdown .p-dropdown-label) {
  padding: 0.75rem 1rem;
}

.fp-dark :deep(.p-dropdown:not(.p-disabled):hover) {
  border-color: rgba(59, 130, 246, 0.5);
}

.fp-dark :deep(.p-dropdown:not(.p-disabled).p-focus) {
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
}
</style>

<!-- Styles globaux pour le dropdown des institutions (appendTo body) -->
<style>
/* Styles globaux car le panel est appendé au body */
.institution-dropdown-panel {
  max-height: 400px !important;
  background: #1a2a42 !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  z-index: 9999 !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
}

.institution-dropdown-panel .p-dropdown-items-wrapper {
  max-height: 350px !important;
}

.institution-dropdown-panel .p-dropdown-items {
  background: #1a2a42 !important;
}

.institution-dropdown-panel .p-dropdown-item {
  color: #e5e7eb !important;
  padding: 0.75rem 1rem !important;
  background: transparent !important;
  cursor: pointer !important;
}

.institution-dropdown-panel .p-dropdown-item:hover {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #fff !important;
}

.institution-dropdown-panel .p-dropdown-item.p-highlight {
  background: rgba(59, 130, 246, 0.25) !important;
  color: #fff !important;
}

.institution-dropdown-panel .p-dropdown-filter-container {
  padding: 0.75rem !important;
  border-bottom: 1px solid rgba(255,255,255,0.12) !important;
}

.institution-dropdown-panel .p-dropdown-filter {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: #f8fafc !important;
  padding: 0.75rem 1rem !important;
  width: 100% !important;
}

.institution-dropdown-panel .p-dropdown-filter::placeholder {
  color: #cbd5e1 !important;
}

.institution-dropdown-panel .p-dropdown-filter:focus {
  border-color: rgba(59, 130, 246, 0.5) !important;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
  outline: none !important;
}

.institution-dropdown-panel .p-dropdown-empty-message {
  color: #cbd5e1 !important;
  padding: 1rem !important;
  text-align: center !important;
}

/* Styles globaux pour le MultiSelect des praticiens formateurs */
.praticiens-dropdown-panel {
  max-height: 400px !important;
  background: #1a2a42 !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  z-index: 9999 !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2) !important;
}

.praticiens-dropdown-panel .p-multiselect-items-wrapper {
  max-height: 350px !important;
}

.praticiens-dropdown-panel .p-multiselect-items {
  background: #1a2a42 !important;
}

.praticiens-dropdown-panel .p-multiselect-item {
  color: #e5e7eb !important;
  padding: 0.75rem 1rem !important;
  background: transparent !important;
  cursor: pointer !important;
}

.praticiens-dropdown-panel .p-multiselect-item:hover {
  background: rgba(59, 130, 246, 0.15) !important;
  color: #fff !important;
}

.praticiens-dropdown-panel .p-multiselect-item.p-highlight {
  background: rgba(59, 130, 246, 0.25) !important;
  color: #fff !important;
}

.praticiens-dropdown-panel .p-multiselect-filter-container {
  padding: 0.75rem !important;
  border-bottom: 1px solid rgba(255,255,255,0.12) !important;
}

.praticiens-dropdown-panel .p-multiselect-filter {
  background: rgba(255,255,255,0.08) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: #f8fafc !important;
  padding: 0.75rem 1rem !important;
  width: 100% !important;
}

.praticiens-dropdown-panel .p-multiselect-filter::placeholder {
  color: #cbd5e1 !important;
}

.praticiens-dropdown-panel .p-multiselect-filter:focus {
  border-color: rgba(59, 130, 246, 0.5) !important;
  box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25) !important;
  outline: none !important;
}

.praticiens-dropdown-panel .p-multiselect-empty-message {
  color: #cbd5e1 !important;
  padding: 1rem !important;
  text-align: center !important;
}

.praticiens-dropdown-panel .p-multiselect-header {
  background: #1a2a42 !important;
  border-bottom: 1px solid rgba(255,255,255,0.12) !important;
  padding: 0.75rem 1rem !important;
}
</style>
