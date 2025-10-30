<template>
  <div>
    <Navbar />
    <div class="page-layout">
      <AdminSidebar />
      <div class="role-management">
    
    <div class="role-management-container">
      <div class="role-header">
        <h2>🔐 Gestion des Rôles</h2>
        <p>Gérez les permissions de votre compte Supabase</p>
      </div>

      <!-- Informations utilisateur -->
      <div class="user-info-card">
        <h3>👤 Utilisateur Actuel</h3>
        <div class="info-item">
          <strong>Email:</strong> {{ authStore.user?.email }}
        </div>
        <div class="info-item">
          <strong>Provider:</strong> {{ authStore.authProvider }}
        </div>
        <div class="info-item">
          <strong>ID:</strong> {{ authStore.user?.id || authStore.user?.uid }}
        </div>
      </div>

      <!-- Permissions actuelles -->
      <div class="permissions-card">
        <h3>🎯 Permissions Actuelles</h3>
        <div class="current-permissions">
          <div 
            v-for="perm in currentPermissions" 
            :key="perm"
            class="permission-tag"
          >
            🔹 {{ perm }}
          </div>
          <div v-if="currentPermissions.length === 0" class="no-permissions">
            Aucune permission configurée
          </div>
        </div>
      </div>

      <!-- Gestion des permissions -->
      <div class="permissions-manager">
        <h3>✏️ Modifier les Permissions</h3>
        
        <!-- Page 1 Access -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">page1.access</span>
            <span class="permission-desc">Accès à la section PFP</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="page1-access" 
              v-model="newPermissions['page1.access']"
              :disabled="loading"
            />
            <label for="page1-access" class="toggle-label"></label>
          </div>
        </div>

        <!-- Page 2 Access -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">page2.access</span>
            <span class="permission-desc">Accès à la section Académique</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="page2-access" 
              v-model="newPermissions['page2.access']"
              :disabled="loading"
            />
            <label for="page2-access" class="toggle-label"></label>
          </div>
        </div>

        <!-- Super Admin -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">super.all</span>
            <span class="permission-desc">Tous les accès (super administrateur)</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="super-all" 
              v-model="newPermissions['super.all']"
              :disabled="loading"
            />
            <label for="super-all" class="toggle-label"></label>
          </div>
        </div>

        <!-- admin -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">admin</span>
            <span class="permission-desc">Accès Admin Général</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="admin" 
              v-model="newPermissions['admin']"
              :disabled="loading"
            />
            <label for="admin" class="toggle-label"></label>
          </div>
        </div>

        <!-- AdminSoins -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">AdminSoins</span>
            <span class="permission-desc">Administration filière Soins</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="AdminSoins" 
              v-model="newPermissions['AdminSoins']"
              :disabled="loading"
            />
            <label for="AdminSoins" class="toggle-label"></label>
          </div>
        </div>

        <!-- AdminPhysio -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">AdminPhysio</span>
            <span class="permission-desc">Administration filière Physio</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="AdminPhysio" 
              v-model="newPermissions['AdminPhysio']"
              :disabled="loading"
            />
            <label for="AdminPhysio" class="toggle-label"></label>
          </div>
        </div>

        <!-- EnseignantSoins -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">EnseignantSoins</span>
            <span class="permission-desc">Enseignant filière Soins</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="EnseignantSoins" 
              v-model="newPermissions['EnseignantSoins']"
              :disabled="loading"
            />
            <label for="EnseignantSoins" class="toggle-label"></label>
          </div>
        </div>

        <!-- EnseignantPhysio -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">EnseignantPhysio</span>
            <span class="permission-desc">Enseignant filière Physio</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="EnseignantPhysio" 
              v-model="newPermissions['EnseignantPhysio']"
              :disabled="loading"
            />
            <label for="EnseignantPhysio" class="toggle-label"></label>
          </div>
        </div>

        <!-- EtudiantSoins -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">EtudiantSoins</span>
            <span class="permission-desc">Étudiant filière Soins</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="EtudiantSoins" 
              v-model="newPermissions['EtudiantSoins']"
              :disabled="loading"
            />
            <label for="EtudiantSoins" class="toggle-label"></label>
          </div>
        </div>

        <!-- EtudiantPhysio -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">EtudiantPhysio</span>
            <span class="permission-desc">Étudiant filière Physio</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="EtudiantPhysio" 
              v-model="newPermissions['EtudiantPhysio']"
              :disabled="loading"
            />
            <label for="EtudiantPhysio" class="toggle-label"></label>
          </div>
        </div>

        <!-- RMSoins -->
        <div class="permission-control">
          <div class="permission-info">
            <span class="permission-label">RMSoins</span>
            <span class="permission-desc">Responsable de module Soins</span>
          </div>
          <div class="permission-toggle">
            <input 
              type="checkbox" 
              id="RMSoins" 
              v-model="newPermissions['RMSoins']"
              :disabled="loading"
            />
            <label for="RMSoins" class="toggle-label"></label>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="action-buttons">
          <button 
            @click="testCurrentState" 
            class="btn btn-test"
            :disabled="loading"
          >
            🧪 Tester état
          </button>
          <button 
            @click="resetPermissions" 
            class="btn btn-secondary"
            :disabled="loading"
          >
            🔄 Réinitialiser
          </button>
          <button 
            @click="savePermissions" 
            class="btn btn-primary"
            :disabled="loading || !hasChanges"
          >
            <span v-if="loading">💾 Sauvegarde...</span>
            <span v-else>💾 Sauvegarder</span>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="message" :class="['message', message.type]">
        {{ message.text }}
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, onBeforeUnmount, watch } from 'vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import AdminSidebar from '@/components/admin/lists/AdminSidebar.vue';
import { useAuthStore } from '@/stores/authStore';
import { useRoleStore } from '@/stores/role';
import { supabase } from '@/supabase';

