<template>
  <div class="p-4 max-w-7xl mx-auto">
    <!-- Header simplifié -->
    <div class="flex justify-content-between align-items-center mb-4 pb-3 border-bottom-1 surface-border">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-flag text-primary text-2xl"></i>
        <h1 class="text-2xl font-semibold m-0 text-900">Gestion des Quêtes</h1>
      </div>
      <div class="flex gap-2">
        <Button 
          @click="navigateToPublicCreation"
          icon="pi pi-external-link"
          label="Vue Publique"
          class="p-button-outlined"
          v-tooltip="'Voir la vue de création publique'"
        />
        <Button 
          v-if="canCreateQuests"
          @click="showCreateDialog = true"
          icon="pi pi-plus"
          label="Nouvelle Quête"
          class="p-button-success"
        />
      </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="flex flex-wrap gap-3 mb-4">
      <div class="p-inputgroup flex-1" style="min-width: 300px;">
        <span class="p-inputgroup-addon">
          <i class="pi pi-search"></i>
        </span>
        <InputText 
          v-model="searchQuery" 
          placeholder="Rechercher une quête..."
          @input="filterQuests"
        />
      </div>
      
      <Dropdown 
        v-model="selectedStatus" 
        :options="statusOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Statut"
        @change="filterQuests"
        style="min-width: 150px;"
      />
      
      <Dropdown 
        v-model="selectedType" 
        :options="typeOptions" 
        optionLabel="label" 
        optionValue="value"
        placeholder="Type"
        @change="filterQuests"
        style="min-width: 150px;"
      />
    </div>

    <!-- Liste des quêtes -->
    <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-6">
      <ProgressSpinner />
      <p class="mt-3 text-600">Chargement des quêtes...</p>
    </div>
    
    <div v-else-if="filteredQuests.length === 0" class="text-center p-6">
      <i class="pi pi-flag text-6xl text-300 mb-3"></i>
      <h3 class="text-900 mb-2">Aucune quête trouvée</h3>
      <p class="text-600 m-0">{{ searchQuery ? 'Aucune quête ne correspond à votre recherche.' : 'Commencez par créer votre première quête.' }}</p>
    </div>
    
    <div v-else class="grid">
      <div 
        v-for="quest in filteredQuests" 
        :key="quest.id"
        class="col-12 md:col-6 lg:col-4"
      >
        <div class="surface-card p-4 border-round shadow-2 h-full">
          <div class="flex align-items-start gap-3 mb-3">
            <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-purple-50 border-circle flex-shrink-0">
              <i class="pi pi-flag text-purple-500 text-xl"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-900 font-semibold m-0 mb-2">{{ quest.title }}</h4>
              <p class="text-600 text-sm m-0 mb-3 line-height-3">{{ quest.description }}</p>
              <div class="flex gap-2 flex-wrap">
                <Tag 
                  :value="getStatusLabel(quest.status)" 
                  :severity="getStatusSeverity(quest.status)"
                />
                <Tag 
                  :value="getTypeLabel(quest.type)" 
                  :severity="getTypeSeverity(quest.type)"
                />
              </div>
            </div>
          </div>
          
          <div class="flex justify-content-between align-items-center text-sm text-600 mb-3">
            <div class="flex align-items-center gap-1">
              <i class="pi pi-star"></i>
              <span>{{ quest.points }} pts</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-list"></i>
              <span>{{ quest.steps?.length || 0 }} étapes</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-users"></i>
              <span>{{ quest.participantsCount || 0 }}</span>
            </div>
            <div class="flex align-items-center gap-1">
              <i class="pi pi-calendar"></i>
              <span>{{ formatDate(quest.createdAt) }}</span>
            </div>
          </div>
          
          <div class="flex gap-2">
            <Button 
              icon="pi pi-eye" 
              class="p-button-outlined p-button-sm flex-1"
              @click="viewQuestDetails(quest)"
              label="Détails"
            />
            <Button 
              v-if="canEditQuests"
              icon="pi pi-pencil" 
              class="p-button-outlined p-button-sm"
              @click="editQuest(quest)"
              v-tooltip="'Modifier'"
            />
            <Button 
              v-if="canDeleteQuests"
              icon="pi pi-trash" 
              class="p-button-outlined p-button-danger p-button-sm"
              @click="confirmDeleteQuest(quest)"
              v-tooltip="'Supprimer'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Dialog de création/édition moderne -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      :header="editingQuest ? 'Modifier la Quête' : 'Créer une Nouvelle Quête'"
      :modal="true"
      :closable="true"
      maximizable
      :style="{ width: '95vw', maxWidth: '1200px' }"
      class="quest-creation-dialog"
    >
      <!-- Tabs modernes pour organiser le formulaire -->
      <TabView v-model:activeIndex="activeFormTab">
        <!-- 📋 ONGLET 1: Informations de base -->
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-info-circle"></i>
              <span class="font-semibold">Informations</span>
            </div>
          </template>
          
          <div class="p-4">
            <div class="grid">
              <!-- Titre -->
              <div class="col-12">
                <div class="mb-4">
                  <label for="title" class="block text-900 font-bold mb-2">
                    <i class="pi pi-pencil text-purple-500 mr-2"></i>Titre de la Quête *
                  </label>
                  <InputText 
                    id="title"
                    v-model="questForm.title" 
                    placeholder="Ex: Explorez les mystères de la bibliothèque..."
                    class="w-full p-inputtext-lg"
                    :class="{ 'p-invalid': errors.title }"
                  />
                  <small v-if="errors.title" class="p-error block mt-1">{{ errors.title }}</small>
                  <small class="text-500 block mt-1">
                    <i class="pi pi-info-circle mr-1"></i>{{ questForm.title.length }}/100 caractères
                  </small>
                </div>
              </div>
              
              <!-- Description -->
              <div class="col-12">
                <div class="mb-4">
                  <label for="description" class="block text-900 font-bold mb-2">
                    <i class="pi pi-align-left text-purple-500 mr-2"></i>Description Détaillée *
                  </label>
                  <Textarea 
                    id="description"
                    v-model="questForm.description" 
                    placeholder="Décrivez l'objectif, le contexte et les actions requises..."
                    rows="4"
                    class="w-full"
                    :class="{ 'p-invalid': errors.description }"
                  />
                  <small v-if="errors.description" class="p-error block mt-1">{{ errors.description }}</small>
                  <small class="text-500 block mt-1">
                    <i class="pi pi-info-circle mr-1"></i>{{ questForm.description.length }}/500 caractères
                  </small>
                </div>
              </div>
              
              <!-- Icône -->
              <div class="col-12 md:col-4">
                <div class="mb-4">
                  <label class="block text-900 font-bold mb-2">
                    <i class="pi pi-star text-purple-500 mr-2"></i>Icône
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <Button 
                      v-for="icon in iconOptions" 
                      :key="icon"
                      :label="icon"
                      @click="questForm.icon = icon"
                      :outlined="questForm.icon !== icon"
                      :severity="questForm.icon === icon ? 'success' : 'secondary'"
                      size="large"
                      class="icon-btn"
                    />
                  </div>
                </div>
              </div>
              
              <!-- Type, Difficulté, Statut -->
              <div class="col-12 md:col-8">
                <div class="grid">
                  <div class="col-12 md:col-4">
                    <div class="mb-4">
                      <label for="type" class="block text-900 font-bold mb-2">Type *</label>
                      <Dropdown 
                        id="type"
                        v-model="questForm.type" 
                        :options="typeOptions.filter(t => t.value)" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Sélectionner"
                        class="w-full"
                        :class="{ 'p-invalid': errors.type }"
                      />
                      <small v-if="errors.type" class="p-error block mt-1">{{ errors.type }}</small>
                    </div>
                  </div>
                  
                  <div class="col-12 md:col-4">
                    <div class="mb-4">
                      <label for="difficulty" class="block text-900 font-bold mb-2">Difficulté *</label>
                      <Dropdown 
                        id="difficulty"
                        v-model="questForm.difficulty" 
                        :options="difficultyOptions" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Sélectionner"
                        class="w-full"
                        :class="{ 'p-invalid': errors.difficulty }"
                      />
                      <small v-if="errors.difficulty" class="p-error block mt-1">{{ errors.difficulty }}</small>
                    </div>
                  </div>
                  
                  <div class="col-12 md:col-4">
                    <div class="mb-4">
                      <label for="status" class="block text-900 font-bold mb-2">Statut</label>
                      <Dropdown 
                        id="status"
                        v-model="questForm.status" 
                        :options="statusOptions.filter(s => s.value)" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Sélectionner"
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- 🏆 ONGLET 2: Récompenses -->
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-gift"></i>
              <span class="font-semibold">Récompenses</span>
            </div>
          </template>
          
          <div class="p-4">
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="points" class="block text-900 font-bold mb-2">
                    <i class="pi pi-flag text-orange-500 mr-2"></i>Points (Classement) *
                  </label>
                  <InputNumber 
                    id="points"
                    v-model="questForm.points" 
                    :min="1"
                    :max="1000"
                    :step="10"
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    class="w-full"
                    :class="{ 'p-invalid': errors.points }"
                  />
                  <small v-if="errors.points" class="p-error block mt-1">{{ errors.points }}</small>
                  <small class="text-500 block mt-1">Points pour le classement inter-maisons</small>
                </div>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="xp" class="block text-900 font-bold mb-2">
                    <i class="pi pi-star-fill text-yellow-500 mr-2"></i>XP (Progression)
                  </label>
                  <InputNumber 
                    id="xp"
                    v-model="questForm.xp_reward" 
                    :min="0"
                    :max="5000"
                    :step="50"
                    showButtons
                    buttonLayout="horizontal"
                    incrementButtonIcon="pi pi-plus"
                    decrementButtonIcon="pi pi-minus"
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">XP pour monter de niveau</small>
                </div>
              </div>
              
              <div class="col-12">
                <div class="mb-4">
                  <label for="badges" class="block text-900 font-bold mb-2">
                    <i class="pi pi-trophy text-purple-500 mr-2"></i>Badges Récompenses
                  </label>
                  <MultiSelect 
                    id="badges"
                    v-model="questForm.rewardBadges" 
                    :options="badgeOptions" 
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Sélectionner des badges..."
                    display="chip"
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">Badges débloqués à la complétion</small>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- ⚙️ ONGLET 3: Paramètres Avancés -->
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-cog"></i>
              <span class="font-semibold">Paramètres</span>
            </div>
          </template>
          
          <div class="p-4">
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="minLevel" class="block text-900 font-bold mb-2">
                    <i class="pi pi-angle-up text-green-500 mr-2"></i>Niveau Minimum
                  </label>
                  <InputNumber 
                    id="minLevel"
                    v-model="questForm.minLevel" 
                    :min="1"
                    :max="100"
                    showButtons
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">Niveau requis pour débloquer</small>
                </div>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="duration" class="block text-900 font-bold mb-2">
                    <i class="pi pi-clock text-blue-500 mr-2"></i>Durée Limite (heures)
                  </label>
                  <InputNumber 
                    id="duration"
                    v-model="questForm.duration" 
                    :min="1"
                    :max="720"
                    placeholder="Optionnel"
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">Temps limité pour compléter</small>
                </div>
              </div>
              
              <div class="col-12">
                <div class="mb-4">
                  <label class="block text-900 font-bold mb-2">
                    <i class="pi pi-users text-purple-500 mr-2"></i>Maisons Ciblées
                  </label>
                  <MultiSelect 
                    v-model="questForm.targetHouses" 
                    :options="houseOptions" 
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Toutes les maisons (par défaut)"
                    display="chip"
                    class="w-full"
                  >
                    <template #option="slotProps">
                      <div class="flex align-items-center gap-2">
                        <div 
                          class="w-1rem h-1rem border-circle" 
                          :style="{ backgroundColor: slotProps.option.color }"
                        ></div>
                        <span>{{ slotProps.option.label }}</span>
                      </div>
                    </template>
                  </MultiSelect>
                  <small class="text-500 block mt-1">Laissez vide pour toutes les maisons</small>
                </div>
              </div>
              
              <div class="col-12">
                <div class="mb-4">
                  <div class="flex align-items-center gap-3 mb-3">
                    <InputSwitch v-model="questForm.isRecurring" inputId="recurring" />
                    <label for="recurring" class="text-900 font-bold cursor-pointer">
                      <i class="pi pi-refresh text-cyan-500 mr-2"></i>Quête Récurrente
                    </label>
                  </div>
                  
                  <Dropdown 
                    v-if="questForm.isRecurring"
                    v-model="questForm.recurringType" 
                    :options="recurringOptions" 
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Fréquence de récurrence"
                    class="w-full"
                  />
                  <small v-if="questForm.isRecurring" class="text-500 block mt-1">
                    La quête se réinitialise automatiquement
                  </small>
                </div>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="startDate" class="block text-900 font-bold mb-2">
                    <i class="pi pi-calendar text-green-500 mr-2"></i>Date de Début
                  </label>
                  <Calendar 
                    id="startDate"
                    v-model="questForm.startDate" 
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Optionnel"
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">Pour quêtes événement</small>
                </div>
              </div>
              
              <div class="col-12 md:col-6">
                <div class="mb-4">
                  <label for="endDate" class="block text-900 font-bold mb-2">
                    <i class="pi pi-calendar text-red-500 mr-2"></i>Date de Fin
                  </label>
                  <Calendar 
                    id="endDate"
                    v-model="questForm.endDate" 
                    dateFormat="dd/mm/yy"
                    showIcon
                    placeholder="Optionnel"
                    class="w-full"
                  />
                  <small class="text-500 block mt-1">Expiration automatique</small>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- 🪜 ONGLET 4: Étapes -->
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list"></i>
              <span class="font-semibold">Étapes</span>
              <Chip :label="questForm.steps.length.toString()" class="ml-2" />
            </div>
          </template>
          
          <div class="p-4">
            <div class="mb-4">
              <Button 
                @click="addStep"
                icon="pi pi-plus"
                label="Ajouter une étape"
                class="p-button-success"
              />
            </div>
            
            <div class="flex flex-column gap-3">
              <div 
                v-for="(step, index) in questForm.steps" 
                :key="index"
                class="surface-border border-1 border-round p-4"
              >
                <div class="flex align-items-center justify-content-between mb-3">
                  <h4 class="text-900 font-bold m-0">
                    <span class="inline-flex align-items-center justify-content-center bg-purple-100 text-purple-900 border-circle mr-2" 
                          style="width: 2rem; height: 2rem; font-size: 0.875rem;">
                      {{ index + 1 }}
                    </span>
                    Étape {{ index + 1 }}
                  </h4>
                  <Button 
                    @click="removeStep(index)"
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-text p-button-danger"
                    v-tooltip="'Supprimer'"
                  />
                </div>
                
                <div class="grid">
                  <div class="col-12">
                    <InputText 
                      v-model="step.title" 
                      placeholder="Titre de l'étape..."
                      class="w-full mb-2"
                    />
                  </div>
                  
                  <div class="col-12">
                    <Textarea 
                      v-model="step.description" 
                      placeholder="Description détaillée (optionnel)..."
                      rows="2"
                      class="w-full mb-2"
                    />
                  </div>
                  
                  <div class="col-12 md:col-4">
                    <div class="flex align-items-center gap-2">
                      <Checkbox v-model="step.required" :binary="true" inputId="`required${index}`" />
                      <label :for="`required${index}`" class="text-900">Étape requise</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
        
        <!-- 💡 ONGLET 5: Aide & Prérequis -->
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-lightbulb"></i>
              <span class="font-semibold">Aide</span>
            </div>
          </template>
          
          <div class="p-4">
            <div class="mb-4">
              <label class="block text-900 font-bold mb-2">
                <i class="pi pi-lightbulb text-yellow-500 mr-2"></i>Indices pour les Joueurs
              </label>
              <div class="flex flex-column gap-2">
                <div v-for="(hint, index) in questForm.hints" :key="index" class="flex gap-2">
                  <InputText 
                    v-model="questForm.hints[index]" 
                    placeholder="Ex: Cherchez dans la section histoire..."
                    class="flex-1"
                  />
                  <Button 
                    @click="questForm.hints.splice(index, 1)"
                    icon="pi pi-times"
                    class="p-button-rounded p-button-text p-button-danger"
                  />
                </div>
                <Button 
                  @click="questForm.hints.push('')"
                  icon="pi pi-plus"
                  label="Ajouter un indice"
                  class="p-button-text"
                />
              </div>
            </div>
            
            <div class="mb-4">
              <label class="block text-900 font-bold mb-2">
                <i class="pi pi-link text-blue-500 mr-2"></i>Quêtes Prérequises
              </label>
              <MultiSelect 
                v-model="questForm.prerequisites" 
                :options="quests" 
                optionLabel="title"
                optionValue="id"
                placeholder="Aucun prérequis"
                display="chip"
                class="w-full"
                filter
              />
              <small class="text-500 block mt-1">Quêtes à compléter avant de débloquer celle-ci</small>
            </div>
          </div>
        </TabPanel>
      </TabView>
      
      <template #footer>
        <Button 
          @click="showCreateDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="saveQuest" 
          :label="editingQuest ? 'Modifier' : 'Créer'"
          :loading="saving"
          class="p-button-success"
        />
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      header="Confirmer la suppression"
      :modal="true"
      :closable="true"
      :style="{ width: '400px' }"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <p>Êtes-vous sûr de vouloir supprimer la quête <strong>"{{ questToDelete?.title }}"</strong> ?</p>
        <p class="warning-text">Cette action est irréversible.</p>
      </div>
      
      <template #footer>
        <Button 
          @click="showDeleteDialog = false" 
          label="Annuler" 
          class="p-button-text"
        />
        <Button 
          @click="deleteQuest" 
          label="Supprimer"
          :loading="deleting"
          class="p-button-danger"
        />
      </template>
    </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import MultiSelect from 'primevue/multiselect'
