<template>
  <AdminLayout :noSidebar="true">
    <!-- Chargement de la session -->
    <div v-if="sessionLoading" class="flex align-items-center justify-content-center" style="min-height: 60vh;">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
        <p class="text-600">Chargement de la votation...</p>
      </div>
    </div>

    <!-- Pas de session active -->
    <div v-else-if="!activeSession" class="flex align-items-center justify-content-center" style="min-height: 60vh;">
      <div class="text-center surface-card p-5 border-round shadow-2" style="max-width: 500px;">
        <i class="pi pi-lock text-4xl text-orange-500 mb-3"></i>
        <h2 class="text-900 m-0 mb-2">Votation fermée</h2>
        <p class="text-600 m-0 mb-3">Aucune votation n'est ouverte pour le moment. Veuillez réessayer plus tard.</p>
        <PrimeButton label="Retour" icon="pi pi-arrow-left" outlined @click="goBackToProfile" />
      </div>
    </div>

    <!-- Votation active -->
    <div v-else class="votation-container">
      <!-- En-tête moderne -->
      <div class="votation-header">
        <div class="header-content">
          <div class="header-left">
            <i class="pi pi-check-square header-icon"></i>
            <div>
              <h1 class="header-title">Votation {{ targetPFP }}</h1>
              <p class="header-subtitle">Année {{ selectedYear }} • {{ availablePlaces.length }} places disponibles</p>
            </div>
          </div>
          <PrimeButton label="Retour" icon="pi pi-arrow-left" outlined @click="goBackToProfile" class="back-button" />
        </div>
      </div>

      <!-- Bandeau critères manquants pour PFP4 -->
      <div v-if="hasPfp4Sections" class="pfp4-missing-banner content-wrapper">
        <div class="pfp4-missing-card">
          <div class="flex align-items-center gap-3 flex-wrap">
            <i class="pi pi-exclamation-triangle text-2xl text-orange-500"></i>
            <div>
              <div class="text-900 font-bold text-lg mb-1">Critères à valider pour votre diplôme</div>
              <div class="flex align-items-center gap-2 flex-wrap">
                <Tag v-for="c in pfp4MissingCriteria" :key="c" :value="c" severity="danger" class="text-sm px-3 py-1" style="font-size: 0.95rem" />
              </div>
            </div>
          </div>
          <div class="text-600 mt-2 text-sm"><i class="pi pi-arrow-down mr-1"></i> Les places ci-dessous sont triées par pertinence. <strong>Privilégiez en priorité les places qui couvrent le plus grand nombre de vos critères manquants en terme d'équité !!</strong> Pour rappel il est obligatoire de <strong> valider au minimum une place dans la deuxième langue pour obtenir votre diplôme</strong>.</div>
        </div>
      </div>

      <!-- ═══ MODE SECTIONS PFP4 (avec critères manquants) ═══ -->
      <div v-if="hasPfp4Sections && availablePlaces.length > 0" class="content-wrapper">

        <!-- SECTION HAUTE PRIORITÉ -->
        <div v-if="pfp4HighPlaces.length > 0" class="pfp4-section pfp4-section-high mb-4">
          <div class="pfp4-section-header pfp4-section-header-high">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-star-fill text-xl"></i>
              <span class="font-bold text-lg">Priorité haute</span>
              <Tag :value="pfp4HighPlaces.length + ' places'" severity="success" class="ml-2" />
            </div>
            <span class="text-sm opacity-80">Couvrent 2+ de vos critères manquants — à privilégier</span>
          </div>
          <DataTable :value="pfp4HighPlaces" class="modern-votation-table pfp4-table-high" responsiveLayout="scroll" :scrollable="true" :rowHover="true">
            <Column header="Crit. couverts" :style="{ width: '110px', textAlign: 'center' }">
              <template #body="slotProps">
                <div class="pfp4-badge pfp4-badge-high">{{ slotProps.data.pfp4CoveredCount }} / {{ pfp4MissingCriteria.length }}</div>
              </template>
            </Column>
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"><i class="pi pi-building mr-2"></i>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a>
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"><div class="place-name font-semibold">{{ slotProps.data.NomPlace }}</div></template>
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template v-for="cr in ['MSQ','SYSINT','NEUROGER','AIGU','REHAB','AMBU']" :key="cr">
                    <Tag v-if="slotProps.data[cr]" :value="cr" :severity="isMissingCriteria(cr) ? 'danger' : 'success'" class="mr-1 mb-1" />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag v-if="slotProps.data.FR" value="FR" :severity="isMissingCriteria('FR') ? 'danger' : 'warning'" class="mr-1" />
                  <Tag v-if="slotProps.data.DE" value="DE" :severity="isMissingCriteria('DE') ? 'danger' : 'warning'" class="mr-1" />
                </div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'hc-'+i" :header="'Choix ' + i" :style="{ textAlign: 'center', width: '75px' }">
              <template #body="slotProps">
                <div class="radio-wrapper"><RadioButton v-model="selectedPlaces[i-1]" :value="slotProps.data" :disabled="isPlaceDisabled(slotProps.data, i-1)" @click="onRadioClick(slotProps.data, i-1, $event)" /></div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'hv-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '60px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data)['top'+i] || 0" :severity="getVoteCount(slotProps.data)['top'+i] > 0 ? 'primary' : 'secondary'" rounded />
              </template>
            </Column>
            <Column header="Total" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data).total || 0" severity="contrast" rounded class="font-semibold" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- SECTION MOYENNE PRIORITÉ -->
        <div v-if="pfp4MediumPlaces.length > 0" class="pfp4-section pfp4-section-medium mb-4">
          <div class="pfp4-section-header pfp4-section-header-medium">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-bookmark text-xl"></i>
              <span class="font-bold text-lg">Priorité moyenne</span>
              <Tag :value="pfp4MediumPlaces.length + ' places'" severity="warning" class="ml-2" />
            </div>
            <span class="text-sm opacity-80">Couvrent 1 critère manquant</span>
          </div>
          <DataTable :value="pfp4MediumPlaces" class="modern-votation-table pfp4-table-medium" responsiveLayout="scroll" :scrollable="true" :rowHover="true">
            <Column header="Crit. couverts" :style="{ width: '110px', textAlign: 'center' }">
              <template #body><div class="pfp4-badge pfp4-badge-medium">1 / {{ pfp4MissingCriteria.length }}</div></template>
            </Column>
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"><i class="pi pi-building mr-2"></i>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a>
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"><div class="place-name">{{ slotProps.data.NomPlace }}</div></template>
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template v-for="cr in ['MSQ','SYSINT','NEUROGER','AIGU','REHAB','AMBU']" :key="cr">
                    <Tag v-if="slotProps.data[cr]" :value="cr" :severity="isMissingCriteria(cr) ? 'danger' : 'success'" class="mr-1 mb-1" />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag v-if="slotProps.data.FR" value="FR" :severity="isMissingCriteria('FR') ? 'danger' : 'warning'" class="mr-1" />
                  <Tag v-if="slotProps.data.DE" value="DE" :severity="isMissingCriteria('DE') ? 'danger' : 'warning'" class="mr-1" />
                </div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'mc-'+i" :header="'Choix ' + i" :style="{ textAlign: 'center', width: '75px' }">
              <template #body="slotProps">
                <div class="radio-wrapper"><RadioButton v-model="selectedPlaces[i-1]" :value="slotProps.data" :disabled="isPlaceDisabled(slotProps.data, i-1)" @click="onRadioClick(slotProps.data, i-1, $event)" /></div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'mv-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '60px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data)['top'+i] || 0" :severity="getVoteCount(slotProps.data)['top'+i] > 0 ? 'primary' : 'secondary'" rounded />
              </template>
            </Column>
            <Column header="Total" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data).total || 0" severity="contrast" rounded class="font-semibold" />
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- SECTION AUTRES PLACES -->
        <div v-if="pfp4OtherPlaces.length > 0" class="pfp4-section pfp4-section-other mb-4">
          <div class="pfp4-section-header pfp4-section-header-other">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-list text-xl"></i>
              <span class="font-bold text-lg">Autres places disponibles</span>
              <Tag :value="pfp4OtherPlaces.length + ' places'" severity="secondary" class="ml-2" />
            </div>
            <span class="text-sm opacity-80">Ne couvrent aucun critère manquant mais restent disponibles</span>
          </div>
          <DataTable :value="pfp4OtherPlaces" class="modern-votation-table pfp4-table-other" responsiveLayout="scroll" :scrollable="true" :rowHover="true">
            <Column header="Institution" field="InstitutionName" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <a target="_blank" :href="slotProps.data.url" class="institution-link"><i class="pi pi-building mr-2"></i>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</a>
              </template>
            </Column>
            <Column header="Place" field="NomPlace" :style="{ minWidth: '160px' }">
              <template #body="slotProps"><div class="place-name">{{ slotProps.data.NomPlace }}</div></template>
            </Column>
            <Column header="Critères" :style="{ minWidth: '200px' }">
              <template #body="slotProps">
                <div class="criteria-tags">
                  <template v-for="cr in ['MSQ','SYSINT','NEUROGER','AIGU','REHAB','AMBU']" :key="cr">
                    <Tag v-if="slotProps.data[cr]" :value="cr" severity="success" class="mr-1 mb-1" />
                  </template>
                </div>
              </template>
            </Column>
            <Column header="Langues" :style="{ width: '100px' }">
              <template #body="slotProps">
                <div class="language-tags">
                  <Tag v-if="slotProps.data.FR" value="FR" severity="warning" class="mr-1" />
                  <Tag v-if="slotProps.data.DE" value="DE" severity="warning" class="mr-1" />
                </div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'oc-'+i" :header="'Choix ' + i" :style="{ textAlign: 'center', width: '75px' }">
              <template #body="slotProps">
                <div class="radio-wrapper"><RadioButton v-model="selectedPlaces[i-1]" :value="slotProps.data" :disabled="isPlaceDisabled(slotProps.data, i-1)" @click="onRadioClick(slotProps.data, i-1, $event)" /></div>
              </template>
            </Column>
            <Column v-for="i in 5" :key="'ov-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '60px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data)['top'+i] || 0" :severity="getVoteCount(slotProps.data)['top'+i] > 0 ? 'primary' : 'secondary'" rounded />
              </template>
            </Column>
            <Column header="Total" :style="{ textAlign: 'center', width: '70px' }">
              <template #body="slotProps">
                <Tag :value="getVoteCount(slotProps.data).total || 0" severity="contrast" rounded class="font-semibold" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- ═══ MODE CLASSIQUE (pas de sections PFP4) ═══ -->
      <div v-else-if="availablePlaces.length > 0" class="content-wrapper">
        <DataTable
          :value="availablePlaces"
          class="modern-votation-table"
          responsiveLayout="scroll"
          :scrollable="true"
          scrollHeight="65vh"
          :rowHover="true"
          stripedRows
        >
          <Column header="Institution" sortable field="InstitutionName" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <a target="_blank" :href="`${slotProps.data.url}`" class="institution-link">
                <i class="pi pi-building mr-2"></i>
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </a>
            </template>
          </Column>
          <Column header="Nom de la Place" sortable field="NomPlace" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <div class="place-name">{{ slotProps.data.NomPlace }}</div>
            </template>
          </Column>
          <Column header="Catégorie" sortable field="InstitutionCategory">
            <template #body="slotProps">
              <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
            </template>
          </Column>
          <Column header="Critères" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <div class="criteria-tags">
                <Tag v-if="slotProps.data.MSQ" value="MSQ" severity="success" class="mr-1 mb-1" />
                <Tag v-if="slotProps.data.SYSINT" value="SYSINT" severity="success" class="mr-1 mb-1" />
                <Tag v-if="slotProps.data.NEUROGER" value="NEUROGER" severity="success" class="mr-1 mb-1" />
                <Tag v-if="slotProps.data.AIGU" value="AIGU" severity="success" class="mr-1 mb-1" />
                <Tag v-if="slotProps.data.REHAB" value="REHAB" severity="success" class="mr-1 mb-1" />
                <Tag v-if="slotProps.data.AMBU" value="AMBU" severity="success" class="mr-1 mb-1" />
                <span v-if="!slotProps.data.MSQ && !slotProps.data.SYSINT && !slotProps.data.NEUROGER && !slotProps.data.AIGU && !slotProps.data.REHAB && !slotProps.data.AMBU" class="text-500">-</span>
              </div>
            </template>
          </Column>
          <Column header="Langues">
            <template #body="slotProps">
              <div class="language-tags">
                <Tag v-if="slotProps.data.FR" value="FR" severity="warning" class="mr-1" />
                <Tag v-if="slotProps.data.DE" value="DE" severity="warning" class="mr-1" />
                <span v-if="!slotProps.data.FR && !slotProps.data.DE" class="text-500">-</span>
              </div>
            </template>
          </Column>
          <Column v-for="i in 5" :key="'choice-'+i" :header="'Choix ' + i" :style="{ textAlign: 'center', width: '80px' }">
            <template #body="slotProps">
              <div class="radio-wrapper">
                <RadioButton
                  v-model="selectedPlaces[i-1]"
                  :value="slotProps.data"
                  :disabled="isPlaceDisabled(slotProps.data, i-1)"
                  @click="onRadioClick(slotProps.data, i-1, $event)"
                />
              </div>
            </template>
          </Column>
          <Column v-for="i in 5" :key="'votes-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '70px' }">
            <template #body="slotProps">
              <Tag
                :value="getVoteCount(slotProps.data)['top'+i] || 0"
                :severity="getVoteCount(slotProps.data)['top'+i] > 0 ? 'primary' : 'secondary'"
                rounded
              />
            </template>
          </Column>
          <Column header="Total" :style="{ textAlign: 'center', width: '80px' }">
            <template #body="slotProps">
              <Tag
                :value="getVoteCount(slotProps.data).total || 0"
                severity="contrast"
                rounded
                class="font-semibold"
              />
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="empty-state">
        <i class="pi pi-inbox empty-icon"></i>
        <h3>Aucune place disponible</h3>
        <p class="text-600">Aucune place n'est disponible pour {{ targetPFP }} - {{ selectedYear }}</p>
      </div>

      <!-- Tableau récapitulatif des choix -->
      <div class="recap-section" v-if="availablePlaces.length > 0 && selectedPlaces.some(p => p !== null)">
        <div class="recap-header">
          <i class="pi pi-list-check"></i>
          <h3>Récapitulatif de vos choix</h3>
        </div>
        <DataTable :value="selectedPlacesForRecap" class="recap-table" :rowHover="true">
          <Column header="Rang" :style="{ width: '80px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.rank" severity="primary" rounded class="font-semibold" />
            </template>
          </Column>
          <Column header="Institution" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <div class="recap-institution">
                <i class="pi pi-building mr-2"></i>
                <span>{{ slotProps.data.InstitutionName }}</span>
              </div>
            </template>
          </Column>
          <Column header="Nom de la Place" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <strong class="recap-place-name">{{ slotProps.data.NomPlace }}</strong>
            </template>
          </Column>
          <Column header="Catégorie">
            <template #body="slotProps">
              <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
            </template>
          </Column>
          <Column header="Critères" :style="{ minWidth: '180px' }">
            <template #body="slotProps">
              <div class="criteria-tags">
                <Tag v-if="slotProps.data.MSQ" value="MSQ" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.SYSINT" value="SYSINT" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.NEUROGER" value="NEUROGER" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.AIGU" value="AIGU" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.REHAB" value="REHAB" severity="success" class="mr-1" />
                <Tag v-if="slotProps.data.AMBU" value="AMBU" severity="success" class="mr-1" />
              </div>
            </template>
          </Column>
          <Column header="Action" :style="{ width: '100px', textAlign: 'center' }">
            <template #body="slotProps">
              <PrimeButton
                icon="pi pi-times"
                severity="danger"
                text
                rounded
                @click="removeChoice(slotProps.data.index)"
                v-tooltip.top="'Retirer ce choix'"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Action de vote -->
      <div class="vote-action-section" v-if="availablePlaces.length > 0">
        <div class="vote-submit">
          <div class="vote-info" :class="{ 'vote-info-updated': voteAlreadyCast }">
            <i :class="voteAlreadyCast ? 'pi pi-check-circle' : 'pi pi-info-circle'"></i>
            <span v-if="!voteAlreadyCast">Sélectionnez jusqu'à 5 places par ordre de préférence</span>
            <span v-else>Modifiez vos choix et cliquez sur "Mettre à jour" pour enregistrer les changements</span>
          </div>
          <PrimeButton
            :label="voteAlreadyCast ? 'Mettre à jour mon vote' : 'Envoyer mon vote'"
            :icon="voteAlreadyCast ? 'pi pi-refresh' : 'pi pi-send'"
            @click="sendVote"
            size="large"
            :disabled="selectedPlaces.filter(p => p !== null).length !== 5"
            :severity="voteAlreadyCast ? 'warning' : 'primary'"
          />
        </div>
      </div>

    </div>

    <!-- Dialogue de confirmation moderne -->
    <PrimeDialog
      v-model:visible="dialogVisible"
      :modal="true"
      :closable="false"
      :style="{ width: '450px' }"
      class="modern-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <i class="pi pi-check-circle" style="color: var(--green-500); font-size: 1.5rem;"></i>
          <span class="font-semibold">Confirmation</span>
        </div>
      </template>
      <p class="dialog-message">{{ dialogMessage }}</p>
      <template #footer>
        <PrimeButton label="OK" icon="pi pi-check" @click="closeDialog" autofocus />
      </template>
    </PrimeDialog>
  </AdminLayout>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import RadioButton from 'primevue/radiobutton';
