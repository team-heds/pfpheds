<template>
  <AdminLayout :noSidebar="true">
    <template #header>
      <div class="page-title p-d-flex p-jc-between">
        <h1>Votation PFP1A -  {{ selectedYear }}</h1>
      </div>
    </template>

    <div class="container">
      <Button label="Retour Profil" icon="pi pi-arrow-left"
              class="p-button-outlined m-2 align-content-end justify-content-end" @click="goBackToProfile" />

      <!-- Affichage des places disponibles -->
      <div v-if="availablePlaces.length > 0">
        <h2>Toutes les places disponibles ( {{ availablePlaces.length }} places )</h2>
        <DataTable :value="availablePlaces" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
          <!-- Colonne Institution avec lien -->
          <Column header="Institution" sortable field="InstitutionName">
            <template #body="slotProps">
              <a target="_blank" :href="`${slotProps.data.url}`">
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </a>
            </template>
          </Column>

          <!-- Autres colonnes d'informations -->
          <Column header="Nom de la Place" sortable field="NomPlace">
            <template #body="slotProps">
              <span>{{ slotProps.data.NomPlace }}</span>
            </template>
          </Column>

          <Column header="Catégorie " sortable field="InstitutionCategory">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionCategory }}</span>
            </template>
          </Column>
          <Column header="MSQ">
            <template #body="slotProps">
              <span>{{ slotProps.data.MSQ ? 'MSQ' : '-' }}</span>
            </template>
          </Column>
          <Column header="SYSINT">
            <template #body="slotProps">
              <span>{{ slotProps.data.SYSINT ? 'SYSINT' : '-' }}</span>
            </template>
          </Column>
          <Column header="NEUROGER">
            <template #body="slotProps">
              <span>{{ slotProps.data.NEUROGER ? 'NEUROGER' : '-' }}</span>
            </template>
          </Column>
          <Column header="AIGU">
            <template #body="slotProps">
              <span>{{ slotProps.data.AIGU ? 'AIGU' : '-' }}</span>
            </template>
          </Column>
          <Column header="REHAB">
            <template #body="slotProps">
              <span>{{ slotProps.data.REHAB ? 'REHAB' : '-' }}</span>
            </template>
          </Column>
          <Column header="AMBU">
            <template #body="slotProps">
              <span>{{ slotProps.data.AMBU ? 'AMBU' : '-' }}</span>
            </template>
          </Column>
          <Column header="FR">
            <template #body="slotProps">
              <span>{{ slotProps.data.FR ? 'FR' : '-' }}</span>
            </template>
          </Column>
          <Column header="DE">
            <template #body="slotProps">
              <span>{{ slotProps.data.DE ? 'DE' : '-' }}</span>
            </template>
          </Column>

          <!-- Colonnes de vote (Choix 1 à 5) -->
          <Column header="Choix 1">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[0]" :value="slotProps.data"
                           :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 0)" />
            </template>
          </Column>
          <Column header="Choix 2">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[1]" :value="slotProps.data"
                           :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 1)" />
            </template>
          </Column>
          <Column header="Choix 3">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[2]" :value="slotProps.data"
                           :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 2)" />
            </template>
          </Column>
          <Column header="Choix 4">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[3]" :value="slotProps.data"
                           :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 3)" />
            </template>
          </Column>
          <Column header="Choix 5">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[4]" :value="slotProps.data"
                           :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 4)" />
            </template>
          </Column>

          <!-- Colonnes d'agrégation des votes -->
          <Column header="Votes Top 1">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top1 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 2">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top2 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 3">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top3 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 4">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top4 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 5">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top5 || 0 }}</span>
            </template>
          </Column>
          <Column header="Total Votes">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).total || 0 }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else class="p-4 text-center">
        <p>Aucune place disponible pour les critères sélectionnés ({{ targetPFP }} - {{ selectedYear }}).</p>
      </div>

      <!-- Action de vote -->
      <div class="vote-action" v-if="availablePlaces.length > 0">
        <Button v-if="!voteAlreadyCast" @click="sendVote">Envoyer</Button>
        <div v-else>
          <p>Votre vote :</p>
          <ul>
            <li v-for="(vote, index) in votedPlaces" :key="index">
              Choix {{ index + 1 }} : {{ vote.placeName }} ({{ vote.InstitutionName }})
            </li>
          </ul>
          <Button @click="revote">Revoter</Button>
        </div>
      </div>

    </div>

    <!-- Dialogue de confirmation -->
    <Dialog v-model:visible="dialogVisible" header="Confirmation de Vote" :modal="true" :closable="false"
            class="custom-dialog">
      <p>{{ dialogMessage }}</p>
      <template #footer>
        <button class="p-button p-component" @click="closeDialog">OK</button>
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
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { useUserStore } from '@/stores/userStore'
import { useVotesStore } from '@/stores/votesStore'
import { mapStores } from 'pinia'
import votesBackendService from '@/stores/votesBackendService'

