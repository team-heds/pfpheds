<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="Gestion des Routes Dynamiques View" subtitle="Éditez les routes de l'application" icon="pi pi-sitemap" />
    </template>

    <div class="routes-editor">
      <!-- Toolbar -->
      <div class="toolbar">
        <Button label="Nouvelle Route" icon="pi pi-plus" @click="openCreateDialog" />
        <InputText v-model="searchQuery" placeholder="Rechercher..." style="flex: 1; max-width: 400px" />
        <Button label="Rafraîchir" icon="pi pi-refresh" @click="loadRoutes" :loading="loading" text />
      </div>

      <!-- Table des routes -->
      <DataTable 
        :value="filteredRoutes" 
        :loading="loading"
        dataKey="id"
        stripedRows
        class="mt-3"
      >
        <Column field="is_active" header="Actif" style="width: 80px">
          <template #body="{ data }">
            <i v-if="data.is_active" class="pi pi-check-circle" style="color: green"></i>
            <i v-else class="pi pi-times-circle" style="color: gray"></i>
          </template>
        </Column>

        <Column field="menu_order" header="Ordre" style="width: 80px" />
        
        <Column field="menu_section" header="Section" style="width: 150px">
          <template #body="{ data }">
            <Tag :value="data.menu_section || '—'" :severity="getSectionSeverity(data.menu_section)" />
          </template>
        </Column>

        <Column field="path" header="Chemin">
          <template #body="{ data }">
            <code>{{ data.path }}</code>
          </template>
        </Column>

        <Column field="name" header="Nom" />

        <Column field="menu_label" header="Label Menu" />

        <Column field="need" header="Permission (need)" style="width: 200px">
          <template #body="{ data }">
            <code v-if="data.need" style="font-size: 0.85em">{{ formatNeed(data.need) }}</code>
            <span v-else class="text-muted">—</span>
          </template>
        </Column>

        <Column header="Actions" style="width: 180px">
          <template #body="{ data }">
            <Button icon="pi pi-pencil" text @click="openEditDialog(data)" v-tooltip.top="'Éditer'" />
            <Button icon="pi pi-copy" text @click="duplicateRoute(data)" v-tooltip.top="'Dupliquer'" />
            <Button 
              :icon="data.is_active ? 'pi pi-eye-slash' : 'pi pi-eye'" 
              text 
              @click="toggleActive(data)" 
              v-tooltip.top="data.is_active ? 'Désactiver' : 'Activer'"
            />
            <Button icon="pi pi-trash" text severity="danger" @click="confirmDelete(data)" v-tooltip.top="'Supprimer'" />
          </template>
        </Column>
      </DataTable>

      <!-- Dialog Créer/Éditer -->
      <Dialog 
        v-model:visible="dialogVisible" 
        :header="isEditing ? 'Éditer la route' : 'Nouvelle route'"
        :modal="true"
        :style="{ width: '800px' }"
        :dismissableMask="true"
      >
        <div class="form-grid">
          <!-- Path -->
          <div class="field">
            <label>Chemin (path) *</label>
            <InputText v-model="formData.path" placeholder="/admin/example" />
          </div>

          <!-- Name -->
          <div class="field">
            <label>Nom (unique) *</label>
            <InputText v-model="formData.name" placeholder="ExampleView" />
          </div>

          <!-- Component Path -->
          <div class="field col-12">
            <label>Composant Vue (chemin) *</label>
            <InputText v-model="formData.component_path" placeholder="@/views/admin/ExampleView.vue" />
            <small>Exemple: @/views/admin/DashboardView.vue</small>
          </div>

          <!-- Menu Section -->
          <div class="field">
            <label>Section Menu</label>
            <Dropdown v-model="formData.menu_section" :options="menuSections" placeholder="Choisir..." editable />
            <small>Vous pouvez choisir ou saisir une nouvelle section</small>
          </div>

          <!-- Menu Label -->
          <div class="field">
            <label>Label Menu</label>
            <InputText v-model="formData.menu_label" placeholder="Mon Dashboard" />
          </div>

          <!-- Menu Icon -->
          <div class="field">
            <label>Icône Menu</label>
            <InputText v-model="formData.menu_icon" placeholder="pi pi-home" />
            <small>Icons PrimeIcons: pi pi-home, pi pi-user, etc.</small>
          </div>

          <!-- Menu Order -->
          <div class="field">
            <label>Ordre Menu</label>
            <InputNumber v-model="formData.menu_order" :min="0" :max="9999" />
          </div>

          <!-- Requires Auth -->
          <div class="field col-12">
            <div class="flex align-items-center">
              <Checkbox v-model="formData.requires_auth" inputId="requires_auth" :binary="true" />
              <label for="requires_auth" class="ml-2">Requiert authentification</label>
            </div>
          </div>

          <!-- Permission (need) -->
          <div class="field col-12">
            <label>Permission(s) requise(s) (need) - JSON</label>
            <Textarea v-model="formData.need_json" rows="3" placeholder='null ou "admin" ou ["admin", "editor"]' />
            <small>
              Format JSON: <code>null</code> (aucune), <code>"admin"</code> (une seule), ou <code>["admin", "editor"]</code> (plusieurs)
            </small>
          </div>

          <!-- Props -->
          <div class="field col-12">
            <div class="flex align-items-center">
              <Checkbox v-model="formData.props" inputId="props" :binary="true" />
              <label for="props" class="ml-2">Passer les params de route en props</label>
            </div>
          </div>

          <!-- Active -->
          <div class="field col-12">
            <div class="flex align-items-center">
              <Checkbox v-model="formData.is_active" inputId="is_active" :binary="true" />
              <label for="is_active" class="ml-2">Route active</label>
            </div>
          </div>

          <!-- Description -->
          <div class="field col-12">
            <label>Description</label>
            <Textarea v-model="formData.description" rows="2" placeholder="Description de la route..." />
          </div>
        </div>

        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="dialogVisible = false" />
          <Button label="Sauvegarder" icon="pi pi-check" @click="saveRoute" :loading="saving" />
        </template>
      </Dialog>

      <!-- Dialog Confirmation Suppression -->
      <Dialog 
        v-model:visible="deleteDialogVisible" 
        header="Confirmer la suppression"
        :modal="true"
        :style="{ width: '450px' }"
      >
        <p>Êtes-vous sûr de vouloir supprimer la route <strong>{{ routeToDelete?.path }}</strong> ?</p>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="deleteDialogVisible = false" />
          <Button label="Supprimer" icon="pi pi-trash" severity="danger" @click="deleteRoute" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import { supabase } from '@/supabase';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const routes = ref([]);