import PrimeDialog from 'primevue/dialog';
import PrimeButton from 'primevue/button';
import Tag from 'primevue/tag';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { useUserStore } from '@/stores/userStore'
import { useVotesStore } from '@/stores/votesStore'
import { mapStores } from 'pinia'
import votesBackendService from '@/service/votesBackendService'
import votationSessionService from '@/service/votationSessionService'
import resultatVotationService from '@/service/resultatVotationService'
import { supabase } from '@/supabase'

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
const DEBUG_VOTATION = import.meta.env.VITE_DEBUG_VOTATION === 'true'
const debugVotation = (...args) => {
  if (DEBUG_VOTATION) console.debug(...args)
}

export default {
  name: 'VotationGenericView',
  components: {
    DataTable,
    Column,
    RadioButton,
    PrimeDialog,
    PrimeButton,
    Tag,
    AdminLayout
  },
  data() {
    return {
      places: [],
      expandedPFPData: [],
      selectedPlaces: [null, null, null, null, null],
      votedPlaces: [null, null, null, null, null],
      dialogVisible: false,
      dialogMessage: "",
      votesAggregation: {},
      selectedYear: null,
      targetPFP: null,
      isSubmitting: false,
      activeSession: null,
      sessionLoading: true,
      sessionRefreshInFlight: false,
      pfp4ProposedPlaceIds: null,
      pfp4AssignCountByPlace: {},
      offerSeatCountByPlace: {},
      offerOccupiedSeatCountByPlace: {},
      useOfferSeatActivation: false,
      completedPlaceIds: [],
      pfp4MissingCriteria: [],
      pfp4AppliedRule: null
    };
  },
  computed: {
    ...mapStores(usePlacesStore, useInstitutionsStore, useUserStore, useVotesStore),

    availablePlaces() {
      return this.expandedPFPData;
    },
    voteAlreadyCast() {
      return this.votedPlaces[0] !== null;
    },
    completedPlaceIdSet() {
      return new Set(
        (this.completedPlaceIds || [])
          .map(id => this.normalizePlaceId(id))
          .filter(Boolean)
      )
    },
    hasPfp4Sections() {
      return (this.targetPFP === 'PFP4' || this.targetPFP === 'PFP3') && this.pfp4MissingCriteria && this.pfp4MissingCriteria.length > 0
    },
    pfp4HighPlaces() {
      return this.expandedPFPData.filter(r => r.pfp4Section === 'high')
    },
    pfp4MediumPlaces() {
      return this.expandedPFPData.filter(r => r.pfp4Section === 'medium')
    },
    pfp4OtherPlaces() {
      return this.expandedPFPData.filter(r => r.pfp4Section === 'other')
    },
    selectedPlacesForRecap() {
      return this.selectedPlaces
        .map((place, index) => {
          if (place) {
            return {
              ...place,
              rank: index + 1,
              index: index
            }
          }
          return null
        })
        .filter(p => p !== null)
    }
  },
  methods: {
    goBackToProfile() {
      try {
        this.$router.back();
      } catch (e) {
        this.$router.push('/feed');
      }
    },

    getAcademicYearKeys(year) {
      const y = Number(year)
      if (!Number.isFinite(y)) return [String(year)]
      return [String(y), `${y - 1}-${y}`]
    },

    getValueForYearKey(source, year) {
      if (!source || typeof source !== 'object') return undefined
      const yearKeys = this.getAcademicYearKeys(year)
      for (const yearKey of yearKeys) {
        if (Object.prototype.hasOwnProperty.call(source, yearKey)) {
          return source[yearKey]
        }
      }
      return undefined
    },

    normalizeId(value) {
      return value === null || value === undefined ? '' : String(value)
    },

    normalizePlaceId(value) {
      if (value === null || value === undefined) return null
      const normalized = String(value).trim()
      return normalized.length > 0 ? normalized : null
    },

    resolvePlaceId(value) {
      if (value && typeof value === 'object') {
        return this.normalizePlaceId(
          value.PlaceId ?? value.IDPlace ?? value.ID_PFP ?? value.id_pfp ?? value.assigned_place_id ?? null
        )
      }
      return this.normalizePlaceId(value)
    },

    getPlaceByResolvedId(placeId) {
      const resolvedId = this.resolvePlaceId(placeId)
      if (!resolvedId) return null
      return this.places.find(place => this.resolvePlaceId(place) === resolvedId) || null
    },

    getPlaceCapacityFieldData(place) {
      const pfpFieldCandidates = [
        `${String(this.targetPFP || '').toLowerCase()}_proposition`,
        this.targetPFP
      ]

      return pfpFieldCandidates
        .map(field => place?.[field])
        .find(val => val && typeof val === 'object') || null
    },

    getOfferSeatPrefix() {
      const targetClass = String(this.activeSession?.target_class || this.userStore?.profile?.classe || '').trim()
      const normalizedPfp = (this.targetPFP === 'PFP1A' || this.targetPFP === 'PFP1B') ? 'PFP1' : this.targetPFP
      if (!targetClass || !normalizedPfp) return null
      return {
        active: `selectedActive${targetClass}${normalizedPfp}-`,
        student: `selectedEtudiant${targetClass}${normalizedPfp}-`
      }
    },

    computeOfferSeatAvailability() {
      const prefixes = this.getOfferSeatPrefix()
      const activeCountByPlace = {}
      const occupiedCountByPlace = {}
      let foundOfferFields = false

      if (!prefixes) {
        return { activeCountByPlace, occupiedCountByPlace, foundOfferFields }
      }

      this.places.forEach(place => {
        const placeId = place?.PlaceId
        if (!placeId) return

        let activeCount = 0
        let occupiedCount = 0
        const keys = Object.keys(place || {})
        const activeSeatKeys = keys.filter(key => key.startsWith(prefixes.active))

        activeSeatKeys.forEach(activeKey => {
          const seatSuffix = activeKey.slice(prefixes.active.length)
          const isActive = place[activeKey] === true || place[activeKey] === 'true'
          if (!isActive) return

          activeCount += 1
          const studentKey = `${prefixes.student}${seatSuffix}`
          const studentValue = place[studentKey]
          if (studentValue !== undefined && studentValue !== null && String(studentValue).trim() !== '') {
            occupiedCount += 1
          }
        })

        const fieldData = this.getPlaceCapacityFieldData(place)
        const nestedAssignations = fieldData?.assignations && typeof fieldData.assignations === 'object'
          ? fieldData.assignations
          : null

        if (nestedAssignations) {
          const targetClass = String(this.activeSession?.target_class || this.userStore?.profile?.classe || '').trim()
          const nestedEntries = Object.entries(nestedAssignations).filter(([seatKey]) => {
            if (!targetClass) return true
            return String(seatKey || '').startsWith(`${targetClass}-`)
          })

          if (nestedEntries.length > 0) {
            foundOfferFields = true
          }

          let nestedActiveCount = 0
          let nestedOccupiedCount = 0

          nestedEntries.forEach(([, seatData]) => {
            const isActive = seatData?.active === true || seatData?.active === 'true'
            if (!isActive) return

            nestedActiveCount += 1
            const studentValue = seatData?.etudiant
            if (studentValue !== undefined && studentValue !== null && String(studentValue).trim() !== '') {
              nestedOccupiedCount += 1
            }
          })

          activeCount = Math.max(activeCount, nestedActiveCount)
          occupiedCount = Math.max(occupiedCount, nestedOccupiedCount)
        }

        if (activeSeatKeys.length > 0) {
          foundOfferFields = true
        }

        if (activeCount > 0 || occupiedCount > 0) {
          activeCountByPlace[placeId] = activeCount
          occupiedCountByPlace[placeId] = occupiedCount
        }
      })

      return { activeCountByPlace, occupiedCountByPlace, foundOfferFields }
    },

    parsePfpValided(pfpVal) {
      if (!pfpVal) return []
      if (Array.isArray(pfpVal)) return pfpVal
      if (typeof pfpVal === 'string') {
        try {
          const parsed = JSON.parse(pfpVal)
          return Array.isArray(parsed) ? parsed : []
        } catch (error) {
          return []
        }
      }
      if (typeof pfpVal === 'object') return Object.values(pfpVal)
      return []
    },

    extractProfileStageEntries(rows) {
      if (!Array.isArray(rows) || rows.length === 0) return []

      const entries = []
      rows.forEach(row => {
        entries.push(...this.parsePfpValided(row?.pfp_valided))

        const pfp2Val = row?.pfp2_data
        if (Array.isArray(pfp2Val)) {
          entries.push(...pfp2Val)
        } else if (pfp2Val && typeof pfp2Val === 'object') {
          entries.push(pfp2Val)
        }
      })

      return entries.filter(entry => entry && typeof entry === 'object')
    },

    extractCriteriaFromObject(obj) {
      if (!obj) return {}
      const criteria = {}
      CRITERIA_KEYS.forEach(key => {
        criteria[key] = !!(obj[key] || obj[key.toLowerCase()])
      })
      return criteria
    },

    getPriorityMissingCriteria() {
      const missing = this.pfp4MissingCriteria || []
      if ((this.completedPlaceIds || []).length < 2) {
        return missing.filter(criteria => criteria !== 'DE')
      }
      return missing
    },

    async loadCompletedPlaceIds() {
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId) {
        this.completedPlaceIds = []
        return
      }

      const [physioResult, assignmentsResult] = await Promise.all([
        supabase
          .from('StudentsPhysio')
          .select('pfp_valided, pfp2_data')
          .eq('user_id', userId),
        supabase
          .from('student_result_vote')
          .select('assigned_place_id, pfp_validee')
          .eq('user_id', userId)
          .eq('pfp_validee', true)
          .not('assigned_place_id', 'is', null)
      ])

      if (physioResult.error) throw physioResult.error
      if (assignmentsResult.error) throw assignmentsResult.error

      const completed = new Set()
      const physioStages = this.extractProfileStageEntries(physioResult.data || [])

      physioStages.forEach(stage => {
        const placeId = this.resolvePlaceId(stage)
        if (placeId) completed.add(String(placeId))
      })

      ;(assignmentsResult.data || []).forEach(row => {
        const placeId = this.resolvePlaceId(row)
        if (placeId) completed.add(placeId)
      })

      this.completedPlaceIds = Array.from(completed)
    },

    async loadMissingCriteriaFromStudentData(options = {}) {
      const { preserveAppliedRule = false } = options
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId) {
        this.pfp4MissingCriteria = []
        if (!preserveAppliedRule) {
          this.pfp4AppliedRule = null
        }
        return []
      }

      const scores = Object.fromEntries(CRITERIA_KEYS.map(key => [key, 0]))
      const [physioResult, assignmentsResult] = await Promise.all([
        supabase
          .from('StudentsPhysio')
          .select('pfp_valided, pfp2_data, year')
          .eq('user_id', userId)
          .order('year', { ascending: false }),
        supabase
          .from('student_result_vote')
          .select('pfp_type, assigned_place_id, pfp_validee')
          .eq('user_id', userId)
      ])

      if (physioResult.error) {
        throw physioResult.error
      }
      if (assignmentsResult.error) {
        throw assignmentsResult.error
      }

      const physioRows = Array.isArray(physioResult.data) ? physioResult.data : []
      const validatedStages = this.extractProfileStageEntries(physioRows)
      const knownPlaceIds = new Set(
        validatedStages
          .map(stage => this.resolvePlaceId(stage))
          .filter(Boolean)
      )

      physioRows.forEach(row => {
        const profileCriteria = this.extractCriteriaFromObject(row)
        CRITERIA_KEYS.forEach(key => {
          if (profileCriteria[key]) scores[key]++
        })
      })

      validatedStages.forEach(stage => {
        const criteria = this.extractCriteriaFromObject(stage)
        const stagePlace = this.getPlaceByResolvedId(stage)
        CRITERIA_KEYS.forEach(key => {
          if (criteria[key] || stagePlace?.[key]) scores[key]++
        })
      })

      ;(assignmentsResult.data || []).forEach(assignment => {
        const assignedPlaceId = this.resolvePlaceId(assignment)
        if (!assignment.pfp_validee || !assignedPlaceId) return
        if (knownPlaceIds.has(assignedPlaceId)) return

        const place = this.getPlaceByResolvedId(assignedPlaceId)
        if (!place) return

        CRITERIA_KEYS.forEach(key => {
          if (place[key]) scores[key]++
        })
        knownPlaceIds.add(assignedPlaceId)
      })

      const missingCriteria = CRITERIA_KEYS.filter(key => scores[key] === 0)
      this.pfp4MissingCriteria = missingCriteria
      if (!preserveAppliedRule) {
        this.pfp4AppliedRule = this.targetPFP === 'PFP3' ? 'PFP3_CRITERIA_SORT_LOCAL' : this.pfp4AppliedRule
      }
      debugVotation(`🎯 ${this.targetPFP} critères manquants calculés:`, missingCriteria)
      return missingCriteria
    },

    async loadProposalsFromSessionDirect() {
      const userId = this.userStore.profile?.user_id || this.userStore.user?.id || null
      if (!userId || !this.targetPFP || !this.selectedYear) {
        return null
      }

      const activeMap = this.activeSession?.pfp4_proposals
      if (activeMap && typeof activeMap === 'object') {
        const directStudentProposal = activeMap[userId] || null
        return {
          proposedPlaceIds: directStudentProposal?.placeIds || null,
          missingCriteria: directStudentProposal?.missingCriteria || [],
          appliedRule: directStudentProposal?.appliedRule || null,
          assignCounts: activeMap._assignCounts || {}
        }
      }

      let query = supabase
        .from('votation_sessions')
        .select('id, pfp4_proposals, created_at')
        .eq('pfp_type', this.targetPFP)
        .eq('year', this.selectedYear)

      if (this.activeSession?.target_class) {
        query = query.eq('target_class', this.activeSession.target_class)
      }

      const { data: sessions, error } = await query
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw error
      }

      const session = Array.isArray(sessions) ? sessions[0] : null
      const map = session?.pfp4_proposals || {}
      const studentProposal = map[userId] || null

      return {
        proposedPlaceIds: studentProposal?.placeIds || null,
        missingCriteria: studentProposal?.missingCriteria || [],
        appliedRule: studentProposal?.appliedRule || null,
        assignCounts: map._assignCounts || {}
      }
    },

    async refreshSessionAndData() {
      if (this.sessionRefreshInFlight) return
      this.sessionRefreshInFlight = true
      try {
        await this.loadSession()
        if (this.activeSession) {
          await this.fetchData()
        } else {
          this.targetPFP = null
          this.selectedYear = null
          this.places = []
          this.expandedPFPData = []
        }
      } finally {
        this.sessionRefreshInFlight = false
      }
    },

    async loadSession() {
      this.sessionLoading = true
      try {
        // Lire le pfpType depuis le paramètre de route
        const routePfpType = this.$route.params.pfpType
        const currentUserId = this.userStore.profile?.user_id || this.userStore.user?.id || null
        const currentUserIdNormalized = this.normalizeId(currentUserId)

        // Helper: filtre les sessions prioritaires pour l'étudiant courant
        const filterSessionForUser = (sessions) => {
          if (!sessions || sessions.length === 0) return null
          for (const session of sessions) {
            if (session.is_priority) {
              // Session prioritaire : seuls les étudiants dans priority_user_ids y ont accès
              const allowedIds = Array.isArray(session.priority_user_ids)
                ? session.priority_user_ids.map(id => this.normalizeId(id))
                : []
              if (currentUserIdNormalized && allowedIds.includes(currentUserIdNormalized)) {
                return session
              }
              // Étudiant non-prioritaire → ignorer cette session
              continue
            }
            // Session normale → accessible à tous
            return session
          }
          return null
        }

        // Charger toutes les sessions ouvertes une seule fois
        const allSessions = await votationSessionService.getAllActiveSessions()
        debugVotation('🔍 Sessions ouvertes:', allSessions.length, allSessions.map(s => ({
          pfp_type: s.pfp_type, is_priority: s.is_priority,
          priority_user_ids: s.priority_user_ids?.length || 0
        })))
        debugVotation('🔍 currentUserId:', currentUserId)

        if (routePfpType) {
          // Route générique /votation/:pfpType — chercher la session pour ce PFP
          const routePfpTypeNormalized = String(routePfpType || '').toUpperCase()
          const matching = allSessions.filter(s => String(s.pfp_type || '').toUpperCase() === routePfpTypeNormalized)
          this.activeSession = filterSessionForUser(matching)
        } else {
          // Routes legacy /votation ou /votation_pfp1b
          const routeName = this.$route.name
          let pfpHint = null
          if (routeName === 'VotationView' || routeName === 'VotationViewLegacy') {
            pfpHint = 'PFP1A'
          } else if (routeName === 'VotationViewPFP1B' || routeName === 'VotationViewPFP1BLegacy') {
            pfpHint = 'PFP1B'
          }

          if (pfpHint) {
            const matching = allSessions.filter(s => s.pfp_type === pfpHint)
            debugVotation(`🔍 Recherche session pour ${pfpHint}:`, matching.length, 'trouvée(s)')
            this.activeSession = filterSessionForUser(matching)
          }

          // Fallback : si aucune session trouvée, chercher si l'étudiant est dans une session prioritaire (tout PFP confondu)
          if (!this.activeSession && currentUserId) {
            debugVotation('🔍 Fallback: recherche session prioritaire pour cet étudiant...')
            const prioritySession = allSessions.find(s =>
              s.is_priority &&
              Array.isArray(s.priority_user_ids) &&
              s.priority_user_ids.map(id => this.normalizeId(id)).includes(currentUserIdNormalized)
            )
            if (prioritySession) {
              debugVotation(`✅ Session prioritaire trouvée via fallback: ${prioritySession.pfp_type}`)
              this.activeSession = prioritySession
            }
          }

          // Fallback 2 : chercher par classe (user_profiles ou pfp_cohort)
          if (!this.activeSession) {
            const profile = this.userStore.profile
            const studentClass = profile?.Classe || profile?.classe || profile?.class || profile?.Class || profile?.pfp_cohort || null
            if (studentClass) {
              debugVotation(`🔍 Fallback 2: recherche session pour classe ${studentClass}`)
              const classSessions = allSessions.filter(s => s.target_class === studentClass)
              this.activeSession = filterSessionForUser(classSessions)
            }
          }

          // Fallback 3 : prendre la première session normale ouverte (non-prioritaire)
          if (!this.activeSession) {
            debugVotation('🔍 Fallback 3: recherche première session normale ouverte...')
            const normalSession = allSessions.find(s => !s.is_priority)
            if (normalSession) {
              debugVotation(`✅ Session normale trouvée via fallback 3: ${normalSession.pfp_type} ${normalSession.year} (classe ${normalSession.target_class})`)
              this.activeSession = normalSession
            }
          }
        }

        if (this.activeSession) {
          this.targetPFP = this.activeSession.pfp_type
          this.selectedYear = this.activeSession.year
          debugVotation(`✅ Session active trouvée: ${this.targetPFP} ${this.selectedYear}${this.activeSession.is_priority ? ' (prioritaire)' : ''}`)
        } else {
          debugVotation('⚠️ Aucune session de votation active trouvée')
        }
      } catch (error) {
        console.error('❌ Erreur chargement session:', error)
        this.activeSession = null
      } finally {
        this.sessionLoading = false
      }
    },

    async fetchData() {
      if (!this.targetPFP || !this.selectedYear) return
      await this.institutionsStore.fetchInstitutions();
      await this.placesStore.fetchPlaces();
      await this.loadCompletedPlaceIds();

      await this.loadVoteStatistics();

      const rawPlaces = this.placesStore.places;
      const institutionNameById = {};
      const institutionCategoryById = {};

      this.institutionsStore.institutions.forEach(inst => {
        institutionNameById[inst.InstitutionId] = inst.Name;
        institutionCategoryById[inst.InstitutionId] = inst.Category || 'Non spécifié';
      });

      this.places = rawPlaces.map(p => {
        return {
          ...p,
          InstitutionName: institutionNameById[p.InstitutionId] || p.InstitutionName || 'Inconnu',
          InstitutionCategory: institutionCategoryById[p.InstitutionId] || 'Non spécifié',
          url: `/institution/${p.InstitutionId}`,
          MSQ: !!p.MSQ,
          SYSINT: !!p.SYSINT,
          NEUROGER: !!p.NEUROGER,
          AIGU: !!p.AIGU,
          REHAB: !!p.REHAB,
          AMBU: !!p.AMBU,
          FR: !!p.FR,
          DE: !!p.DE
        };
      });

      this.pfp4ProposedPlaceIds = null
      this.pfp4AssignCountByPlace = {}
      this.offerSeatCountByPlace = {}
      this.offerOccupiedSeatCountByPlace = {}
      this.useOfferSeatActivation = false
      this.pfp4MissingCriteria = []
      this.pfp4AppliedRule = null

      const offerAvailability = this.computeOfferSeatAvailability()
      this.offerSeatCountByPlace = offerAvailability.activeCountByPlace
      this.offerOccupiedSeatCountByPlace = offerAvailability.occupiedCountByPlace
      this.useOfferSeatActivation = offerAvailability.foundOfferFields

      try {
        this.pfp4AssignCountByPlace = await resultatVotationService.getAssignmentCounts(this.targetPFP, this.selectedYear)
      } catch (assignmentReadError) {
        debugVotation(`⚠️ Lecture assignations ${this.targetPFP} via backend échouée:`, assignmentReadError.message)
        try {
          const fromSession = await this.loadProposalsFromSessionDirect()
          if (fromSession?.assignCounts && Object.keys(fromSession.assignCounts).length > 0) {
            this.pfp4AssignCountByPlace = fromSession.assignCounts
          } else {
            throw new Error('No session assignCounts available')
          }
        } catch (sessionFallbackError) {
          debugVotation(`⚠️ Lecture assignations ${this.targetPFP} via session échouée:`, sessionFallbackError.message)
          try {
            const { data: assignedRows, error: assignedError } = await supabase
              .from('student_result_vote')
              .select('assigned_place_id')
              .eq('pfp_type', this.targetPFP)
              .in('year', this.getAcademicYearKeys(this.selectedYear))
              .not('assigned_place_id', 'is', null)

            if (assignedError) {
              throw assignedError
            }

            const assignCountByPlace = {}
            ;(assignedRows || []).forEach(row => {
              const placeId = row.assigned_place_id
              if (!placeId) return
              assignCountByPlace[placeId] = (assignCountByPlace[placeId] || 0) + 1
            })
            this.pfp4AssignCountByPlace = assignCountByPlace
          } catch (directReadError) {
            debugVotation(`⚠️ Lecture assignations ${this.targetPFP} via Supabase échouée:`, directReadError.message)
          }
        }
      }

      try {
        const fromSession = await this.loadProposalsFromSessionDirect()
        if (fromSession?.assignCounts && Object.keys(fromSession.assignCounts).length > 0) {
          Object.entries(fromSession.assignCounts).forEach(([placeId, value]) => {
            const n = Number(value) || 0
            if (!this.pfp4AssignCountByPlace[placeId] || this.pfp4AssignCountByPlace[placeId] < n) {
              this.pfp4AssignCountByPlace[placeId] = n
            }
          })
        }
      } catch (sessionCountsError) {
        debugVotation(`⚠️ Fusion assignations session ${this.targetPFP} échouée:`, sessionCountsError.message)
      }

      // Pour PFP4: charger les propositions personnalisées et les assignations existantes
      if (this.targetPFP === 'PFP4' && this.selectedYear) {
        try {
          const result = await resultatVotationService.getPfp4Proposals(this.selectedYear, this.activeSession?.target_class || null)
          this.pfp4ProposedPlaceIds = result.proposedPlaceIds
          const proposalAssignCounts = result.assignCounts || {}
          Object.entries(proposalAssignCounts).forEach(([placeId, value]) => {
            const nextValue = Number(value) || 0
            if (!this.pfp4AssignCountByPlace[placeId] || this.pfp4AssignCountByPlace[placeId] < nextValue) {
              this.pfp4AssignCountByPlace[placeId] = nextValue
            }
          })
          this.pfp4MissingCriteria = result.missingCriteria || []
          this.pfp4AppliedRule = result.appliedRule || null
          debugVotation('🎯 PFP4 propositions chargées:', result.proposedPlaceIds ? result.proposedPlaceIds.length + ' places' : 'aucune (toutes visibles)')
          debugVotation('🎯 PFP4 critères manquants:', this.pfp4MissingCriteria, 'règle:', this.pfp4AppliedRule)
          const totalSeats = Object.values(this.pfp4AssignCountByPlace).reduce((s,v) => s+v, 0)
          debugVotation(`🎯 PFP4 assignations existantes: ${Object.keys(this.pfp4AssignCountByPlace).length} places, ${totalSeats} sièges pris`)
        } catch (err) {
          debugVotation('⚠️ Impossible de charger les propositions PFP4:', err.message)
          this.pfp4ProposedPlaceIds = null
        }
      }

      if (this.targetPFP === 'PFP3') {
        try {
          const result = await resultatVotationService.getPfp3Proposals(this.selectedYear, this.activeSession?.target_class || null)
          this.pfp4ProposedPlaceIds = result.proposedPlaceIds
          const proposalAssignCounts = result.assignCounts || {}
          Object.entries(proposalAssignCounts).forEach(([placeId, value]) => {
            const nextValue = Number(value) || 0
            if (!this.pfp4AssignCountByPlace[placeId] || this.pfp4AssignCountByPlace[placeId] < nextValue) {
              this.pfp4AssignCountByPlace[placeId] = nextValue
            }
          })
          this.pfp4MissingCriteria = result.missingCriteria || []
          this.pfp4AppliedRule = result.appliedRule || null

          if (!this.pfp4MissingCriteria.length) {
            await this.loadMissingCriteriaFromStudentData()
          }

          debugVotation('🎯 PFP3 propositions chargées:', result.proposedPlaceIds ? result.proposedPlaceIds.length + ' places' : 'aucune (fallback tri)')
        } catch (err) {
          debugVotation('⚠️ Impossible de charger les propositions PFP3:', err.message)
          try {
            const direct = await this.loadProposalsFromSessionDirect()
            if (direct?.proposedPlaceIds && Array.isArray(direct.proposedPlaceIds)) {
              this.pfp4ProposedPlaceIds = direct.proposedPlaceIds
              if (direct.assignCounts && Object.keys(direct.assignCounts).length > 0) {
                this.pfp4AssignCountByPlace = {
                  ...this.pfp4AssignCountByPlace,
                  ...direct.assignCounts
                }
              }
              this.pfp4MissingCriteria = direct.missingCriteria || []
              this.pfp4AppliedRule = direct.appliedRule || null
              if (!this.pfp4MissingCriteria.length) {
                await this.loadMissingCriteriaFromStudentData()
              }
              debugVotation('🎯 PFP3 propositions chargées via session:', this.pfp4ProposedPlaceIds.length)
            } else {
              await this.loadMissingCriteriaFromStudentData()
            }
          } catch (fallbackErr) {
            debugVotation('⚠️ Impossible de charger les critères manquants PFP3:', fallbackErr.message)
            this.pfp4MissingCriteria = []
            this.pfp4AppliedRule = null
          }
        }
      }

      if (this.targetPFP === 'PFP3' || this.targetPFP === 'PFP4') {
        await this.loadMissingCriteriaFromStudentData({ preserveAppliedRule: true })
      }

      this.updateExpandedData();

      await this.checkExistingVote();
    },

    async loadVoteStatistics() {
      try {
        const aggregation = await votesBackendService.getVotePlaceAggregation(this.targetPFP, this.selectedYear);

        this.votesAggregation = {};

        aggregation.forEach(agg => {
          const placeId = agg.place_id;
          const rank = agg.rank;
          const count = agg.vote_count;

          if (!this.votesAggregation[placeId]) {
            this.votesAggregation[placeId] = {
              top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
            };
          }

          this.votesAggregation[placeId][`top${rank}`] = count;
          this.votesAggregation[placeId].total += count;
        });
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.votesAggregation = {};
      }
    },

    async checkExistingVote() {
      if (!this.userStore.user) return;

      try {
        const existingVote = await this.votesStore.fetchVote(this.targetPFP, this.selectedYear);

        if (existingVote && existingVote.choices) {
          this.votedPlaces = [null, null, null, null, null];
          this.selectedPlaces = [null, null, null, null, null];

          if (Array.isArray(existingVote.choices)) {
            this.votedPlaces = existingVote.choices.map(c => ({
              placeName: c.placeName || 'Inconnu',
              InstitutionName: c.InstitutionName || 'Inconnu'
            }));

            existingVote.choices.forEach((choice, index) => {
              const matchingPlace = this.expandedPFPData.find(p =>
                p.PlaceId === choice.placeId && p.seatIndex === choice.seatIndex
              );

              if (matchingPlace) {
                this.selectedPlaces[index] = matchingPlace;
              }
            });

            while(this.votedPlaces.length < 5) {
              this.votedPlaces.push(null);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du vote:', error);
      }
    },

    updateExpandedData() {
      const rows = [];
      const sorted = this.places.slice().sort((a, b) =>
        (a.NomPlace || '').localeCompare(b.NomPlace || '')
      );

      sorted.forEach(place => {
        let count = 0;
        const fieldData = this.getPlaceCapacityFieldData(place)

        if (fieldData) {
          const yr = String(this.selectedYear);
          // Si la clé year existe explicitement, l'utiliser (même si "0")
          // Ne fallback sur default QUE si la clé year n'existe pas du tout
          if (Object.prototype.hasOwnProperty.call(fieldData, yr) && fieldData[yr] !== '' && fieldData[yr] !== null && fieldData[yr] !== undefined) {
            count = parseInt(fieldData[yr]) || 0;
          } else {
            const academicVal = this.getValueForYearKey(fieldData, this.selectedYear)
            if (academicVal !== undefined && academicVal !== null && academicVal !== '') {
              count = parseInt(academicVal) || 0
            } else {
              const defVal = parseInt(fieldData['default'] || '0');
              count = !isNaN(defVal) ? defVal : 0;
            }
          }
        }
        const offerCapacity = this.offerSeatCountByPlace[place.PlaceId]
        if (this.useOfferSeatActivation && Number.isFinite(offerCapacity)) {
          count = Number(offerCapacity) || 0
        }

        const baseCapacity = count
        const assignedCountFromVotes = Number(this.pfp4AssignCountByPlace[place.PlaceId] || 0)
        const assignedCountFromOffer = Number(this.offerOccupiedSeatCountByPlace[place.PlaceId] || 0)
        const assignedCount = Math.max(assignedCountFromVotes, assignedCountFromOffer)
        if (assignedCount > 0) {
          count -= assignedCount
        }

        if ((place.NomPlace || '').toLowerCase().includes('leukerbad')) {
          debugVotation('🎯 DEBUG Leukerbad', {
            pfp: this.targetPFP,
            year: this.selectedYear,
            placeId: place.PlaceId,
            placeName: place.NomPlace,
            baseCapacity,
            assignedCountFromVotes,
            assignedCountFromOffer,
            assignedCount,
            remaining: count
          })
        }

        if (!isNaN(count) && count >= 1) {
          for (let i = 1; i <= count; i++) {
            rows.push({
              ...place,
              seatIndex: i,
              uniqueKey: `${place.PlaceId}-${i}`
            });
          }
        }
      });
      const applyMissingCriteriaSections = (inputRows) => {
        const missing = this.getPriorityMissingCriteria()
        if (missing.length === 0) return inputRows

        inputRows.forEach(row => {
          const coveredCount = missing.filter(c => CRITERIA_KEYS.includes(c) && row[c]).length
          row.pfp4CoveredCount = coveredCount
          if (coveredCount >= 2) {
            row.pfp4Section = 'high'
            row.pfp4SectionLabel = '⭐ Priorité haute — couvre ' + coveredCount + ' critères manquants'
          } else if (coveredCount === 1) {
            row.pfp4Section = 'medium'
            row.pfp4SectionLabel = '📋 Priorité moyenne — couvre 1 critère manquant'
          } else {
            row.pfp4Section = 'other'
            row.pfp4SectionLabel = '📌 Autres places disponibles'
          }
        })

        const sectionOrder = { high: 0, medium: 1, other: 2 }
        return inputRows.sort((a, b) => {
          const sectionDiff = (sectionOrder[a.pfp4Section] || 2) - (sectionOrder[b.pfp4Section] || 2)
          if (sectionDiff !== 0) return sectionDiff
          const coverageDiff = (b.pfp4CoveredCount || 0) - (a.pfp4CoveredCount || 0)
          if (coverageDiff !== 0) return coverageDiff
          return (a.NomPlace || '').localeCompare(b.NomPlace || '')
        })
      }

      // Pour PFP4: filtrer selon les propositions personnalisées
      const bypassSavedProposals = (this.completedPlaceIds || []).length < 2 && (this.pfp4MissingCriteria || []).includes('DE')
      if (!bypassSavedProposals && this.targetPFP === 'PFP4' && this.pfp4ProposedPlaceIds && Array.isArray(this.pfp4ProposedPlaceIds)) {
        const allowedIds = new Set(this.pfp4ProposedPlaceIds.map(id => this.normalizePlaceId(id)).filter(Boolean))
        const filtered = rows.filter(r => allowedIds.has(this.resolvePlaceId(r)) && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))
        this.expandedPFPData = applyMissingCriteriaSections(filtered)
        debugVotation(`🎯 PFP4: ${this.expandedPFPData.length}/${rows.length} places après filtrage propositions`)
      } else if (!bypassSavedProposals && this.targetPFP === 'PFP3' && this.pfp4ProposedPlaceIds && Array.isArray(this.pfp4ProposedPlaceIds)) {
        const allowedIds = new Set(this.pfp4ProposedPlaceIds.map(id => this.normalizePlaceId(id)).filter(Boolean))
        const filtered = rows.filter(r => allowedIds.has(this.resolvePlaceId(r)) && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))
        this.expandedPFPData = applyMissingCriteriaSections(filtered)
        debugVotation(`🎯 PFP3: ${this.expandedPFPData.length}/${rows.length} places après filtrage propositions`)
      } else if (this.targetPFP === 'PFP3' && this.pfp4MissingCriteria.length > 0) {
        const missing = this.getPriorityMissingCriteria()
        const missingDE = (this.completedPlaceIds || []).length >= 2 && missing.includes('DE')
        const MIN_PLACES = 5
        const countCovered = row => missing.filter(c => CRITERIA_KEYS.includes(c) && row[c]).length

        let proposedRows = []
        if (missingDE) {
          proposedRows = rows.filter(r => r.DE && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))
        } else {
          proposedRows = rows.filter(r => countCovered(r) > 0 && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))

          if (proposedRows.length < MIN_PLACES) {
            const currentKeys = new Set(proposedRows.map(r => r.uniqueKey))
            const sysintRows = rows.filter(r => !currentKeys.has(r.uniqueKey) && r.SYSINT && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))
            proposedRows.push(...sysintRows)
          }

          if (proposedRows.length < MIN_PLACES) {
            const currentKeys = new Set(proposedRows.map(r => r.uniqueKey))
            const rest = rows.filter(r => !currentKeys.has(r.uniqueKey) && !this.completedPlaceIdSet.has(this.resolvePlaceId(r)))
            const needed = MIN_PLACES - proposedRows.length
            proposedRows.push(...rest.slice(0, needed))
          }
        }

        this.expandedPFPData = applyMissingCriteriaSections(proposedRows)
        debugVotation(`🎯 PFP3: ${this.expandedPFPData.length}/${rows.length} places proposées (fallback critères)`)
      } else {
        this.expandedPFPData = rows.filter(r => !this.completedPlaceIdSet.has(this.resolvePlaceId(r)));
      }

      if ((this.targetPFP === 'PFP4' || this.targetPFP === 'PFP3') && this.pfp4MissingCriteria.length > 0) {
        const high = this.expandedPFPData.filter(r => r.pfp4Section === 'high').length
        const med = this.expandedPFPData.filter(r => r.pfp4Section === 'medium').length
        const other = this.expandedPFPData.filter(r => r.pfp4Section === 'other').length
        debugVotation(`🎯 ${this.targetPFP} sections: ⭐${high} haute, 📋${med} moyenne, 📌${other} autres`)
      }
    },

    pfp4RowClass(data) {
      if (this.targetPFP !== 'PFP4' || !data.pfp4Section) return ''
      if (data.pfp4Section === 'high') return 'pfp4-row-high'
      if (data.pfp4Section === 'medium') return 'pfp4-row-medium'
      return ''
    },

    isMissingCriteria(criteriaName) {
      return this.pfp4MissingCriteria && this.pfp4MissingCriteria.includes(criteriaName)
    },

    getVoteCount(place) {
      const placeId = place.PlaceId;

      if (this.votesAggregation[placeId]) {
        return this.votesAggregation[placeId];
      }

      return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 };
    },

    isPlaceDisabled(place, choiceIndex) {
      const normalize = v => (v || '').toString().trim().toLowerCase();
      for (let i = 0; i < this.selectedPlaces.length; i++) {
        if (i !== choiceIndex && this.selectedPlaces[i]) {
          const s = this.selectedPlaces[i];
          const samePlaceId = s.PlaceId && place.PlaceId && s.PlaceId === place.PlaceId;
          const sameInstAndName = s.InstitutionId === place.InstitutionId && normalize(s.NomPlace) === normalize(place.NomPlace);
          if (samePlaceId || sameInstAndName) {
            return true;
          }
        }
      }
      return false;
    },

    async sendVote() {
      if (this.isSubmitting) return;

      if (!this.userStore.user) {
        this.dialogMessage = "Vous devez être connecté pour voter.";
        this.dialogVisible = true;
        return;
      }

      this.isSubmitting = true;

      const choices = this.selectedPlaces.map((p, index) => {
        if (!p) return null;
        return {
          rank: index + 1,
          placeId: p.PlaceId,
          seatIndex: p.seatIndex,
          placeName: p.NomPlace,
          InstitutionName: p.InstitutionName
        };
      }).filter(c => c !== null);

      if (choices.length !== 5) {
        this.dialogMessage = "Veuillez sélectionner exactement 5 places par ordre de préférence avant de voter.";
        this.dialogVisible = true;
        this.isSubmitting = false;
        return;
      }

      try {
        await this.votesStore.saveVote(this.targetPFP, this.selectedYear, choices);

        this.votedPlaces = this.selectedPlaces.map(p => p ? ({
          placeName: p.NomPlace,
          InstitutionName: p.InstitutionName
        }) : null);

        await this.loadVoteStatistics();

        this.dialogMessage = this.voteAlreadyCast 
          ? "Votre vote a été mis à jour avec succès !" 
          : "Votre vote a été enregistré avec succès !";
        this.dialogVisible = true;
      } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du vote:', error);
        this.dialogMessage = "Erreur lors de l'enregistrement du vote: " + (error.message || 'Erreur inconnue');
        this.dialogVisible = true;
      } finally {
        this.isSubmitting = false;
      }
    },

    closeDialog() {
      this.dialogVisible = false;
    },

    removeChoice(index) {
      this.selectedPlaces[index] = null
      this.$forceUpdate()
    },

    onRadioClick(place, choiceIndex, event) {
      try {
        const current = this.selectedPlaces[choiceIndex]
        if (
          current &&
          ((current.PlaceId && place.PlaceId && current.PlaceId === place.PlaceId && current.seatIndex === place.seatIndex) ||
            (current.InstitutionId === place.InstitutionId &&
              (current.NomPlace || '').toString().trim().toLowerCase() === (place.NomPlace || '').toString().trim().toLowerCase()))
        ) {
          this.selectedPlaces[choiceIndex] = null
          if (event && typeof event.preventDefault === 'function') event.preventDefault()
          if (event && typeof event.stopPropagation === 'function') event.stopPropagation()
          this.$forceUpdate()
        }
      } catch (e) {
        // no-op
      }
    }
  },
  watch: {
    '$route.fullPath'() {
      this.refreshSessionAndData()
    },
    'userStore.user.id'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.user_id'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.classe'() {
      this.refreshSessionAndData()
    },
    'userStore.profile.Classe'() {
      this.refreshSessionAndData()
    }
  },
  async mounted() {
    await this.refreshSessionAndData()
  }
}
</script>

