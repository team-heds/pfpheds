<template>
  <div class="assign-repondants-page">
    <Toast />
    <Navbar />
    
    <div class="page-container">
      <div class="page-header">
        <h1>
          <i class="pi pi-users"></i>
          Assignation des Répondants HES - BA25
        </h1>
        <p class="subtitle">Assignez les répondants HES aux étudiants de première année</p>
      </div>

      <!-- Statistiques -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: #3b82f6">
            <i class="pi pi-users"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Étudiants BA25</span>
            <span class="stat-value">{{ students.length }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #10b981">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Avec Répondant</span>
            <span class="stat-value">{{ studentsWithRepondant }}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #f59e0b">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="stat-info">
            <span class="stat-label">Sans Répondant</span>
            <span class="stat-value">{{ studentsWithoutRepondant }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <Button 
          label="Sauvegarder toutes les modifications" 
          icon="pi pi-save" 
          @click="saveAllChanges"
          :loading="saving"
          severity="success"
          class="save-all-btn"
        />
        <Button 
          label="Recharger" 
          icon="pi pi-refresh" 
          @click="loadStudents"
          :loading="loading"
          severity="secondary"
        />
      </div>

      <!-- Table des étudiants -->
      <div class="students-table-container">
        <DataTable 
          :value="students" 
          :loading="loading"
          paginator 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          filterDisplay="row"
          v-model:filters="filters"
          :globalFilterFields="['nom', 'prenom', 'email', 'repondant_actuel']"
          responsiveLayout="scroll"
          showGridlines
          stripedRows
        >
          <template #header>
            <div class="table-header">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText 
                  v-model="filters['global'].value" 
                  placeholder="Rechercher un étudiant..." 
                />
              </span>
            </div>
          </template>

          <Column field="nom" header="Nom" sortable style="min-width: 150px">
            <template #body="{ data }">
              <strong>{{ data.nom }}</strong>
            </template>
          </Column>

          <Column field="prenom" header="Prénom" sortable style="min-width: 150px">
            <template #body="{ data }">
              {{ data.prenom }}
            </template>
          </Column>

          <Column field="email" header="Email" sortable style="min-width: 250px">
            <template #body="{ data }">
              <span class="email-text">{{ data.email }}</span>
            </template>
          </Column>

          <Column field="repondant_actuel" header="Répondant Actuel" style="min-width: 200px">
            <template #body="{ data }">
              <Tag 
                v-if="data.repondant_actuel" 
                :value="data.repondant_actuel" 
                severity="success"
                icon="pi pi-check"
              />
              <Tag 
                v-else 
                value="Non assigné" 
                severity="warning"
                icon="pi pi-exclamation-triangle"
              />
            </template>
          </Column>

          <Column field="nouveau_repondant" header="Nouveau Répondant" style="min-width: 300px">
            <template #body="{ data }">
              <Dropdown
                v-model="data.nouveau_repondant"
                :options="repondantsOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Sélectionnez un répondant"
                showClear
                class="w-full"
                @change="onRepondantChange(data)"
              >
                <template #option="slotProps">
                  <div class="repondant-option">
                    <span class="option-name">{{ slotProps.option.label }}</span>
                    <small v-if="slotProps.option.classes" class="option-classes">
                      {{ slotProps.option.classes }}
                    </small>
                  </div>
                </template>
              </Dropdown>
            </template>
          </Column>

          <Column header="Statut" style="min-width: 120px">
            <template #body="{ data }">
              <Tag 
                v-if="data.modified" 
                value="Modifié" 
                severity="info"
                icon="pi pi-pencil"
              />
              <Tag 
                v-else-if="data.saved" 
                value="Sauvegardé" 
                severity="success"
                icon="pi pi-check"
              />
            </template>
          </Column>

          <Column header="Actions" style="min-width: 150px">
            <template #body="{ data }">
              <Button 
                icon="pi pi-save" 
                @click="saveStudent(data)"
                :loading="data.saving"
                :disabled="!data.modified"
                severity="success"
                size="small"
                text
                rounded
                v-tooltip.top="'Sauvegarder'"
              />
              <Button 
                icon="pi pi-times" 
                @click="resetStudent(data)"
                :disabled="!data.modified"
                severity="danger"
                size="small"
                text
                rounded
                v-tooltip.top="'Annuler les modifications'"
              />
            </template>
          </Column>

          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun étudiant BA25 trouvé</p>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/supabase.js';
import { useToast } from 'primevue/usetoast';
import { FilterMatchMode } from 'primevue/api';
import Navbar from '@/components/common/utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';

const toast = useToast();

// States
const loading = ref(false);
const saving = ref(false);
const students = ref([]);
const repondantsOptions = ref([]);

// Filtres DataTable
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// Computed
const studentsWithRepondant = computed(() => {
  return students.value.filter(s => s.repondant_actuel || s.nouveau_repondant).length;
});

const studentsWithoutRepondant = computed(() => {
  return students.value.filter(s => !s.repondant_actuel && !s.nouveau_repondant).length;
});

// Charger les répondants HES depuis StudentsPhysio
const loadRepondants = async () => {
  console.log('📋 Chargement des répondants HES...');
  
  try {
    // Récupérer toutes les colonnes pour voir ce qui existe
    const { data: physioData, error } = await supabase
      .from('StudentsPhysio')
      .select('*')
      .limit(100);

    if (error) {
      console.warn('⚠️ Erreur chargement répondants:', error.message);
      return;
    }

    // Regrouper les répondants avec leurs classes
    const repondantsMap = new Map();
    
    // Log pour voir les colonnes disponibles
    if (physioData && physioData.length > 0) {
      console.log('📋 Colonnes disponibles dans StudentsPhysio:', Object.keys(physioData[0]));
    }
    
    physioData?.forEach(row => {
      // Utiliser la colonne exacte : repondant_hes
      const repondant = row.repondant_hes || '';
      const classe = row.class || '';
      
      if (repondant && typeof repondant === 'string' && repondant.trim()) {
        const repondantName = repondant.trim();
        
        if (!repondantsMap.has(repondantName)) {
          repondantsMap.set(repondantName, new Set());
        }
        if (classe) {
          repondantsMap.get(repondantName).add(classe);
        }
      }
    });

    // Convertir en options pour le dropdown
    repondantsOptions.value = Array.from(repondantsMap.entries()).map(([name, classes]) => {
      const classesArray = Array.from(classes);
      const classesText = classesArray.length > 0 ? `Classes: ${classesArray.join(', ')}` : '';
      
      return {
        label: name,
        value: name,
        classes: classesText
      };
    });

    // Trier par nom
    repondantsOptions.value.sort((a, b) => a.label.localeCompare(b.label));

    console.log(`✅ ${repondantsOptions.value.length} répondants chargés`);
  } catch (error) {
    console.error('❌ Erreur chargement répondants:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les répondants HES',
      life: 3000
    });
  }
};

// Charger les étudiants BA25
const loadStudents = async () => {
  loading.value = true;
  
  try {
    console.log('📥 Chargement des étudiants BA25...');
    
    // Charger TOUS les champs pour voir ce qui existe
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('family_name');

    if (profilesError) throw profilesError;
    
    // Filtrer en JavaScript pour éviter les erreurs SQL
    const filteredProfiles = profiles?.filter(p => {
      const classe = p.classe || '';
      return classe === 'BA25';
    }) || [];

    console.log(`✅ ${filteredProfiles.length} profils BA25 trouvés dans user_profiles (total: ${profiles?.length || 0})`);
    
    // Log pour voir les colonnes disponibles
    if (filteredProfiles.length > 0) {
      console.log('📋 Colonnes disponibles dans user_profiles:', Object.keys(filteredProfiles[0]));
    }

    // Enrichir avec les données de StudentsPhysio
    const enrichedStudents = [];
    
    for (const profile of filteredProfiles) {
      // Chercher dans StudentsPhysio
      const { data: physioData } = await supabase
        .from('StudentsPhysio')
        .select('*')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      // Utiliser la colonne exacte : repondant_hes
      const repondant_physio = physioData?.repondant_hes || '';
      
      // Dans user_profiles, hes_referent est probablement dans metadata
      const metadata = profile.metadata || {};
      const repondant_actuel = metadata.hes_referent || profile.hes_referent || repondant_physio || '';

      enrichedStudents.push({
        user_id: profile.user_id,
        nom: profile.family_name || '',
        prenom: profile.forname || '',
        email: profile.email || '',
        classe: profile.classe || '',
        repondant_actuel: repondant_actuel,
        nouveau_repondant: null,
        modified: false,
        saved: false,
        saving: false,
        exists_in_physio: !!physioData,
        physio_id: physioData?.id || null,
        physio_data: physioData || null,
        metadata: profile.metadata || {}
      });
    }

    students.value = enrichedStudents;
    
    console.log(`✅ ${students.value.length} étudiants chargés`);
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${students.value.length} étudiants BA25 chargés`,
      life: 3000
    });
  } catch (error) {
    console.error('❌ Erreur chargement étudiants:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les étudiants',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

// Événement changement de répondant
const onRepondantChange = (student) => {
  student.modified = true;
  student.saved = false;
  console.log('📝 Modification pour:', student.nom, student.prenom, '→', student.nouveau_repondant);
};

// Sauvegarder un étudiant
const saveStudent = async (student) => {
  if (!student.nouveau_repondant) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez sélectionner un répondant',
      life: 3000
    });
    return;
  }

  student.saving = true;

  try {
    console.log('💾 Sauvegarde UNIQUEMENT dans StudentsPhysio pour:', student.nom, student.prenom);

    // Sauvegarder UNIQUEMENT dans StudentsPhysio
    if (student.exists_in_physio) {
      // UPDATE de l'enregistrement existant
      const { error: updateError } = await supabase
        .from('StudentsPhysio')
        .update({
          repondant_hes: student.nouveau_repondant
        })
        .eq('user_id', student.user_id);

      if (updateError) {
        console.error('❌ Erreur UPDATE StudentsPhysio:', updateError);
        throw new Error(`Erreur mise à jour StudentsPhysio: ${updateError.message}`);
      }
      
      console.log('✅ StudentsPhysio mis à jour pour:', student.nom, student.prenom);
    } else {
      // INSERT d'un nouvel enregistrement dans StudentsPhysio
      console.log('🆕 Création nouvelle ligne StudentsPhysio pour:', student.nom, student.prenom);
      
      const newRecord = {
        user_id: student.user_id,
        class: 'BA25',
        repondant_hes: student.nouveau_repondant,
        sae: 0  // 0 = false (colonne de type integer)
      };
      
      console.log('📝 Données à insérer:', newRecord);
      
      const { data: insertData, error: insertError } = await supabase
        .from('StudentsPhysio')
        .insert(newRecord)
        .select();

      if (insertError) {
        console.error('❌ Erreur INSERT StudentsPhysio:', insertError);
        console.error('❌ Code erreur:', insertError.code);
        console.error('❌ Details:', insertError.details);
        console.error('❌ Hint:', insertError.hint);
        throw new Error(`Erreur création StudentsPhysio: ${insertError.message}`);
      }
      
      student.exists_in_physio = true;
      console.log('✅ Nouvelle ligne StudentsPhysio créée avec succès !');
      console.log('✅ Données insérées:', insertData);
    }

    // Mettre à jour l'état local
    student.repondant_actuel = student.nouveau_repondant;
    student.nouveau_repondant = null;
    student.modified = false;
    student.saved = true;

    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `Répondant sauvegardé pour ${student.prenom} ${student.nom}`,
      life: 3000
    });

    console.log('✅ Sauvegarde réussie');
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `Erreur lors de la sauvegarde: ${error.message}`,
      life: 5000
    });
  } finally {
    student.saving = false;
  }
};

// Réinitialiser les modifications d'un étudiant
const resetStudent = (student) => {
  student.nouveau_repondant = null;
  student.modified = false;
};

// Sauvegarder toutes les modifications
const saveAllChanges = async () => {
  const modifiedStudents = students.value.filter(s => s.modified);
  
  if (modifiedStudents.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune modification',
      detail: 'Aucune modification à sauvegarder',
      life: 3000
    });
    return;
  }

  saving.value = true;

  let successCount = 0;
  let errorCount = 0;

  for (const student of modifiedStudents) {
    try {
      await saveStudent(student);
      successCount++;
    } catch (error) {
      errorCount++;
    }
  }

  saving.value = false;

  if (errorCount === 0) {
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: `${successCount} étudiant(s) sauvegardé(s) avec succès`,
      life: 3000
    });
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Terminé avec erreurs',
      detail: `${successCount} réussis, ${errorCount} échoués`,
      life: 5000
    });
  }
};

// Initialisation
onMounted(async () => {
  await loadRepondants();
  await loadStudents();
});
</script>

<style scoped>
.assign-repondants-page {
  min-height: 100vh;
  padding-bottom: 2rem;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border-left: 4px solid #3b82f6;
}

.page-header h1 {
  margin: 0;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
}

.page-header h1 i {
  color: #3b82f6;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #64748b;
  font-size: 1rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
}

.actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.save-all-btn {
  flex: 1;
  min-width: 200px;
}

.students-table-container {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.email-text {
  color: #64748b;
  font-size: 0.875rem;
}

.repondant-option {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-name {
  font-weight: 500;
}

.option-classes {
  color: #64748b;
  font-size: 0.75rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state p {
  margin: 0;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .actions-bar {
    flex-direction: column;
  }

  .save-all-btn {
    width: 100%;
  }
}
</style>