const searchQuery = ref('');

// Dialog state
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditing = ref(false);
const routeToDelete = ref(null);

// Form data
const formData = ref({
  id: null,
  path: '',
  name: '',
  component_path: '',
  requires_auth: true,
  need_json: 'null',
  props: false,
  menu_order: 999,
  menu_section: null,
  menu_label: '',
  menu_icon: 'pi pi-circle',
  is_active: true,
  description: ''
});

const menuSections = [
  'Admin Général',
  'PFP',
  'Académique',
  'Utilisateurs',
  'Gamification',
  'Outils',
  'Social'
];

// Load routes from Supabase
const loadRoutes = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('dynamic_routes')
      .select('*')
      .order('menu_order', { ascending: true });
    
    if (error) throw error;
    routes.value = data || [];
  } catch (e) {
    console.error('Erreur chargement routes:', e);
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
  } finally {
    loading.value = false;
  }
};

// Filtered routes
const filteredRoutes = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return routes.value;
  return routes.value.filter(r => 
    r.path?.toLowerCase().includes(q) ||
    r.name?.toLowerCase().includes(q) ||
    r.menu_label?.toLowerCase().includes(q) ||
    r.menu_section?.toLowerCase().includes(q)
  );
});

// Open create dialog
const openCreateDialog = () => {
  isEditing.value = false;
  formData.value = {
    id: null,
    path: '',
    name: '',
    component_path: '',
    requires_auth: true,
    need_json: 'null',
    props: false,
    menu_order: 999,
    menu_section: null,
    menu_label: '',
    menu_icon: 'pi pi-circle',
    is_active: true,
    description: ''
  };
  dialogVisible.value = true;
};

