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
          <DataTableToolbar v-model:query="globalFilterInput" :result-count="filteredEtudiants.length">
            <template #primary>
              <Button label="Ajouter un étudiant" icon="pi pi-plus" class="mb-2" outlined @click="showCreateDialog = true" />
            </template>
            <template #tools>
              <Button
                :label="showCohortColumns ? 'Masquer Cohortes' : 'Afficher Cohortes'"
                :icon="showCohortColumns ? 'pi pi-eye-slash' : 'pi pi-eye'"
                class="mb-2"
                outlined
                severity="secondary"
                @click="toggleCohortColumns"
              />
              <Button 
                :label="sortOrder === 'asc' ? 'Tri A-Z' : 'Tri Z-A'" 
                :icon="sortOrder === 'asc' ? 'pi pi-sort-alpha-down' : 'pi pi-sort-alpha-up'" 
                class="mb-2" 
                outlined 
                severity="secondary"
                @click="toggleSortOrder" 
              />
            </template>
          </DataTableToolbar>
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

        <!-- Colonne affichage cohorte PFP (Badge visible) -->
        <Column v-if="showCohortColumns" field="pfp_cohort" header="Cohorte" style="min-width: 10rem" class="text-center">
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
        <Column v-if="showCohortColumns" header="Modifier Cohorte" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <div class="flex align-items-center justify-content-center gap-2">
              <Button
                v-if="!isEditingCohort(data)"
                icon="pi pi-pencil"
                size="small"
                outlined
                @click="startEditCohort(data)"
              />
              <template v-else>
                <Dropdown
                  v-model="cohortEditValue"
                  :options="pfpCohortOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner"
                  :loading="data.updating || savingCohortId === data.id"
                />
                <Button
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  outlined
                  :loading="savingCohortId === data.id"
                  @click="saveEditCohort(data)"
                />
                <Button
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  outlined
                  :disabled="savingCohortId === data.id"
                  @click="cancelEditCohort()"
                />
              </template>
            </div>
          </template>
        </Column>

        <!-- Colonne Répondant HES -->
        <Column field="repondant_hes" header="Répondant HES" style="min-width: 14rem" class="text-center">
          <template #body="{ data }">
            <div class="flex align-items-center justify-content-center gap-2">
              <template v-if="!isEditingRepondant(data)">
                <span v-if="data.repondant_hes" class="text-primary font-medium">{{ data.repondant_hes }}</span>
                <span v-else class="text-gray-400 italic">Non assigné</span>
                <Button
                  icon="pi pi-pencil"
                  size="small"
                  outlined
                  @click="startEditRepondant(data)"
                />
              </template>
              <template v-else>
                <Dropdown
                  v-model="repondantEditValue"
                  :options="repondantsHESList"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner"
                  class="w-full"
                  showClear
                  :loading="savingRepondantId === data.id"
                />
                <Button
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  outlined
                  :loading="savingRepondantId === data.id"
                  @click="saveEditRepondant(data)"
                />
                <Button
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  outlined
                  :disabled="savingRepondantId === data.id"
                  @click="cancelEditRepondant()"
                />
              </template>
            </div>
          </template>
        </Column>

        <!-- Colonne des actions -->
        <Column header="Actions" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Profil" class="mb-2 mr-2" size="small" outlined @click="goToEtudiantDetails(data.id)" />
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="openEditDialog(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="deleteStudent(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog de modification étudiant -->
    <StudentEditDialog
      v-model:visible="showEditDialog"
      :studentId="selectedStudentId"
      @student-updated="onStudentUpdated"
    />

    <!-- Dialog de création étudiant -->
    <StudentCreateDialog
      v-model:visible="showCreateDialog"
      @student-created="onStudentCreated"
    />
  </AdminLayout>
</template>

<script>
import studentsService from '@/service/studentsService';
import { getAllStudents } from '@/service/studentDirectoryService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { supabase } from '@/supabase';
import StudentEditDialog from '@/components/admin/forms/StudentEditDialog.vue';
import StudentCreateDialog from '@/components/admin/forms/StudentCreateDialog.vue';
import { useUserStore } from '@/stores/userStore';
import DataTableToolbar from '@/components/common/tables/DataTableToolbar.vue';

export default {
  name: "EtudiantList",
  components: {
    DataTable,
    Column,
    DataTableToolbar,
    Button,
    AdminLayout,
    Toast,
    StudentEditDialog,
    StudentCreateDialog,
    Dropdown
  },
  data() {
    return {
      etudiants: [],
      filters: {
        'Classe': { value: '', matchMode: 'equals' },
      },
      loading: true,
      globalFilterInput: '',
      globalFilter: '',
      globalFilterDebounceTimer: null,
      sortOrder: 'asc', // 'asc' pour A-Z, 'desc' pour Z-A
      showCohortColumns: false,
      classeOptions: [],
      pfpCohortOptions: [
        { label: 'Aucun', value: null },
        { label: 'PFP1A', value: 'PFP1A' },
        { label: 'PFP1B', value: 'PFP1B' }
      ],
      cohortEditingStudentId: null,
      cohortEditValue: null,
      savingCohortId: null,
      showEditDialog: false,
      selectedStudentId: null,
      showCreateDialog: false,
      repondantsHESList: [],
      repondantEditingStudentId: null,
      repondantEditValue: null,
      savingRepondantId: null,
      currentRepondantProfile: null,
      refreshTimeout: null,
    };
  },
  watch: {
    globalFilterInput(val) {
      if (this.globalFilterDebounceTimer) {
        clearTimeout(this.globalFilterDebounceTimer);
      }
      this.globalFilterDebounceTimer = setTimeout(() => {
        this.globalFilter = val || '';
      }, 300);
    }
  },
  computed: {
    currentRepondantName() {
      return this.currentRepondantProfile ? `${this.currentRepondantProfile.first_name} ${this.currentRepondantProfile.last_name}` : null;
    },
    isAdmin() {
      return this.userStore.profile?.roles?.includes('admin');
    },
    filteredEtudiants() {
      const searchLower = (this.globalFilter || '').toLowerCase();

      const filtered = this.etudiants.filter(etudiant => {
        const matchesClass = this.filters['Classe'].value ? this.filters['Classe'].value === etudiant.Classe : true;

        const haystack = etudiant.__searchKey || '';
        const matchesSearch = !searchLower ? true : haystack.includes(searchLower);

        return matchesClass && matchesSearch;
      });

      // Appliquer le tri alphabétique par nom
      const collator = new Intl.Collator('fr', { sensitivity: 'base' });
      return [...filtered].sort((a, b) => {
        const nameA = a.Nom || '';
        const nameB = b.Nom || '';
        const res = collator.compare(nameA, nameB);
        return this.sortOrder === 'asc' ? res : -res;
      });
    }
  },
  setup() {
    const toast = useToast();
    const userStore = useUserStore();
    return { toast, userStore };
  },
  async mounted() {
    await this.loadCurrentRepondantProfile();
    // Charger en parallèle pour accélérer
    await Promise.all([
      this.loadRepondantsHES(),
      this.fetchEtudiantsFromSupabase()
    ]);
  },
  methods: {
    async loadCurrentRepondantProfile() {
      if (!this.userStore.user?.id) return;
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .select('*')
          .eq('user_id', this.userStore.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        this.currentRepondantProfile = data;
      } catch (e) {
        console.error('Erreur loadCurrentRepondantProfile:', e);
      }
    },
    debug(...args) {
      if (import.meta.env && import.meta.env.DEV) {
        console.log(...args);
      }
    },
    /**
     * Récupère TOUS les étudiants depuis Supabase (source unique)
     * Inclut BA22, BA23, BA24, BA25 et futurs
     */
    toggleCohortColumns() {
      this.showCohortColumns = !this.showCohortColumns;
      // Si on masque pendant une édition, on annule pour éviter un état incohérent
      if (!this.showCohortColumns) {
        this.cancelEditCohort();
      }
    },

    async fetchEtudiantsFromSupabase() {
      this.loading = true;
      const startTime = performance.now();
      
      try {
        const students = await getAllStudents();

        // ⚡ OPTIMISATION: Pré-calcul en une seule passe avec mutation directe
        const len = students.length;
        for (let i = 0; i < len; i++) {
          const s = students[i];
          // Clé de recherche (optimisé: évite filter et map intermédiaires)
          const parts = [];
          if (s.Nom) parts.push(s.Nom);
          if (s.Prenom) parts.push(s.Prenom);
          if (s.Classe) parts.push(s.Classe);
          if (s.Mail) parts.push(s.Mail);
          s.__searchKey = parts.join(' ').toLowerCase();
          // Flag pour loading
          s.updating = false;
          s.repondant_hes = s.repondant_hes || null;
        }
        
        this.etudiants = students;

        // Générer dynamiquement les options de classe depuis les données
        const classSet = new Set();
        for (const s of students) {
          classSet.add(s.Classe || 'Non défini');
        }
        this.classeOptions = [...classSet].sort();
        
        const loadTime = Math.round(performance.now() - startTime);
        this.debug(`✅ ${this.etudiants.length} étudiants chargés en ${loadTime}ms`);
        
        this.toast.add({
          severity: 'success',
          summary: 'Étudiants chargés',
          detail: `${this.etudiants.length} étudiants en ${loadTime}ms`,
          life: 2000
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
    
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      this.debug(`📋 Tri alphabétique: ${this.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`);
    },
    
    goToEtudiantForm() {
      this.$router.push({ name: 'EtudiantForm' });
    },
    
    goToEtudiantDetails(etuId) {
      this.$router.push({ name: 'Profile', params: { id: etuId } });
    },
    
    openEditDialog(studentId) {
      this.selectedStudentId = studentId;
      this.showEditDialog = true;
    },
    
    async onStudentUpdated() {
      // Recharger la liste des étudiants après modification
      await this.fetchEtudiantsFromSupabase();
    },
    
    async onStudentCreated() {
      // Recharger la liste des étudiants après création
      await this.fetchEtudiantsFromSupabase();
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
          // Reset édition cohorte si jamais
          if (student.id === this.cohortEditingStudentId) {
            this.cancelEditCohort();
          }
          
          // Statistiques
          if (student.pfp_cohort === 'PFP1A') pfp1aCount++;
          else if (student.pfp_cohort === 'PFP1B') pfp1bCount++;
          else noCohortCount++;
          
          // Debug: afficher les 3 premiers étudiants avec cohorte
          if ((pfp1aCount + pfp1bCount) <= 3 && student.pfp_cohort) {
            this.debug(`🔍 Étudiant avec cohorte:`, {
              nom: student.Nom,
              prenom: student.Prenom,
              pfp_cohort: student.pfp_cohort
            });
          }
        });

        this.debug('✅ PFP Cohorts chargés:');
        this.debug(`   🟣 PFP1A: ${pfp1aCount} étudiants`);
        this.debug(`   🌸 PFP1B: ${pfp1bCount} étudiants`);
        this.debug(`   ⚪ Sans cohorte: ${noCohortCount} étudiants`);
      } catch (error) {
        console.error('❌ Erreur loadPfpCohorts:', error);
      }
    },
    
    isEditingCohort(student) {
      return !!student?.id && this.cohortEditingStudentId === student.id;
    },

    startEditCohort(student) {
      if (!student?.id) return;
      this.cohortEditingStudentId = student.id;
      this.cohortEditValue = student.pfp_cohort ?? null;
    },

    cancelEditCohort() {
      this.cohortEditingStudentId = null;
      this.cohortEditValue = null;
    },

    async saveEditCohort(student) {
      if (!student?.id) return;
      if (this.savingCohortId) return;
      this.savingCohortId = student.id;

      // Appliquer localement la nouvelle valeur et réutiliser la méthode existante
      const prev = student.pfp_cohort;
      student.pfp_cohort = this.cohortEditValue;
      try {
        await this.updatePfpCohort(student);
        this.cancelEditCohort();
        this.scheduleRefresh();
      } catch (e) {
        // rollback
        student.pfp_cohort = prev;
        throw e;
      } finally {
        this.savingCohortId = null;
      }
    },

    async updatePfpCohort(student) {
      try {
        student.updating = true;
        
        // Avec optionValue, on reçoit directement la string value
        const cohortValue = student.pfp_cohort;
        
        this.debug('📝 Mise à jour PFP Cohort:', {
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
          this.debug('✅ PFP Cohort mis à jour');
          
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
    },

    // ===== Méthodes Répondant HES =====
    async loadRepondantsHES() {
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .select('id, first_name, last_name, email')
          .eq('is_active', true)
          .order('last_name', { ascending: true });

        if (error) throw error;
        this.repondantsHESList = (data || []).map(r => ({
          id: r.id,
          label: `${r.first_name} ${r.last_name}`,
          value: `${r.first_name} ${r.last_name}`,
          email: r.email
        }));
        this.debug('✅ RepondantsHES chargés:', this.repondantsHESList.length);
      } catch (e) {
        console.error('❌ Erreur loadRepondantsHES:', e);
        this.repondantsHESList = [];
      }
    },

    async loadStudentsPhysioData(students) {
      try {
        const { data, error } = await supabase
          .from('StudentsPhysio')
          .select('user_id, repondant_hes');

        if (error) throw error;
        
        const physioByUserId = new Map((data || []).map(sp => [sp.user_id, sp]));
        
        students.forEach(student => {
          const physioData = physioByUserId.get(student.id);
          student.repondant_hes = physioData?.repondant_hes || null;
        });
        
        this.debug('✅ StudentsPhysio chargés pour', data?.length || 0, 'étudiants');
      } catch (e) {
        console.error('❌ Erreur loadStudentsPhysioData:', e);
      }
    },

    isEditingRepondant(student) {
      return !!student?.id && this.repondantEditingStudentId === student.id;
    },

    startEditRepondant(student) {
      if (!student?.id) return;
      this.repondantEditingStudentId = student.id;
      this.repondantEditValue = student.repondant_hes || null;
    },

    cancelEditRepondant() {
      this.repondantEditingStudentId = null;
      this.repondantEditValue = null;
    },

    async saveEditRepondant(student) {
      if (!student?.id) return;
      if (this.savingRepondantId) return;
      this.savingRepondantId = student.id;

      const prev = student.repondant_hes;
      student.repondant_hes = this.repondantEditValue;
      
      try {
        await this.updateRepondantHES(student);
        this.cancelEditRepondant();
        this.scheduleRefresh();
      } catch (e) {
        student.repondant_hes = prev;
        console.error('❌ Erreur saveEditRepondant:', e);
      } finally {
        this.savingRepondantId = null;
      }
    },

    scheduleRefresh(delay = 400) {
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
      }
      this.refreshTimeout = setTimeout(() => {
        this.fetchEtudiantsFromSupabase();
      }, delay);
    },

    async updateRepondantHES(student) {
      try {
        const repondantValue = student.repondant_hes;
        
        this.debug('📝 Mise à jour Répondant HES:', {
          studentId: student.id,
          newRepondant: repondantValue
        });

        // Vérifier si l'étudiant existe dans StudentsPhysio
        const { data: existing } = await supabase
          .from('StudentsPhysio')
          .select('user_id')
          .eq('user_id', student.id)
          .single();

        let error;
        if (existing) {
          // Update
          const result = await supabase
            .from('StudentsPhysio')
            .update({ repondant_hes: repondantValue })
            .eq('user_id', student.id);
          error = result.error;
        } else {
          // Insert
          const result = await supabase
            .from('StudentsPhysio')
            .insert({ user_id: student.id, repondant_hes: repondantValue });
          error = result.error;
        }

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          this.toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de mettre à jour le Répondant HES',
            life: 5000
          });
          throw error;
        } else {
          this.debug('✅ Répondant HES mis à jour');
          this.toast.add({
            severity: 'success',
            summary: 'Mis à jour',
            detail: `Répondant HES ${repondantValue || 'supprimé'} pour ${student.Prenom} ${student.Nom}`,
            life: 3000
          });
        }
      } catch (error) {
        console.error('❌ Exception updateRepondantHES:', error);
        throw error;
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