import Slider from 'primevue/slider'
import Chip from 'primevue/chip'
import InputSwitch from 'primevue/inputswitch'
import adminQuestsService from '../../service/adminQuestsService'
import rolesService, { PERMISSIONS } from '../../service/rolesService'

const toast = useToast()
const router = useRouter()

// État réactif
const quests = ref([])
const filteredQuests = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// Filtres
const searchQuery = ref('')
const selectedStatus = ref(null)
const selectedType = ref(null)

// Dialogs
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editingQuest = ref(null)
const questToDelete = ref(null)
const activeFormTab = ref(0)

// Formulaire enrichi
const questForm = reactive({
  // Basique
  title: '',
  description: '',
  type: '',
  difficulty: 'easy',
  status: 'active',
  icon: '🗺️',
  
  // Récompenses
  points: 50,
  xp_reward: 100,
  rewardBadges: [],
  
  // Paramètres avancés
  minLevel: 1,
  maxLevel: null,
  targetHouses: [],
  
  // Timing
  duration: null, // en heures
  startDate: null,
  endDate: null,
  isRecurring: false,
  recurringType: null,
  
  // Prérequis
  prerequisites: [],
  
  // Étapes
  steps: [{ 
    title: '', 
    description: '',
    required: true,
    target: 1,
    current: 0
  }],
  
  // Aide
  hints: ['']
})

