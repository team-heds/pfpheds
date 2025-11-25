<template>
  <aside :class="['admin-sidebar card sidebar', { 'collapsed': isCollapsed }]">

    <!-- Bouton pour réduire/étendre la sidebar -->
    <button class="collapse-toggle" type="button" @click="toggleCollapse" :aria-pressed="isCollapsed" :title="isCollapsed ? 'Agrandir' : 'Réduire'">
      <i class="pi" :class="isCollapsed ? 'pi-angle-double-right' : 'pi-angle-double-left'"></i>
    </button>

    <!-- Permissions: n'afficher que la liste possédée -->
    <div v-if="isSupabaseUser && roleStore.initialized && !isCollapsed" class="permissions-info-card">
      <h4>🔐 Permissions</h4>
      <ul class="perms-list">
        <li v-for="perm in roleStore.perms" :key="perm">🔹 {{ perm }}</li>
        <li v-if="!roleStore.perms || roleStore.perms.length === 0" class="permission-item">Aucune permission</li>
      </ul>
    </div>

    <!-- Sections dynamiques basées sur le menu filtré -->
    <div 
      v-for="(section, index) in filteredMenu" 
      :key="section.label"
      :class="[
        'sidebar-section-card',
        getSectionClass(index)
      ]"
      v-show="shouldShowSection(section, index)"
    >
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li class="sidebar-section">
            <div class="sidebar-section-label" @click="toggleSection(section.label)" style="cursor: pointer;">
              <i :class="section.icon" />
              <span v-if="!isCollapsed">{{ section.label }}</span>
              <i v-if="!isCollapsed" class="pi" :class="isSectionOpen(section.label) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left: auto; font-size: 0.875rem;"></i>
            </div>  
            <ul v-if="section.items && section.items.length > 0 && isSectionOpen(section.label) && !isCollapsed" class="sidebar-submenu">
              <SidebarMenuItems :items="section.items" />
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import SidebarMenuItems from './SidebarMenuItems.vue';
import { useRoleStore } from '@/stores/role';
import { useAuthStore } from '@/stores/authStore';
import adminMenu from '@/config/adminMenu.js';

const router = useRouter();
const roleStore = useRoleStore();
const authStore = useAuthStore();

// État de collapse
const isCollapsed = ref(false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
  try {
    localStorage.setItem('adminSidebarCollapsed', isCollapsed.value.toString());
  } catch (e) {
    console.warn('Erreur sauvegarde état collapse:', e);
  }
}