<style scoped>
.votation-container {
  min-height: 100vh;
  padding: 0;
}

/* En-tête moderne */
.votation-header {
  border-bottom: 2px solid rgba(99, 102, 241, 0.3);
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  font-size: 3rem;
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
  padding: 1rem;
  border-radius: 12px;
}

.header-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.header-subtitle {
  margin: 0.25rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.back-button {
  border-color: var(--surface-border);
  color: var(--text-color-secondary);
}

.back-button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
}

/* Contenu */
.content-wrapper {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

/* Tableau moderne */
.modern-votation-table {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.modern-votation-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
}

.modern-votation-table :deep(.p-datatable-tbody > tr) {
  background: var(--surface-card);
  transition: all 0.2s ease;
}

.modern-votation-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-hover) !important;
  transform: translateY(-1px);
}

.modern-votation-table :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
  color: var(--text-color);
  padding: 0.85rem 0.75rem;
}

/* Styles pour les liens et contenus */
.institution-link {
  color: var(--primary-color);
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: color 0.2s;
}

.institution-link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.place-name {
  font-weight: 500;
  color: var(--text-color);
}

.criteria-tags,
.language-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Radio buttons */
.radio-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.modern-votation-table :deep(.p-radiobutton) {
  width: 1.5rem;
  height: 1.5rem;
}

