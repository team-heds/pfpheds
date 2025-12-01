<template>
  <AdminLayout>
    <Toast />
    <div class="filter-menu">
      <DataTable
        v-else
        :value="filteredEtudiants"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :globalFilterFields="['Nom', 'Prenom', 'Classe', 'Mail']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un étudiant" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="goToEtudiantForm" />
            <span class="p-input-icon-left">
              <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
            </span>
          </div>
        </template>
        <template #empty>
          <EmptyState
            title="Aucun étudiant trouvé"
            description="Ajustez les filtres ou ajoutez un étudiant."
            icon="pi-users"
            actionLabel="Ajouter un étudiant"
            @action="goToEtudiantForm"
          />
        </template>
 
        <!-- Colonne pour le nom -->
        <Column field="Nom" header="Nom" style="min-width: 12rem" class="text-center" />
 
        <!-- Colonne pour le prénom -->
        <Column field="Prenom" header="Prénom" style="min-width: 12rem" class="text-center" />
 
        <!-- Colonne pour la classe -->
        <Column field="Classe" header="Classe" style="min-width: 8rem" class="text-center">
          <template #filter="{ filterModel }">
            <Dropdown :options="classeOptions" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par classe" />
          </template>
        </Column>
 
        <!-- Colonne pour l'email -->
        <Column field="Mail" header="Email" style="min-width: 16rem" class="text-center" />
 
        <!-- Colonne pour indiquer si l'étudiant est un SAE -->
        <Column field="SAE" header="SAE" style="min-width: 8rem" class="text-center">
          <template #body="{ data }">
            <input type="checkbox" :checked="data.SAE" disabled />
          </template>
        </Column>

        <!-- Colonne affichage cohorte PFP (Badge visible) -->
        <Column field="pfp_cohort" header="Cohorte" style="min-width: 10rem" class="text-center">
          <template #body="{ data }">
            <span 
              v-if="data.pfp_cohort" 
              :class="['pfp-badge-large', `pfp-badge-${data.pfp_cohort.toLowerCase()}`]"
            >
              {{ data.pfp_cohort }}
            </span>
            <span v-else class="text-gray-400 italic">Aucune</span>
          </template>
        </Column>

        <!-- Colonne édition cohorte PFP (Dropdown) -->
        <Column header="Modifier Cohorte" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Dropdown 
              v-model="data.pfp_cohort" 
              :options="pfpCohortOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner"
              @change="updatePfpCohort(data)"
              :loading="data.updating"
            />
          </template>
        </Column>

        <!-- Colonne des actions -->
        <Column header="Actions" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Profil" class="mb-2 mr-2" size="small" outlined @click="goToEtudiantDetails(data.id)" />
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToEtudiantFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="deleteStudent(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </AdminLayout>
</template>


<script>
import studentsService from '@/service/studentsService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { supabase } from '@/supabase';