// Open edit dialog
const openEditDialog = (route) => {
  isEditing.value = true;
  formData.value = {
    id: route.id,
    path: route.path,
    name: route.name,
    component_path: route.component_path,
    requires_auth: route.requires_auth,
    need_json: route.need ? JSON.stringify(route.need) : 'null',
    props: route.props || false,
    menu_order: route.menu_order || 999,
    menu_section: route.menu_section,
    menu_label: route.menu_label,
    menu_icon: route.menu_icon || 'pi pi-circle',
    is_active: route.is_active,
    description: route.description || ''
  };
  dialogVisible.value = true;
};

// Save route
const saveRoute = async () => {
  saving.value = true;
  try {
    // Validate
    if (!formData.value.path || !formData.value.name || !formData.value.component_path) {
      toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Path, Name et Component sont requis', life: 3000 });
      return;
    }

    // Normaliser/trim les champs critiques
    formData.value.path = String(formData.value.path).trim();
    formData.value.name = String(formData.value.name).trim();
    formData.value.component_path = String(formData.value.component_path).trim();

    // Parse need JSON
    let needValue = null;
    try {
      const parsed = JSON.parse(formData.value.need_json);
      needValue = parsed;
    } catch (e) {
      toast.add({ severity: 'error', summary: 'JSON invalide', detail: 'Le champ "need" doit être du JSON valide', life: 4000 });
      return;
    }

    // Vérification côté client: unicité de name et path
    try {
      const nameEsc = formData.value.name.replace(/,/g, '%2C');
      const pathEsc = formData.value.path.replace(/,/g, '%2C');
      const orFilter = `name.eq.${nameEsc},path.eq.${pathEsc}`;
      const { data: existing, error: existErr } = await supabase
        .from('dynamic_routes')
        .select('id,name,path')
        .or(orFilter);
      if (existErr) {
        console.warn('⚠️ Échec vérification unicité (ignorée):', existErr);
      } else if (existing && existing.length) {
        const others = isEditing.value
          ? existing.filter(r => r.id !== formData.value.id)
          : existing;
        if (others.length) {
          const conflictName = others.find(r => r.name === formData.value.name);
          const conflictPath = others.find(r => r.path === formData.value.path);
          if (conflictName) {
            toast.add({ severity: 'error', summary: 'Conflit: nom déjà utilisé', detail: `Le nom "${formData.value.name}" est déjà utilisé.`, life: 5000 });
            return;
          }
          if (conflictPath) {
            toast.add({ severity: 'error', summary: 'Conflit: chemin déjà utilisé', detail: `Le chemin "${formData.value.path}" existe déjà.`, life: 5000 });
            return;
          }
        }
      }
    } catch (precheckErr) {
      console.warn('⚠️ Erreur inattendue lors de la pré-vérification:', precheckErr);
      // On continue quand même, le serveur fera autorité
    }

    const payload = {
      path: formData.value.path,
      name: formData.value.name,
      component_path: formData.value.component_path,
      requires_auth: formData.value.requires_auth,
      need: needValue,
      props: formData.value.props,
      menu_order: formData.value.menu_order,
      menu_section: formData.value.menu_section,
      menu_label: formData.value.menu_label,
      menu_icon: formData.value.menu_icon,
      is_active: formData.value.is_active,
      description: formData.value.description
    };

    console.log('📤 Payload envoyé:', payload);
    console.log('🔧 Mode:', isEditing.value ? 'UPDATE' : 'INSERT', isEditing.value ? `ID: ${formData.value.id}` : '');

    let result;
    if (isEditing.value) {
      result = await supabase
        .from('dynamic_routes')
        .update(payload)
        .eq('id', formData.value.id);
    } else {
      result = await supabase
        .from('dynamic_routes')
        .insert(payload);
    }

    console.log('📥 Résultat Supabase complet:', JSON.stringify(result, null, 2));
    console.log('📊 Status:', result?.status, 'StatusText:', result?.statusText);
    console.log('✅ Data:', result?.data);
    console.log('❌ Error:', result?.error);
    
    // Normaliser l'erreur et le statut HTTP
    const httpStatus = result?.status;
    const sbError = result?.error ?? null;
    const hasSupabaseError = !!(sbError && (sbError.code || sbError.message || sbError.details || sbError.hint));

    // Vérifier si une erreur existe réellement (évite le cas d'un objet vide {})
    if (hasSupabaseError || (typeof httpStatus === 'number' && httpStatus >= 400)) {
      console.error('🚨 Erreur Supabase détectée:', sbError);
      console.error('🔍 Code:', sbError?.code);
      console.error('🔍 Message:', sbError?.message);
      console.error('🔍 Details:', sbError?.details);
      console.error('🔍 Hint:', sbError?.hint);
      console.error('🔍 HTTP Status:', httpStatus);
      
      if (httpStatus === 406 && !hasSupabaseError) {
        toast.add({ 
          severity: 'success', 
          summary: isEditing.value ? 'Route mise à jour' : 'Route créée', 
          life: 2000 
        });
        dialogVisible.value = false;
        await loadRoutes();
        return;
      }

      let errorMsg = 'Erreur de sauvegarde';
      
      // 1. Vérifier les contraintes uniques d'abord (code PostgreSQL 23505)
      if (sbError?.code === '23505' || 
          sbError?.message?.includes('duplicate key') || 
          sbError?.message?.includes('unique') ||
          sbError?.details?.includes('already exists')) {
        
        // Analyser le message pour identifier la contrainte
        const errorDetails = sbError?.details || sbError?.message || '';
        
        if (errorDetails.includes('dynamic_routes_name_key') || errorDetails.includes('name')) {
          errorMsg = `❌ Le nom "${formData.value.name}" est déjà utilisé.\n\nVeuillez choisir un nom de route unique.`;
        } else if (errorDetails.includes('dynamic_routes_path_key') || errorDetails.includes('path')) {
          errorMsg = `❌ Le chemin "${formData.value.path}" existe déjà.\n\nVeuillez choisir un chemin de route unique.`;
        } else {
          errorMsg = `❌ Contrainte de unicité violée.\n\nUne route avec ce nom ou ce chemin existe déjà.\nNom: ${formData.value.name}\nChemin: ${formData.value.path}`;
        }
      }
      // 2. Vérifier les erreurs d'authentification/permissions
      else if (httpStatus === 401) {
        errorMsg = '🔒 Erreur d\'authentification: Vous devez être connecté pour modifier les routes.';
      } else if (httpStatus === 403 || httpStatus === 406) {
        errorMsg = '🔒 Erreur de permissions: Vous n\'avez pas les droits admin nécessaires.\n\nVérifiez que vous avez bien la permission "admin" ou que vous êtes dans la table admin_users.';
      }
      // 404: Ressource / endpoint introuvable
      else if (httpStatus === 404) {
        errorMsg = '🔎 Ressource Supabase introuvable (HTTP 404).\n\n' +
          'Vérifiez que VITE_SUPABASE_URL ne contient pas /rest/v1 et ne se termine pas par une barre oblique, et que la table "dynamic_routes" existe et est exposée via l\'API.';
      }
      // 3. Erreurs serveur
      else if (typeof httpStatus === 'number' && httpStatus >= 500) {
        errorMsg = '⚠️ Erreur serveur Supabase. Réessayez dans quelques instants.';
      }
      // 4. Erreur avec message explicite
      else if (sbError?.message) {
        errorMsg = sbError.message;
        if (sbError.details) {
          errorMsg += '\n\nDétails: ' + sbError.details;
        }
        if (sbError.hint) {
          errorMsg += '\n\nIndice: ' + sbError.hint;
        }
      } else if (typeof httpStatus === 'number') {
        errorMsg = `Erreur Supabase (HTTP ${httpStatus})`;
      }
      
      throw new Error(errorMsg);
    }
    
    // Vérifier que des données ont été retournées
    if (!result.data || result.data.length === 0) {
      console.warn('ℹ️ Aucune donnée retournée (return=minimal).');
    }

    toast.add({ 
      severity: 'success', 
      summary: isEditing.value ? 'Route mise à jour' : 'Route créée', 
      life: 2000 
    });

    dialogVisible.value = false;
    await loadRoutes();
  } catch (e) {
    console.error('🔥 Exception capturée:', e);
    
    let detail = 'Erreur inconnue';
    
    if (e instanceof Error) {
      detail = e.message;
    } else if (e && typeof e === 'object') {
      detail = e.message || e.msg || JSON.stringify(e);
    } else if (e) {
      detail = String(e);
    }
    
    console.error('💬 Message d\'erreur:', detail);
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur de sauvegarde', 
      detail, 
      life: 6000 
    });
  } finally {
    saving.value = false;
  }
};

