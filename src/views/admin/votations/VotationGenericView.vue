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

      <!-- Affichage des places disponibles -->
      <div v-if="availablePlaces.length > 0" class="content-wrapper">
        <DataTable
          :value="availablePlaces"
          class="modern-votation-table"
          responsiveLayout="scroll"
          :scrollable="true"
          scrollHeight="65vh"
          :rowHover="true"
          stripedRows
        >
          <!-- Colonne Institution avec lien -->
          <Column header="Institution" sortable field="InstitutionName" :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <a target="_blank" :href="`${slotProps.data.url}`" class="institution-link">
                <i class="pi pi-building mr-2"></i>
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </a>
            </template>
          </Column>

          <!-- Autres colonnes d'informations -->
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

          <!-- Colonnes de vote (Choix 1 à 5) -->
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

          <!-- Colonnes d'agrégation des votes -->
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
      sessionLoading: true
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

        if (routePfpType) {
          // Route générique /votation/:pfpType — chercher la session pour ce PFP
          const sessions = await votationSessionService.getAllActiveSessions()
          const matching = sessions.filter(s => s.pfp_type === routePfpType.toUpperCase())
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
            const sessions = await votationSessionService.getAllActiveSessions()
            const matching = sessions.filter(s => s.pfp_type === pfpHint)
            this.activeSession = filterSessionForUser(matching)
          } else {
            // Fallback : chercher n'importe quelle session ouverte pour la classe de l'étudiant
            const profile = this.userStore.profile
            const studentClass = profile?.Classe || profile?.classe || profile?.class || profile?.Class || null
            if (studentClass) {
              const sessions = await votationSessionService.getOpenSessionForClass(studentClass)
              this.activeSession = filterSessionForUser(sessions)
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
        if (place[this.targetPFP] && place[this.targetPFP][this.selectedYear]) {
          count = parseInt(place[this.targetPFP][this.selectedYear]);
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
      this.expandedPFPData = rows;
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