const errors = ref({})

// Options pour les dropdowns
const statusOptions = [
  { label: 'Tous', value: null },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Brouillon', value: 'draft' }
]

const difficultyOptions = [
  { label: 'Facile', value: 'easy' },
  { label: 'Moyen', value: 'medium' },
  { label: 'Difficile', value: 'hard' },
  { label: 'Légendaire', value: 'legendary' }
]

const typeOptions = [
  { label: 'Tous', value: null },
  { label: 'Principale', value: 'main' },
  { label: 'Secondaire', value: 'side' },
  { label: 'Événement', value: 'event' },
  { label: 'Quotidienne', value: 'daily' }
]

const recurringOptions = [
  { label: 'Quotidienne', value: 'daily' },
  { label: 'Hebdomadaire', value: 'weekly' },
  { label: 'Mensuelle', value: 'monthly' }
]

const houseOptions = [
  { label: 'Harmonis', value: 'Harmonis', color: '#2E8B57' },
  { label: 'Elaris', value: 'Elaris', color: '#DC143C' },
  { label: 'Doloris', value: 'Doloris', color: '#FFD700' },
  { label: 'Solencia', value: 'Solencia', color: '#4169E1' }
]

const iconOptions = [
  '🗺️', '⚔️', '🏆', '📚', '🔮', '⭐', '🎯', '🌟', 
  '💎', '🏅', '🎖️', '👑', '🛡️', '🗡️', '📜', '🔥'
]