// Duplicate route
const duplicateRoute = async (route) => {
  try {
    const payload = {
      ...route,
      id: undefined,
      path: route.path + '-copy',
      name: route.name + 'Copy',
      menu_label: (route.menu_label || route.name) + ' (Copie)',
      is_active: false
    };
    
    const { error, status } = await supabase.from('dynamic_routes').insert(payload);
    
    if (error || (typeof status === 'number' && status >= 400)) {
      console.error('🚨 Erreur duplication:', error);
      let errorMsg = 'Erreur de duplication';
      if (error?.code === '23505' || 
          error?.message?.includes('duplicate key') || 
          error?.message?.includes('unique') ||
          error?.details?.includes('already exists')) {
        const errorDetails = error?.details || error?.message || '';
        if (errorDetails.includes('dynamic_routes_name_key') || errorDetails.includes('name')) {
          errorMsg = `❌ Le nom "${payload.name}" existe déjà.\n\nEssayez de renommer manuellement la route dupliquée ou supprimez d'abord l'ancienne copie.`;
        } else if (errorDetails.includes('dynamic_routes_path_key') || errorDetails.includes('path')) {
          errorMsg = `❌ Le chemin "${payload.path}" existe déjà.\n\nSupprimez d'abord l'ancienne copie avant de dupliquer à nouveau.`;
        } else {
          errorMsg = `❌ Une route avec ce nom ou ce chemin existe déjà.\n\nNom: ${payload.name}\nChemin: ${payload.path}`;
        }
      } else if (typeof status === 'number') {
        errorMsg = `Erreur Supabase (HTTP ${status})`;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      throw new Error(errorMsg);
    }
    
    toast.add({ severity: 'success', summary: 'Route dupliquée', life: 2000 });
    await loadRoutes();
  } catch (e) {
    console.error('Exception duplication:', e);
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur de duplication', 
      detail: e.message || 'Erreur inconnue', 
      life: 5000 
    });
  }
};