const authStore = useAuthStore();
const roleStore = useRoleStore();

const loading = ref(false);
const message = ref(null);
const currentPermissions = ref([]);
const newPermissions = ref({
  'page1.access': false,
  'page2.access': false,
  'super.all': false,
  'admin': false,
  'AdminSoins': false,
  'AdminPhysio': false,
  'EnseignantSoins': false,
  'EnseignantPhysio': false,
  'EtudiantSoins': false,
  'EtudiantPhysio': false,
  'RMSoins': false
});

// Vérifier si des changements ont été faits
const hasChanges = computed(() => {
  const currentSet = new Set(currentPermissions.value);
  const newKeys = Object.keys(newPermissions.value).filter(key => newPermissions.value[key]);
  const newSet = new Set(newKeys);
  
  if (currentSet.size !== newSet.size) return true;
  return ![...currentSet].every(item => newSet.has(item));
});

// (supprimé) displayPermissions désormais non utilisé, l'encart montre l'état persisté

// Charger les permissions actuelles (rafraîchies depuis Supabase)
async function loadCurrentPermissions() {
  try {
    console.log('🔍 Chargement des permissions (rafraîchies) ...');

    // Récupérer l'utilisateur à jour depuis Supabase
    const { data: ures, error: uerr } = await supabase.auth.getUser();
    if (uerr) throw uerr;
    const freshUser = ures?.user ?? authStore.user;

    // Source de vérité: roleStore.perms (fusion RPC + metadata), sinon fallback metadata
    const normalize = (p) => {
      if (!p || typeof p !== 'string') return p;
      if (p === 'page1') return 'page1.access';
      if (p === 'page2') return 'page2.access';
      // Pour les rôles métiers, certaines sources ajoutent .access: on l'enlève
      if (p.endsWith('.access')) {
        const base = p.slice(0, -7);
        const prefixes = ['Admin', 'Enseignant', 'Etudiant', 'RM'];
        if (prefixes.some(pr => base.startsWith(pr))) return base;
      }
      return p;
    };
    const storePerms = Array.isArray(roleStore.perms) ? roleStore.perms.map(normalize) : [];
    const metaPerms = Array.isArray(freshUser?.user_metadata?.permissions)
      ? freshUser.user_metadata.permissions.map(normalize)
      : [];
    const picked = (storePerms.length > 0) ? storePerms : metaPerms;
    currentPermissions.value = Array.from(new Set(picked));
    console.log('✅ Permissions chargées:', currentPermissions.value);
    
    // Mettre à jour les checkboxes
    newPermissions.value['page1.access'] = currentPermissions.value.includes('page1.access');
    newPermissions.value['page2.access'] = currentPermissions.value.includes('page2.access');
    newPermissions.value['super.all'] = currentPermissions.value.includes('super.all');
    newPermissions.value['admin'] = currentPermissions.value.includes('admin');
    newPermissions.value['AdminSoins'] = currentPermissions.value.includes('AdminSoins');
    newPermissions.value['AdminPhysio'] = currentPermissions.value.includes('AdminPhysio');
    newPermissions.value['EnseignantSoins'] = currentPermissions.value.includes('EnseignantSoins');
    newPermissions.value['EnseignantPhysio'] = currentPermissions.value.includes('EnseignantPhysio');
    newPermissions.value['EtudiantSoins'] = currentPermissions.value.includes('EtudiantSoins');
    newPermissions.value['EtudiantPhysio'] = currentPermissions.value.includes('EtudiantPhysio');
    newPermissions.value['RMSoins'] = currentPermissions.value.includes('RMSoins');
    
  } catch (error) {
    console.error('❌ Erreur chargement permissions:', error);
    showMessage('Erreur lors du chargement des permissions', 'error');
  }
}

// Sauvegarder les permissions
async function savePermissions() {
  if (!authStore.isSupabaseUser) {
    showMessage('Cette fonctionnalité n\'est disponible que pour les utilisateurs Supabase', 'error');
    return;
  }

  loading.value = true;
  
  try {
    const permissionsToSave = Object.keys(newPermissions.value).filter(key => newPermissions.value[key]);
    
    console.log('💾 Sauvegarde des permissions:', permissionsToSave);
    
    // Sauvegarder dans les métadonnées utilisateur
    const { error: updateError } = await supabase.auth.updateUser({
      data: { permissions: permissionsToSave }
    });
    
    if (updateError) {
      throw updateError;
    }
    
    // Mettre à jour immédiatement les permissions locales
    currentPermissions.value = permissionsToSave;
    roleStore.perms = permissionsToSave;
    
    // Rafraîchir les données utilisateur pour confirmer
    await authStore.checkAuthState();
    
    showMessage('✅ Permissions mises à jour avec succès!', 'success');
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde permissions:', error);
    showMessage('Erreur: ' + error.message, 'error');
  } finally {
    loading.value = false;
  }
}