// État des sections ouvertes/fermées (persisté dans localStorage)
const loadSectionsState = () => {
  try {
    const saved = localStorage.getItem('adminSidebarSections');
    if (saved) {
      return new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.warn('Erreur chargement état sections:', e);
  }
  // Par défaut: toutes FERMÉES
  return new Set();
};

// Charger l'état de collapse
try {
  const savedCollapse = localStorage.getItem('adminSidebarCollapsed');
  if (savedCollapse !== null) {
    isCollapsed.value = savedCollapse === 'true';
  }
} catch (e) {
  console.warn('Erreur chargement état collapse:', e);
}

const openSections = ref(loadSectionsState());

function toggleSection(label) {
  if (openSections.value.has(label)) {
    openSections.value.delete(label);
  } else {
    openSections.value.add(label);
  }
  openSections.value = new Set(openSections.value);
  
  // Sauvegarder dans localStorage
  try {
    localStorage.setItem('adminSidebarSections', JSON.stringify([...openSections.value]));
  } catch (e) {
    console.warn('Erreur sauvegarde état sections:', e);
  }
}

function isSectionOpen(label) {
  return openSections.value.has(label);
}

// Vérifier si l'utilisateur est connecté avec Supabase
const isSupabaseUser = computed(() => authStore.isSupabaseUser && authStore.session);

// Plus de fallback ici: on n'affiche que roleStore.perms pour une source unique et cohérente

// Debug computed pour l'affichage des sections
const showPFPSection = computed(() => isSupabaseUser.value && roleStore.can('page1.access'));
const showAcademicSection = computed(() => isSupabaseUser.value && roleStore.can('page2.access'));
const showGamificationSection = computed(() => isSupabaseUser.value);

// Watch pour voir en temps réel les changements
watch([showPFPSection, showAcademicSection, showGamificationSection], (newValues) => {
  console.log('📊 AdminSidebar - État des sections:', {
    isSupabaseUser: isSupabaseUser.value,
    showPFP: showPFPSection.value,
    showAcademic: showAcademicSection.value,
    showGamification: showGamificationSection.value
  });
}, { immediate: true });

// Fonction pour vérifier si un item du menu peut être affiché
function canAccessRoute(route) {
  if (!route || !route.to) return true;

  const resolved = router.resolve(route.to);

  // Ne regarder que la dernière record (la vraie page), pas les ancêtres
  const last = resolved.matched.at(-1);
  // Aliases pour supporter anciens et nouveaux noms
  const alias = (p) => {
    if (!p || typeof p !== 'string') return p;
    if (p === 'page1') return 'page1.access';
    if (p === 'page2') return 'page2.access';
    if (p.endsWith('.access')) return p.slice(0, -7); // AdminPhysio.access -> AdminPhysio
    return p;
  };

  const need = alias(last?.meta?.need ?? resolved.meta?.need);
  let reqRoles = last?.meta?.requiredRole ?? resolved.meta?.requiredRole;
  reqRoles = Array.isArray(reqRoles) ? reqRoles : (reqRoles ? [reqRoles] : []);
  reqRoles = reqRoles.map(alias);

  // S'il n'y a aucune contrainte explicite, laisser visible
  if (!need && reqRoles.length === 0) return true;

  // Vérifier need
  if (need && !roleStore.isSuper && !roleStore.can(need)) {
    const needAccess = need.endsWith('.access') ? need : `${need}.access`;
    if (!roleStore.can(needAccess)) {
      console.debug('⬇️ Menu masqué (need non satisfait):', { to: route.to, need });
      return false;
    }
  }

  // Vérifier requiredRole
  if (reqRoles.length > 0) {
    const okRole = roleStore.isSuper || reqRoles.some(r => roleStore.can(r));
    if (!okRole) {
      console.debug('⬇️ Menu masqué (requiredRole non satisfait):', { to: route.to, reqRoles });
      return false;
    }
  }

  return true;
}

// Fonction récursive pour filtrer les items du menu
function filterMenuItems(items) {
  const result = [];
  for (const item of items) {
    if (item.to && !canAccessRoute(item)) continue;
    const newItem = { ...item };
    if (item.items) {
      const filteredItems = filterMenuItems(item.items);
      if (filteredItems.length === 0) continue;
      newItem.items = filteredItems;
    }
    result.push(newItem);
  }
  return result;
}

// Menu filtré selon les permissions (sans mutation ni deep-copy coûteuse)
const filteredMenu = computed(() => filterMenuItems(menu.value));

// Obtenir la classe CSS pour une section selon son index
function getSectionClass(index) {
  const classes = {
    0: 'admin-general-section',          // Admin Général
    1: 'pfp-section',                    // PFP
    2: 'formation-pratique-section',     // Formation Pratique Physio
    3: 'academic-section',               // Académique
    4: 'gamification-section',           // Gamification
    5: 'tools-section'                   // Outils
  };
  return classes[index] || '';
}

// Déterminer si une section doit être affichée
function shouldShowSection(section, index) {
  if (!isSupabaseUser.value) return false;
  
  switch (index) {
    case 0: // Admin Général - super.all OU admin
      return roleStore.isSuper || roleStore.can('super.all') || roleStore.can('admin')|| roleStore.can('page1.access');
    case 1: // PFP - page1.access OU rôles Physio
      return (
       // roleStore.can('page1.access') ||
        roleStore.can('admin') // ||
       // roleStore.can('EnseignantPhysio') ||
      //  roleStore.isSuper
      );
    case 2: // Formation Pratique Physio - page1.access OU rôles Physio
      return (
        roleStore.can('page1.access') ||
        roleStore.can('super.all') ||
        roleStore.can('EnseignantPhysio') ||
        roleStore.can('FormationPratique') ||
        roleStore.isSuper
      );
    case 3: // Académique - page2.access OU rôles Soins
      return (
        roleStore.can('page2.access') ||
        roleStore.can('AdminSoins') ||
        roleStore.can('EnseignantSoins') ||
        roleStore.can('RMSoins') ||
        roleStore.isSuper
      );
    case 4: // Gamification - accessible aux rôles Physio (et super)
      return (
        roleStore.can('AdminPhysio') ||
        roleStore.can('EnseignantPhysio') ||
        roleStore.can('admin') ||
        roleStore.isSuper
      );
    case 5: // Outils - accessible à tous les utilisateurs authentifiés
      return true;
    default:
      return true;
  }
}

// Initialiser le roleStore au montage du composant
onMounted(async () => {
  if (!roleStore.initialized) {
    await roleStore.init();
  }
  
  // Debug pour voir si l'utilisateur est bien détecté comme SupabaseUser
  console.log('🎯 AdminSidebar - Debug connexion:', {
    user: authStore.user,
    isSupabaseUser: authStore.isSupabaseUser,
    session: authStore.session,
    isSuper: roleStore.isSuper,
    canPage1: roleStore.can('page1.access'),
    canPage2: roleStore.can('page2.access'),
    perms: roleStore.perms
  });
});

const menu = ref(adminMenu);
</script>

<style scoped>
.admin-sidebar.card.sidebar {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)) - (2 * var(--layout-pad)));
  max-height: none;
  min-height: 0;
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 1.2rem;
  width: 300px;
  min-width: 260px;
  max-width: 320px;
  box-sizing: border-box;
  position: relative;
  top: auto;
  align-self: flex-start;
  z-index: 10;
  overflow-y: auto;
  
  /* Masquer la scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE et Edge */
}