export default {
  name: "EtudiantList",
  components: {
    AdminPageHeader,
    AppSkeleton,
    EmptyState,
    AppSpinner,
    DataTable,
    Column,
    InputText,
    Button,
    Dropdown,
    AdminLayout,
    Toast
  },
  data() {
    return {
      etudiants: [],
      filters: {
        'Classe': { value: '', matchMode: 'equals' },
      },
      loading: true,
      globalFilter: '',
      classeOptions: ['BA22', 'BA23', 'BA24', 'BA25', 'Non défini'],
      pfpCohortOptions: [
        { label: 'Aucun', value: null },
        { label: 'PFP1A', value: 'PFP1A' },
        { label: 'PFP1B', value: 'PFP1B' }
      ]
    };
  },
  computed: {
    filteredEtudiants() {
      return this.etudiants.filter(etudiant => {
        const matchesClass = this.filters['Classe'].value ? this.filters['Classe'].value.includes(etudiant.Classe) : true;
        const searchLower = this.globalFilter.toLowerCase();
 
        const matchesSearch =
          (etudiant.Nom ? etudiant.Nom.toLowerCase().includes(searchLower) : false)
          || (etudiant.Prenom ? etudiant.Prenom.toLowerCase().includes(searchLower) : false)
          || (etudiant.Classe ? etudiant.Classe.toLowerCase().includes(searchLower) : false)
          || (etudiant.Mail ? etudiant.Mail.toLowerCase().includes(searchLower) : false);
 
        return matchesClass && matchesSearch;
      });
    }
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  async mounted() {
    await this.fetchEtudiantsFromSupabase();
  },
  methods: {
    /**
     * Récupère TOUS les étudiants depuis Supabase (source unique)
     * Inclut BA22, BA23, BA24, BA25 et futurs
     */
    async fetchEtudiantsFromSupabase() {
      this.loading = true;
      try {
        // Récupérer depuis le service Supabase unifié
        const students = await studentsService.getAllStudents();
        
        // Charger les pfp_cohort depuis user_profiles
        await this.loadPfpCohorts(students);
        
        // Assigner les étudiants APRÈS avoir chargé les cohortes
        this.etudiants = students;
        
        // Forcer la mise à jour du DOM pour que les dropdowns se rafraîchissent
        await this.$nextTick();
        
        console.log(`✅ ${this.etudiants.length} étudiants chargés depuis Supabase`);
        console.log('🔍 Exemple étudiant:', this.etudiants[0]);
        
        // Afficher les stats par classe
        const stats = await studentsService.getClassStats();
        console.log('📊 Répartition par classe:', stats);
        
        this.toast.add({
          severity: 'success',
          summary: 'Étudiants chargés',
          detail: `${this.etudiants.length} étudiants récupérés`,
          life: 3000
        });
      } catch (error) {
        console.error('❌ Erreur fetchEtudiantsFromSupabase:', error);
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les étudiants',
          life: 5000
        });
      } finally {
        this.loading = false;
      }
    },
    
    async deleteStudent(etuId) {
      if (confirm('Êtes-vous sûr de vouloir archiver cet étudiant ?')) {
        try {
          const success = await studentsService.deleteStudent(etuId);
          
          if (success) {
            this.toast.add({
              severity: 'success',
              summary: 'Étudiant archivé',
              detail: 'L\'étudiant a été archivé avec succès',
              life: 3000
            });
            await this.fetchEtudiantsFromSupabase();
          } else {
            throw new Error('Échec de l\'archivage');
          }
        } catch (error) {
          console.error('❌ Erreur deleteStudent:', error);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible d\'archiver l\'étudiant',
            life: 5000
          });
        }
      }
    },
    
    goToEtudiantForm() {
      this.$router.push({ name: 'EtudiantForm' });
    },
    
    goToEtudiantDetails(etuId) {
      this.$router.push({ name: 'Profile', params: { id: etuId } });
    },
    
    goToEtudiantFormModif(etuId) {
      this.$router.push({ name: 'EtudiantFormModif', params: { etuId } });
    },
    
    async loadPfpCohorts(students) {
      try {
        // pfp_cohort est maintenant déjà chargé par studentsService
        // On affiche juste les statistiques et on initialise les flags
        
        let pfp1aCount = 0;
        let pfp1bCount = 0;
        let noCohortCount = 0;
        
        students.forEach(student => {
          // Initialiser le flag pour le loading du dropdown
          student.updating = false;
          
          // Statistiques
          if (student.pfp_cohort === 'PFP1A') pfp1aCount++;
          else if (student.pfp_cohort === 'PFP1B') pfp1bCount++;
          else noCohortCount++;
          
          // Debug: afficher les 3 premiers étudiants avec cohorte
          if ((pfp1aCount + pfp1bCount) <= 3 && student.pfp_cohort) {
            console.log(`🔍 Étudiant avec cohorte:`, {
              nom: student.Nom,
              prenom: student.Prenom,
              pfp_cohort: student.pfp_cohort
            });
          }
        });
        
        console.log('✅ PFP Cohorts chargés:');
        console.log(`   🟣 PFP1A: ${pfp1aCount} étudiants`);
        console.log(`   🌸 PFP1B: ${pfp1bCount} étudiants`);
        console.log(`   ⚪ Sans cohorte: ${noCohortCount} étudiants`);
      } catch (error) {
        console.error('❌ Erreur loadPfpCohorts:', error);
      }
    },
    
    async updatePfpCohort(student) {
      try {
        student.updating = true;
        
        // Avec optionValue, on reçoit directement la string value
        const cohortValue = student.pfp_cohort;
        
        console.log('📝 Mise à jour PFP Cohort:', {
          studentId: student.id,
          newCohort: cohortValue
        });
        
        const { error } = await supabase
          .from('user_profiles')
          .update({ pfp_cohort: cohortValue })
          .eq('user_id', student.id);
        
        if (error) {
          console.error('❌ Erreur Supabase:', error);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de mettre à jour la cohorte PFP',
            life: 5000
          });
        } else {
          console.log('✅ PFP Cohort mis à jour');
          
          this.toast.add({
            severity: 'success',
            summary: 'Mis à jour',
            detail: `Cohorte PFP ${cohortValue || 'supprimée'} pour ${student.Prenom} ${student.Nom}`,
            life: 3000
          });
        }
      } catch (error) {
        console.error('❌ Exception updatePfpCohort:', error);
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: error.message,
          life: 5000
        });
      } finally {
        student.updating = false;
      }
    }
  }
};
</script>
 
<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.filter-menu {
  padding: 20px;
}

/* Badges PFP Cohort */
.pfp-badge,
.pfp-badge-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.pfp-badge {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.pfp-badge-large {
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  min-width: 100px;
}

.pfp-badge-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.pfp-badge-pfp1a {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pfp-badge-pfp1b {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
 