// Réinitialiser les permissions aux valeurs actuelles
function resetPermissions() {
  newPermissions.value['page1.access'] = currentPermissions.value.includes('page1.access');
  newPermissions.value['page2.access'] = currentPermissions.value.includes('page2.access');
  newPermissions.value['super.all'] = currentPermissions.value.includes('super.all');
  newPermissions.value['admin'] = currentPermissions.value.includes('admin');
  newPermissions.value['AdminSoins'] = currentPermissions.value.includes('AdminSoins');
  newPermissions.value['AdminPhysio'] = currentPermissions.value.includes('AdminPhysio');
  newPermissions.value['EnseignantSoins'] = currentPermissions.value.includes('EnseignantSoins');
  newPermissions.value['EnseignantPhysio'] = currentPermissions.value.includes('EnseignantPhysio');
  newPermissions.value['EtudiantSoins'] = currentPermissions.value.includes('EtudiantSoins');
  newPermissions.value['EtudiantPhysio'] = currentPermissions.value.includes('EtudiantPhysio');
  newPermissions.value['RMSoins'] = currentPermissions.value.includes('RMSoins');
  showMessage('Permissions réinitialisées', 'info');
}

// Fonction de test pour débuguer l'état
function testCurrentState() {
  const state = {
    user: authStore.user?.email,
    provider: authStore.authProvider,
    isSupabase: authStore.isSupabaseUser,
    session: !!authStore.session,
    roleStorePerms: roleStore.perms,
    currentPerms: currentPermissions.value,
    newPerms: Object.keys(newPermissions.value).filter(k => newPermissions.value[k]),
    hasChanges: hasChanges.value,
    metadata: authStore.user?.user_metadata
  };
  
  console.log('🧪 État complet:', state);
  showMessage('État affiché dans la console (F12)', 'info');
}

// Afficher un message
function showMessage(text, type = 'info') {
  message.value = { text, type };
  setTimeout(() => {
    message.value = null;
  }, 5000);
}

// Charger les permissions au montage et à chaque activation (ex: retour sur la page)
onMounted(async () => {
  await loadCurrentPermissions();
});

onActivated(async () => {
  await loadCurrentPermissions();
});

// Réagir aux changements d'auth côté Supabase
let authSub;
try {
  const { data: sub } = supabase.auth.onAuthStateChange(async () => {
    await loadCurrentPermissions();
  });
  authSub = sub?.subscription || sub; // compat v2
} catch (e) { console.warn('auth state subscription setup failed', e); }

onBeforeUnmount(() => {
  try { authSub?.unsubscribe && authSub.unsubscribe(); } catch (e) { console.warn('auth state subscription cleanup failed', e); }
});
</script>

<style scoped>
.page-layout {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-ground);
  min-height: calc(100vh - 80px);
}

.role-management {
  flex: 1;
  min-width: 0;
  padding: 2rem;
  background: var(--surface-ground);
}

.role-management-container {
  max-width: 800px;
  margin: 0 auto;
}

.role-header {
  text-align: center;
  margin-bottom: 2rem;
}

.role-header h2 {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.role-header p {
  color: var(--text-color-secondary);
}

.user-info-card,
.permissions-card,
.permissions-manager {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-info-card h3,
.permissions-card h3,
.permissions-manager h3 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.info-item {
  margin-bottom: 0.5rem;
  color: var(--text-color-secondary);
}

.info-item strong {
  color: var(--text-color);
}

.current-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.permission-tag {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.no-permissions {
  color: var(--text-color-secondary);
  font-style: italic;
}

.permission-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.permission-control:last-child {
  border-bottom: none;
}

.permission-info {
  display: flex;
  flex-direction: column;
}

.permission-label {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.permission-desc {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.permission-toggle {
  position: relative;
}

.permission-toggle input[type="checkbox"] {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  background: var(--surface-border);
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.permission-toggle input[type="checkbox"]:checked + .toggle-label {
  background: var(--primary-color);
}

.permission-toggle input[type="checkbox"]:checked + .toggle-label::after {
  transform: translateX(26px);
}

.permission-toggle input[type="checkbox"]:disabled + .toggle-label {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.btn-secondary {
  background: var(--surface-border);
  color: var(--text-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-200);
}

.btn-test {
  background: #8b5cf6;
  color: white;
}

.btn-test:hover:not(:disabled) {
  background: #7c3aed;
}

.message {
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  font-weight: 500;
}

.message.success {
  background: #10b981;
  color: white;
}

.message.error {
  background: #ef4444;
  color: white;
}

.message.info {
  background: #3b82f6;
  color: white;
}
</style>
