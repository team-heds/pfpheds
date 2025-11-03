<template>
  <aside class="admin-sidebar card sidebar">
    <!-- Permissions: n'afficher que la liste possédée -->
    <div v-if="isSupabaseUser && roleStore.initialized" class="permissions-info-card">
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
              <span>{{ section.label }}</span>
              <i class="pi" :class="isSectionOpen(section.label) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left: auto; font-size: 0.875rem;"></i>
            </div>  
            <ul v-if="section.items && section.items.length > 0 && isSectionOpen(section.label)" class="sidebar-submenu">
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

const router = useRouter();
const roleStore = useRoleStore();
const authStore = useAuthStore();

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
  // Par défaut, toutes ouvertes
  return new Set(['Admin Général', 'PFP', 'Académique', 'Gamification']);
};

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
    console.debug('⬇️ Menu masqué (need non satisfait):', { to: route.to, need });
    return false;
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
  return items.filter(item => {
    // Si l'item a une route, vérifier les permissions
    if (item.to && !canAccessRoute(item)) {
      return false;
    }
    
    // Si l'item a des sous-items, les filtrer récursivement
    if (item.items) {
      const filteredItems = filterMenuItems(item.items);
      // Ne garder l'item que s'il a des sous-items visibles
      item.items = filteredItems;
      return filteredItems.length > 0;
    }
    
    return true;
  });
}

// Menu filtré selon les permissions
const filteredMenu = computed(() => filterMenuItems(JSON.parse(JSON.stringify(menu.value))));