export default {
  name: 'VotationView',
  components: {
    DataTable,
    Column,
    RadioButton,
    Dialog,
    Button,
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
      selectedYear: '2026',
      targetPFP: 'PFP1A',
      isSubmitting: false
    };
  },
  computed: {
    ...mapStores(usePlacesStore, useInstitutionsStore, useUserStore, useVotesStore),
    
    availablePlaces() {
      return this.expandedPFPData;
    },
    voteAlreadyCast() {
      return this.votedPlaces[0] !== null;
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
    
    async fetchData() {
      // Charger les données depuis Supabase via les stores
      await this.institutionsStore.fetchInstitutions();
      await this.placesStore.fetchPlaces();
      
      // Charger les statistiques de votes
      await this.loadVoteStatistics();
      
      // Vérifier si l'utilisateur a déjà voté
      await this.checkExistingVote();
      
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
          // Conversion des booléens si nécessaire (Supabase retourne déjà true/false normalement)
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
    },

    async loadVoteStatistics() {
      try {
        // Récupérer l'agrégation des votes pour ce PFP et cette année
        const aggregation = await votesBackendService.getVotePlaceAggregation(this.targetPFP, this.selectedYear);
        
        console.log('📊 Statistiques de votes chargées:', aggregation);
        
        // Transformer en objet pour accès rapide
        // Structure: votesAggregation[placeId] = { rank1: count, rank2: count, ... }
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
          
          // Ajouter le compteur pour ce rang
          this.votesAggregation[placeId][`top${rank}`] = count;
          this.votesAggregation[placeId].total += count;
        });
        
        console.log('✅ Votes agrégés:', this.votesAggregation);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des statistiques:', error);
        this.votesAggregation = {};
      }
    },

    async checkExistingVote() {
      if (!this.userStore.user) return;

      try {
        const existingVote = await this.votesStore.fetchVote(this.targetPFP, this.selectedYear);
        
        console.log('🔍 Vote existant récupéré:', existingVote);

        if (existingVote && existingVote.choices) {
          console.log('📋 Choices du vote:', existingVote.choices);
          
          // Restaurer le vote
          this.votedPlaces = [null, null, null, null, null];
          
          if (Array.isArray(existingVote.choices)) {
            this.votedPlaces = existingVote.choices.map(c => ({
              placeName: c.placeName || 'Inconnu',
              InstitutionName: c.InstitutionName || 'Inconnu'
            }));
            
            // Remplir jusqu'à 5 si nécessaire
            while(this.votedPlaces.length < 5) {
              this.votedPlaces.push(null);
            }
            
            console.log('✅ Vote restauré dans l\'UI:', this.votedPlaces);
          }
        } else {
          console.log('ℹ️ Aucun vote existant trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du vote:', error);
      }
    },

    updateExpandedData() {
      const rows = [];
      // Trier par nom
      const sorted = this.places.slice().sort((a, b) =>
        (a.NomPlace || '').localeCompare(b.NomPlace || '')
      );

      sorted.forEach(place => {
        // Logique spécifique PFP1A 2026
        // Structure attendue: place.PFP1A = { "2026": "2", "2027": "0" }
        let count = 0;
        if (place[this.targetPFP] && place[this.targetPFP][this.selectedYear]) {
          count = parseInt(place[this.targetPFP][this.selectedYear]);
        }
        
        if (!isNaN(count) && count >= 1) {
          for (let i = 1; i <= count; i++) {
            rows.push({
              ...place,
              seatIndex: i,
              // On peut ajouter une clé unique pour le v-for/key si nécessaire
              uniqueKey: `${place.PlaceId}-${i}`
            });
          }
        }
      });
      this.expandedPFPData = rows;
    },

    getVoteCount(place) {
      // Récupérer les stats pour cette place depuis l'agrégation
      const placeId = place.PlaceId;
      
      if (this.votesAggregation[placeId]) {
        return this.votesAggregation[placeId];
      }
      
      // Valeurs par défaut si aucun vote
      return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 };
    },

    getNewValidatedCriteria() {
      // Placeholder car nous n'avons pas encore le profil étudiant Supabase connecté
      return [];
    },

    isPlaceDisabled(place, choiceIndex) {
      // Empêcher de sélectionner plusieurs sièges de la même place (même PlaceId)
      for (let i = 0; i < this.selectedPlaces.length; i++) {
        if (i !== choiceIndex && this.selectedPlaces[i]) {
          // Comparer les PlaceId pour bloquer tous les sièges de la même place
          if (this.selectedPlaces[i].PlaceId === place.PlaceId) {
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

      if (choices.length === 0) {
        this.dialogMessage = "Veuillez sélectionner au moins une place.";
        this.dialogVisible = true;
        this.isSubmitting = false;
        return;
      }

      try {
        // Utiliser le store pour enregistrer le vote
        await this.votesStore.saveVote(this.targetPFP, this.selectedYear, choices);

        // Mettre à jour l'affichage
        this.votedPlaces = this.selectedPlaces.map(p => p ? ({
          placeName: p.NomPlace,
          InstitutionName: p.InstitutionName
        }) : null);
        
        this.dialogMessage = "Votre vote a été enregistré avec succès !";
        this.dialogVisible = true;
      } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement du vote:', error);
        this.dialogMessage = "Erreur lors de l'enregistrement du vote: " + (error.message || 'Erreur inconnue');
        this.dialogVisible = true;
      } finally {
        this.isSubmitting = false;
      }
    },

    async revote() {
      if (!confirm("Êtes-vous sûr de vouloir modifier votre vote ?")) return;
      
      console.log('🔄 Révocation du vote...');
      
      // Réinitialiser complètement l'état
      this.votedPlaces = [null, null, null, null, null];
      this.selectedPlaces = [null, null, null, null, null];
      
      // Réinitialiser le vote dans le store
      this.votesStore.currentVote = null;
      
      // Forcer la mise à jour de l'UI
      this.$forceUpdate();
      
      console.log('✅ État réinitialisé, prêt à revoter');
    },
    
    closeDialog() {
      this.dialogVisible = false;
    }
  },
  async mounted() {
    await this.fetchData();
  }
}
</script>

<style scoped>
.page-title h1 {
  margin: 0;
  font-size: 2rem;
}

.container {
  padding: 1rem;
}

.custom-datatable {
  margin-top: 1rem;
}

.vote-action {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.vote-action ul {
  list-style-type: none;
  padding: 0;
}

.vote-action li {
  margin-bottom: 0.5rem;
}
</style>