.admin-sidebar.card.sidebar::-webkit-scrollbar {
  display: none; /* Chrome, Safari et Opera */
}

.admin-sidebar {
  width: 300px;
  min-width: 260px;
  max-width: 320px;
}

/* Pour garantir que le parent ne décale pas la sidebar */
:global(.layout-container) {
  display: flex;
  align-items: flex-start;
  height: 100vh;
}

.sidebar-header {
  margin-bottom: 1.5rem;
}

.sidebar-menu {
  padding: 0;
  margin: 0;
  list-style: none;
}

.sidebar-section-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.sidebar-divider {
  height: 1px;
  background: var(--surface-border, #eee);
  margin: 1rem 0;
  border-radius: 2px;
}

.sidebar-submenu {
  margin-left: 1.5rem;
}

.sidebar-section-card {
  background: var(--surface-card);
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1.2rem 1rem 1.2rem 1rem;
  width: 100%;
}

.admin-general-section,
.pfp-section,
.academic-section {
  margin-bottom: 1.5rem;
}

/* Section d'information des permissions */
.permissions-info-card {
  background: var(--surface-card);
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1rem;
  width: 100%;
  margin-bottom: 1.5rem;
  border: 1px solid var(--surface-border, #e0e0e0);
}

.permissions-info-card h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  font-size: 1.1rem;
  border-bottom: 1px solid var(--surface-border, #e0e0e0);
  padding-bottom: 0.5rem;
}

.permission-item {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.permission-item strong {
  color: var(--text-color);
}

.perms-list {
  margin: 0.5rem 0 0 1rem;
  padding: 0;
  list-style: none;
}

.perms-list li {
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

/* Bouton de collapse (en haut à gauche) */
.collapse-toggle {
  position: absolute;
  left: 10px;
  top: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: 2px solid var(--surface-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.collapse-toggle:hover {
  background: var(--primary-color-dark);
  transform: scale(1.1);
}

.collapse-toggle i {
  font-size: 1rem;
}

/* État collapsed */
.admin-sidebar.collapsed {
  width: 80px !important;
  min-width: 80px !important;
  max-width: 80px !important;
  padding: 1rem 0.5rem;
}

.admin-sidebar.collapsed .sidebar-section-label {
  justify-content: center;
}

.admin-sidebar.collapsed .sidebar-section-label i:first-child {
  margin: 0;
  font-size: 1.5rem;
}

.admin-sidebar.collapsed .sidebar-submenu {
  display: none;
}

.admin-sidebar.collapsed .permissions-info-card {
  display: none;
}
</style>