.modern-votation-table :deep(.p-radiobutton .p-radiobutton-box) {
  border-width: 2px;
  width: 1.5rem;
  height: 1.5rem;
}

/* État vide */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
  max-width: 600px;
  margin: 2rem auto;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--text-color);
  margin: 1rem 0 0.5rem 0;
}

/* Section récapitulatif */
.recap-section {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.recap-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-bottom: none;
}

.recap-header i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.recap-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.25rem;
  font-weight: 600;
}

.recap-table {
  background: var(--surface-card);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.recap-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  border-color: var(--surface-border);
  font-weight: 600;
  padding: 0.75rem;
}

.recap-table :deep(.p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
  color: var(--text-color);
  padding: 1rem 0.75rem;
}

.recap-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-hover) !important;
}

.recap-institution {
  display: flex;
  align-items: center;
  color: var(--primary-color);
  font-weight: 500;
}

.recap-place-name {
  color: var(--text-color);
  font-size: 1.05rem;
}

/* Section de vote */
.vote-action-section {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.vote-submit {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.vote-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
  background: rgba(99, 102, 241, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.vote-info i {
  color: var(--primary-color);
  font-size: 1.25rem;
}

.vote-info-updated {
  background: rgba(234, 179, 8, 0.1);
  border-color: rgba(234, 179, 8, 0.3);
}

.vote-info-updated i {
  color: var(--yellow-500);
}

/* Dialog moderne */
.modern-dialog :deep(.p-dialog-header) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dialog-message {
  font-size: 1.05rem;
  color: var(--text-color-secondary);
  line-height: 1.6;
  margin: 1.5rem 0;
}

/* PFP4 - Bandeau critères manquants */
.pfp4-missing-banner {
  margin-top: 1rem;
}

.pfp4-missing-card {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 179, 8, 0.08));
  border: 2px solid rgba(249, 115, 22, 0.3);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}

/* PFP4 - Sections */
.pfp4-section {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.pfp4-section-header {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pfp4-section-header-high {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

.pfp4-section-header-medium {
  background: linear-gradient(135deg, #d97706, #f59e0b);
  color: white;
}

.pfp4-section-header-other {
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  color: white;
}

/* PFP4 - Badges critères couverts */
.pfp4-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  min-width: 60px;
}

.pfp4-badge-high {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
  border: 2px solid rgba(16, 185, 129, 0.4);
}

.pfp4-badge-medium {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
  border: 2px solid rgba(245, 158, 11, 0.4);
}

/* PFP4 - Colorisation subtile des tables */
.pfp4-table-high :deep(.p-datatable-tbody > tr) {
  background: rgba(16, 185, 129, 0.03);
}

.pfp4-table-high :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(16, 185, 129, 0.1) !important;
}

.pfp4-table-medium :deep(.p-datatable-tbody > tr) {
  background: rgba(245, 158, 11, 0.03);
}

.pfp4-table-medium :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(245, 158, 11, 0.1) !important;
}

.pfp4-table-other :deep(.p-datatable-tbody > tr) {
  opacity: 0.85;
}

.pfp4-table-other :deep(.p-datatable-tbody > tr:hover) {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .votation-header {
    padding: 1.5rem 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
  }

  .content-wrapper,
  .vote-action-section {
    padding: 0 1rem;
  }

  .header-title {
    font-size: 1.5rem;
  }
}
</style>

