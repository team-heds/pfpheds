<template>
  <AdminLayout>
    <Toast />
    <div class="filter-menu">
      <DataTable
        :value="filteredEtudiants"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
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
        <template #empty> Aucun étudiant trouvé. </template>
        <template #loading> Chargement des données des étudiants. Veuillez patienter. </template>

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

export default {
  name: "EtudiantList",
  components: {
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
      classeOptions: ['BA22', 'BA23', 'BA24', 'BA25', 'Non défini']
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
        this.etudiants = await studentsService.getAllStudents();
        
        console.log(`✅ ${this.etudiants.length} étudiants chargés depuis Supabase`);
        
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
</style>