// Obtenir la classe CSS pour une section selon son index
function getSectionClass(index) {
  const classes = {
    0: 'admin-general-section',    // Admin Général
    1: 'pfp-section',              // PFP
    2: 'academic-section',         // Académique
    3: 'gamification-section'      // Gamification
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
        roleStore.can('page1.access') ||
        roleStore.can('AdminPhysio') ||
        roleStore.can('EnseignantPhysio') ||
        roleStore.isSuper
      );
    case 2: // Académique - page2.access OU rôles Soins
      return (
        roleStore.can('page2.access') ||
        roleStore.can('AdminSoins') ||
        roleStore.can('EnseignantSoins') ||
        roleStore.can('RMSoins') ||
        roleStore.isSuper
      );
    case 3: // Gamification - accessible aux rôles Physio (et super)
      return (
        roleStore.can('AdminPhysio') ||
        roleStore.can('EnseignantPhysio') ||
        roleStore.isSuper
      );
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

const menu = ref([
  // ========================================
  // SECTION 1: ADMIN GÉNÉRAL
  // ========================================
  {
    label: 'Admin Général',
    icon: 'pi pi-cog',
    items: [
      { label: 'Dashboard', icon: 'pi pi-chart-bar', to: '/admin/dashboard-general' },
      { label: 'Gestion des Rôles', icon: 'pi pi-user-edit', to: '/role-management' },
      { label: 'Rôles Utilisateurs', icon: 'pi pi-users', to: '/admin/manage-user-roles' },
      { label: 'Permissions', icon: 'pi pi-lock', to: '/permissions' },
      { label: 'Routes & Accès', icon: 'pi pi-sitemap', to: '/router-inspector' },
      { label: 'Utilisateurs', icon: 'pi pi-users', to: '/user_list' },
      { label: 'Paramètres', icon: 'pi pi-wrench', to: '/admin/settings' }
    ]
  },
  
  // ========================================
  // SECTION 2: PFP
  // ========================================
  {
    label: 'PFP',
    icon: 'pi pi-briefcase',
    items: [
      { label: 'Dashboards PFP', icon: 'pi pi-chart-bar', to: '/admin/dashboard-pfp' },
      // Listes et utilisateurs
      { label: 'Étudiants', icon: 'pi pi-users', to: '/etudiant_list' },
      { label: 'Institutions', icon: 'pi pi-building', to: '/institution_list' },
      { label: 'Enseignants PHY', icon: 'pi pi-book', to: '/enseignent_list' },
      { label: 'Praticiens Formateurs', icon: 'pi pi-user-plus', to: '/praticien_formateur_list' },
      { label: 'Profil Utilisateur', icon: 'pi pi-id-card', to: '/profilAdmin/4qoWztDujictoqTEJvJK6xF1Zcr1' },
      { label: 'Répondant HES', icon: 'pi pi-id-card', to: '/management_repondant' },
      { label: 'Management Places', icon: 'pi pi-id-card', to: '/management_place' },
      
    
      
      // Votations
      {
        label: 'Votations',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Gestion Offres', icon: 'pi pi-cog', to: '/management_offre' },
          { label: 'Votation Lese', icon: 'pi pi-sliders-h', to: '/management_votation_prioritaire' },
          { label: 'Votation Étudiants', icon: 'pi pi-users', to: '/management_votation_etudiants' },
          { label: 'Places Assignées', icon: 'pi pi-map-marker', to: '/places_asssigned' },
          { label: 'Assignement Places', icon: 'pi pi-sitemap', to: '/places_assignment' },
          { label: 'Résultats Votation', icon: 'pi pi-chart-pie', to: '/result_preview_votation' }
        ]
      },
      
      // Gestion PFP
      {
        label: 'Gestion PFP',
        icon: 'pi pi-folder-open',
        items: [
          { label: 'PFP en Cours', icon: 'pi pi-clock', to: '/management_pfpencours' },
          { label: 'Gantt PFP', icon: 'pi pi-chart-line', to: '/gantt' },
          { label: 'Gestion Places Safe', icon: 'pi pi-shield', to: '/management_places_safe' },
          { label: 'Répartition Stages', icon: 'pi pi-percentage', to: '/stage_repartition' },
          { label: 'Validation PFP1A', icon: 'pi pi-check-circle', to: '/validate-pfp1a' }
        ]
      }
    ]
  },
  
  // ========================================
  // SECTION 2: ACADÉMIQUE
  // ========================================
  {
    label: 'Académique',
    icon: 'pi pi-book',
    items: [
      { label: 'Dashboard Académique', icon: 'pi pi-chart-bar', to: '/admin/dashboard-academique' },
      // Dashboards
    
      
      // Enseignants SI
      { label: 'Enseignants SI', icon: 'pi pi-user-edit', to: '/admin/teachers-si' },
      
      // Planning
      
          { label: 'Planning Hebdomadaire', icon: 'pi pi-eye', to: '/admin/planning/weekly' },
          { label: 'Gestion Planning', icon: 'pi pi-pencil', to: '/admin/planning/manage' },
      
      
      // Gestion académique
      { label: 'Tâches', icon: 'pi pi-th-large', to: '/admin/academic/kanban' },
      { label: 'Contenu Multimédia', icon: 'pi pi-video', to: '/admin/academic/media-content' },
      { label: 'Feedbacka', icon: 'pi pi-video', to: '/admin/academic/media-content' },
      { label: 'Care-Convers', icon: 'pi pi-video', to: '/care-convers' }
    ]
  },
  
  // ========================================
  // SECTION 3: GAMIFICATION
  // ========================================
  {
    label: 'Gamification',
    icon: 'pi pi-star-fill',
    items: [
      { label: 'Dashboard Gamification', icon: 'pi pi-chart-bar', to: '/admin/dashboard-gamification' },
      { label: 'Gestion Défis', icon: 'pi pi-flag-fill', to: '/admin/gamification/challenges' },
      { label: 'Gestion Quêtes', icon: 'pi pi-compass', to: '/admin/gamification/quests' },
      { label: 'Gestion Badges', icon: 'pi pi-shield', to: '/admin/gamification/badges' },
      { label: 'Gestion Utilisateurs', icon: 'pi pi-users', to: '/admin/gamification/users' },
      { label: 'Gestion Maisons', icon: 'pi pi-home', to: '/admin/gamification/houses' },
      { label: 'Analytics & Statistiques', icon: 'pi pi-chart-line', to: '/admin/gamification/analytics' }
    ]
  }
]);
</script>

<style scoped>
.admin-sidebar.card.sidebar {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: 100vh;
  min-height: 0;
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 1.2rem;
  width: 400px;
  min-width: 300px;
  max-width: 400px;
  box-sizing: border-box;
  position: sticky;
  top: 0;
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
  width: 340px;
  min-width: 300px;
  max-width: 400px;
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
</style>