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
        <Button label="Retour" icon="pi pi-arrow-left" outlined @click="goBackToProfile" />
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
          <Button label="Retour" icon="pi pi-arrow-left" outlined @click="goBackToProfile" class="back-button" />
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
          <div class="text-600 mt-2 text-sm"><i class="pi pi-arrow-down mr-1"></i> Les places ci-dessous sont triées par pertinence. <strong>Privilégiez en priorité les places qui couvrent le plus grand nombre de vos critères manquants</strong> afin de maximiser vos chances de valider votre diplôme.</div>
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
              <Button
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
          <Button
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
    <Dialog
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
        <Button label="OK" icon="pi pi-check" @click="closeDialog" autofocus />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import RadioButton from 'primevue/radiobutton';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { useUserStore } from '@/stores/userStore'
import { useVotesStore } from '@/stores/votesStore'
import { mapStores } from 'pinia'
import votesBackendService from '@/stores/votesBackendService'
import votationSessionService from '@/service/votationSessionService'
import resultatVotationService from '@/stores/resultatVotationService'

export default {
  name: 'VotationGenericView',
  components: {
    DataTable,
    Column,
    RadioButton,
    Dialog,
    Button,
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
      pfp4ProposedPlaceIds: null,
      pfp4AssignCountByPlace: {},
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
    hasPfp4Sections() {
      return this.targetPFP === 'PFP4' && this.pfp4MissingCriteria && this.pfp4MissingCriteria.length > 0
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

    async loadSession() {
      this.sessionLoading = true
      try {
        // Lire le pfpType depuis le paramètre de route
        const routePfpType = this.$route.params.pfpType
        const currentUserId = this.userStore.user?.id || null

        // Helper: filtre les sessions prioritaires pour l'étudiant courant
        const filterSessionForUser = (sessions) => {
          if (!sessions || sessions.length === 0) return null
          for (const session of sessions) {
            if (session.is_priority) {
              // Session prioritaire : seuls les étudiants dans priority_user_ids y ont accès
              const allowedIds = session.priority_user_ids || []
              if (currentUserId && Array.isArray(allowedIds) && allowedIds.includes(currentUserId)) {
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
        console.log('🔍 Sessions ouvertes:', allSessions.length, allSessions.map(s => ({
          pfp_type: s.pfp_type, is_priority: s.is_priority,
          priority_user_ids: s.priority_user_ids?.length || 0
        })))
        console.log('🔍 currentUserId:', currentUserId)

        if (routePfpType) {
          // Route générique /votation/:pfpType — chercher la session pour ce PFP
          const matching = allSessions.filter(s => s.pfp_type === routePfpType.toUpperCase())
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
            console.log(`🔍 Recherche session pour ${pfpHint}:`, matching.length, 'trouvée(s)')
            this.activeSession = filterSessionForUser(matching)
          }

          // Fallback : si aucune session trouvée, chercher si l'étudiant est dans une session prioritaire (tout PFP confondu)
          if (!this.activeSession && currentUserId) {
            console.log('🔍 Fallback: recherche session prioritaire pour cet étudiant...')
            const prioritySession = allSessions.find(s =>
              s.is_priority &&
              Array.isArray(s.priority_user_ids) &&
              s.priority_user_ids.includes(currentUserId)
            )
            if (prioritySession) {
              console.log(`✅ Session prioritaire trouvée via fallback: ${prioritySession.pfp_type}`)
              this.activeSession = prioritySession
            }
          }

          // Fallback 2 : chercher par classe
          if (!this.activeSession) {
            const profile = this.userStore.profile
            const studentClass = profile?.Classe || profile?.classe || profile?.class || profile?.Class || null
            if (studentClass) {
              const classSessions = allSessions.filter(s => s.target_class === studentClass)
              this.activeSession = filterSessionForUser(classSessions)
            }
          }
        }

        if (this.activeSession) {
          this.targetPFP = this.activeSession.pfp_type
          this.selectedYear = this.activeSession.year
          console.log(`✅ Session active trouvée: ${this.targetPFP} ${this.selectedYear}${this.activeSession.is_priority ? ' (prioritaire)' : ''}`)
        } else {
          console.warn('⚠️ Aucune session de votation active trouvée')
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

      // Pour PFP4: charger les propositions personnalisées et les assignations existantes
      if (this.targetPFP === 'PFP4' && this.selectedYear) {
        try {
          const result = await resultatVotationService.getPfp4Proposals(this.selectedYear)
          this.pfp4ProposedPlaceIds = result.proposedPlaceIds
          this.pfp4AssignCountByPlace = result.assignCounts || {}
          this.pfp4MissingCriteria = result.missingCriteria || []
          this.pfp4AppliedRule = result.appliedRule || null
          console.log('🎯 PFP4 propositions chargées:', result.proposedPlaceIds ? result.proposedPlaceIds.length + ' places' : 'aucune (toutes visibles)')
          console.log('🎯 PFP4 critères manquants:', this.pfp4MissingCriteria, 'règle:', this.pfp4AppliedRule)
          const totalSeats = Object.values(this.pfp4AssignCountByPlace).reduce((s,v) => s+v, 0)
          console.log(`🎯 PFP4 assignations existantes: ${Object.keys(this.pfp4AssignCountByPlace).length} places, ${totalSeats} sièges pris`)
        } catch (err) {
          console.warn('⚠️ Impossible de charger les propositions PFP4:', err.message)
          this.pfp4ProposedPlaceIds = null
          this.pfp4AssignCountByPlace = {}
        }
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
        // Pour PFP4: utiliser pfp4_proposition (colonne "Proposition PFP4" de ManagementOffreView)
        const pfpField = this.targetPFP === 'PFP4' ? 'pfp4_proposition' : this.targetPFP;
        if (place[pfpField]) {
          const fieldData = place[pfpField];
          const yr = String(this.selectedYear);
          // Si la clé year existe explicitement, l'utiliser (même si "0")
          // Ne fallback sur default QUE si la clé year n'existe pas du tout
          if (fieldData.hasOwnProperty(yr) && fieldData[yr] !== '' && fieldData[yr] !== null && fieldData[yr] !== undefined) {
            count = parseInt(fieldData[yr]) || 0;
          } else {
            const defVal = parseInt(fieldData['default'] || '0');
            count = !isNaN(defVal) ? defVal : 0;
          }
        }
        // Pour PFP4: soustraire les sièges déjà assignés
        if (this.targetPFP === 'PFP4' && this.pfp4AssignCountByPlace[place.PlaceId]) {
          count -= this.pfp4AssignCountByPlace[place.PlaceId];
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
      // Pour PFP4: filtrer selon les propositions personnalisées
      if (this.targetPFP === 'PFP4' && this.pfp4ProposedPlaceIds && Array.isArray(this.pfp4ProposedPlaceIds)) {
        const allowedIds = new Set(this.pfp4ProposedPlaceIds)
        let filtered = rows.filter(r => allowedIds.has(r.PlaceId))

        // Ajouter les sections de priorité basées sur les critères manquants
        const missing = this.pfp4MissingCriteria || []
        if (missing.length > 0) {
          filtered.forEach(row => {
            const CRIT_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']
            const coveredCount = missing.filter(c => CRIT_KEYS.includes(c) && row[c]).length
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
          // Trier : high en premier, puis medium, puis other, et dans chaque section par coveredCount desc puis nom
          const sectionOrder = { high: 0, medium: 1, other: 2 }
          filtered.sort((a, b) => {
            const sDiff = (sectionOrder[a.pfp4Section] || 2) - (sectionOrder[b.pfp4Section] || 2)
            if (sDiff !== 0) return sDiff
            const cDiff = (b.pfp4CoveredCount || 0) - (a.pfp4CoveredCount || 0)
            if (cDiff !== 0) return cDiff
            return (a.NomPlace || '').localeCompare(b.NomPlace || '')
          })
        }

        this.expandedPFPData = filtered
        console.log(`🎯 PFP4: ${this.expandedPFPData.length}/${rows.length} places après filtrage propositions`)
        if (missing.length > 0) {
          const high = filtered.filter(r => r.pfp4Section === 'high').length
          const med = filtered.filter(r => r.pfp4Section === 'medium').length
          const other = filtered.filter(r => r.pfp4Section === 'other').length
          console.log(`🎯 PFP4 sections: ⭐${high} haute, 📋${med} moyenne, 📌${other} autres`)
        }
      } else {
        this.expandedPFPData = rows;
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
  async mounted() {
    await this.loadSession()
    if (this.activeSession) {
      await this.fetchData()
    }
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