const badgeOptions = ref([
  { label: 'Premier Pas', value: 'first_step' },
  { label: 'Explorateur', value: 'explorer' },
  { label: 'Sage', value: 'sage' },
  { label: 'Combattant', value: 'fighter' }
])

// Permissions supprimées - accès libre pour le développement
const canCreateQuests = computed(() => true)
const canEditQuests = computed(() => true)
const canDeleteQuests = computed(() => true)

// Méthodes
const loadQuests = async () => {
  try {
    loading.value = true
    // Récupération depuis Supabase
    const data = await adminQuestsService.getQuests()
    quests.value = data || []
    filterQuests()
    console.log('✅ Quêtes chargées:', quests.value.length)
  } catch (error) {
    console.error('❌ Erreur lors du chargement des quêtes:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les quêtes',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const filterQuests = () => {
  let filtered = [...quests.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quest => 
      quest.title.toLowerCase().includes(query) ||
      quest.description.toLowerCase().includes(query)
    )
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(quest => quest.status === selectedStatus.value)
  }
  
  if (selectedType.value) {
    filtered = filtered.filter(quest => quest.type === selectedType.value)
  }
  
  filteredQuests.value = filtered
}

const resetForm = () => {
  Object.assign(questForm, {
    title: '',
    description: '',
    type: '',
    difficulty: 'easy',
    points: 50,
    status: 'active',
    steps: [{ title: '' }]
  })
  errors.value = {}
  editingQuest.value = null
}

const validateForm = () => {
  errors.value = {}
  
  if (!questForm.title.trim()) {
    errors.value.title = 'Le titre est requis'
  }
  
  if (!questForm.description.trim()) {
    errors.value.description = 'La description est requise'
  }
  
  if (!questForm.type) {
    errors.value.type = 'Le type est requis'
  }
  
  if (!questForm.difficulty) {
    errors.value.difficulty = 'La difficulté est requise'
  }
  
  if (!questForm.points || questForm.points < 1) {
    errors.value.points = 'Les points doivent être supérieurs à 0'
  }
  
  return Object.keys(errors.value).length === 0
}

const addStep = () => {
  questForm.steps.push({ title: '' })
}

const removeStep = (index) => {
  if (questForm.steps.length > 1) {
    questForm.steps.splice(index, 1)
  }
}

const saveQuest = async () => {
  if (!validateForm()) return
  
  try {
    saving.value = true
    
    const questData = {
      title: questForm.title.trim(),
      description: questForm.description.trim(),
      type: questForm.type,
      difficulty: questForm.difficulty,
      points: questForm.points,
      status: questForm.status,
      steps: questForm.steps.filter(step => step.title.trim()).map(step => ({
        title: step.title.trim(),
        description: step.description || null,
        required: step.required !== false
      })),
      rewards: {
        xp: questForm.points,
        badges: [],
        items: []
      }
    }
    
    if (editingQuest.value) {
      await adminQuestsService.updateQuest(editingQuest.value.id, questData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Quête modifiée avec succès',
        life: 3000
      })
    } else {
      await adminQuestsService.createQuest(questData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: questData.status === 'active' 
          ? 'Quête créée et assignée à tous les utilisateurs !'
          : 'Quête créée avec succès',
        life: 4000
      })
    }
    
    showCreateDialog.value = false
    resetForm()
    await loadQuests()
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la sauvegarde',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const editQuest = (quest) => {
  editingQuest.value = quest
  Object.assign(questForm, {
    title: quest.title || '',
    description: quest.description || '',
    type: quest.type || '',
    difficulty: quest.difficulty || 'easy',
    points: quest.points || 50,
    status: quest.status || 'active',
    steps: quest.steps?.length ? [...quest.steps] : [{ title: '' }]
  })
  showCreateDialog.value = true
}

const confirmDeleteQuest = (quest) => {
  questToDelete.value = quest
  showDeleteDialog.value = true
}

const deleteQuest = async () => {
  if (!questToDelete.value) return
  
  try {
    deleting.value = true
    await adminQuestsService.deleteQuest(questToDelete.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Quête supprimée avec succès',
      life: 3000
    })
    
    showDeleteDialog.value = false
    questToDelete.value = null
    await loadQuests()
    
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: error.message || 'Erreur lors de la suppression',
      life: 3000
    })
  } finally {
    deleting.value = false
  }
}

const viewQuestDetails = (quest) => {
  console.log('Voir détails de la quête:', quest)
}

// Navigation vers la vue de création publique
const navigateToPublicCreation = () => {
  router.push('/gamification/create-quest')
}

// Utilitaires de rôles supprimés - système désactivé

const getTypeLabel = (type) => {
  const labels = {
    main: 'Principale',
    side: 'Secondaire',
    event: 'Événement',
    daily: 'Quotidienne'
  }
  return labels[type] || type
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    draft: 'Brouillon'
  }
  return labels[status] || status
}

const getStatusSeverity = (status) => {
  const severities = {
    active: 'success',
    inactive: 'secondary',
    draft: 'warning'
  }
  return severities[status] || 'info'
}

const getTypeSeverity = (type) => {
  const severities = {
    main: 'info',
    side: 'warning',
    event: 'danger',
    daily: 'success'
  }
  return severities[type] || 'info'
}

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('fr-FR')
}

// Lifecycle
onMounted(() => {
  loadQuests()
})
</script>

<style scoped>
/* Styles personnalisés supprimés - utilisation exclusive de PrimeVue et classes utilitaires */
</style>