// Toggle active
const toggleActive = async (route) => {
  try {
    const { error } = await supabase
      .from('dynamic_routes')
      .update({ is_active: !route.is_active })
      .eq('id', route.id);
    
    if (error) throw error;
    
    toast.add({ 
      severity: 'success', 
      summary: route.is_active ? 'Route désactivée' : 'Route activée', 
      life: 2000 
    });
    await loadRoutes();
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
  }
};

// Confirm delete
const confirmDelete = (route) => {
  routeToDelete.value = route;
  deleteDialogVisible.value = true;
};

// Delete route
const deleteRoute = async () => {
  try {
    const { error } = await supabase
      .from('dynamic_routes')
      .delete()
      .eq('id', routeToDelete.value.id);
    
    if (error) throw error;
    
    toast.add({ severity: 'success', summary: 'Route supprimée', life: 2000 });
    deleteDialogVisible.value = false;
    await loadRoutes();
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
  }
};

// Helpers
const formatNeed = (need) => {
  if (!need) return '—';
  if (typeof need === 'string') return need;
  if (Array.isArray(need)) return need.join(', ');
  return JSON.stringify(need);
};

const getSectionSeverity = (section) => {
  const map = {
    'Admin Général': 'info',
    'PFP': 'success',
    'Académique': 'warning',
    'Utilisateurs': 'danger',
    'Gamification': 'secondary'
  };
  return map[section] || 'info';
};

onMounted(() => {
  loadRoutes();
});
</script>

<style scoped>
.routes-editor {
  padding: 1.5rem;
}

.toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field.col-12 {
  grid-column: 1 / -1;
}

.field label {
  font-weight: 600;
  font-size: 0.9rem;
}

.field small {
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

code {
  background: var(--surface-200);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.9em;
}

.text-muted {
  color: var(--text-color-secondary);
}
</style>
