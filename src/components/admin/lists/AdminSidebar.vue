<template>
  <aside
    :class="['admin-sidebar card sidebar', { 'collapsed': isCollapsed }]"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    ref="sidebarEl"
  >
    <!-- Topbar: bouton collapse + recherche -->
    <div class="sidebar-topbar">
      <button class="collapse-toggle" type="button" @click="toggleCollapse" :aria-pressed="isCollapsed" :title="isCollapsed ? 'Agrandir' : 'Réduire'">
        <i class="pi" :class="isCollapsed ? 'pi-angle-double-right' : 'pi-angle-double-left'"></i>
      </button>
      <div v-if="isExpandedContent" class="sidebar-search">
        <input
          v-model.trim="searchQuery"
          type="text"
          class="search-input"
          placeholder="Rechercher..."
          aria-label="Rechercher dans le menu admin"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="Effacer la recherche">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>

    <!-- Permissions: affichage compact en chips -->
    <div v-if="isSupabaseUser && roleStore.initialized && isExpandedContent" class="permissions-info-card">
      <div class="perms-header">
        <h4>🔐 Permissions</h4>
        <small v-if="roleStore.perms && roleStore.perms.length">{{ roleStore.perms.length }}</small>
      </div>
      <div v-if="roleStore.perms && roleStore.perms.length" class="perms-chips">
        <span
          v-for="perm in displayPerms"
          :key="perm"
          class="perm-chip"
          :class="permClass(perm)"
        >{{ perm }}</span>
      </div>
      <div v-else class="permission-item">Aucune permission</div>
      <button
        v-if="roleStore.perms && roleStore.perms.length > 8"
        class="perms-toggle"
        @click="permsExpanded = !permsExpanded"
      >{{ permsExpanded ? 'Afficher moins' : 'Afficher plus' }}</button>
    </div>

    <!-- Sections dynamiques basées sur le menu filtré (permissions + recherche) -->
    <div 
      v-for="(section, index) in displayMenu" 
      :key="section.label"
      :class="[
        'sidebar-section-card',
        getSectionClass(index)
      ]"
      v-show="shouldShowSection(section, index)"
      @mouseenter="handleSectionEnter(section, $event)"
      @mouseleave="handleSectionLeave"
    >
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li class="sidebar-section">
            <div class="sidebar-section-label" @click="isExpandedContent && toggleSection(section.label)" :title="!isExpandedContent ? section.label : ''" style="cursor: pointer;">
              <i :class="section.icon" />
              <span v-if="isExpandedContent" v-html="highlightText(section.label)"></span>
              <i v-if="isExpandedContent" class="pi" :class="isSectionOpen(section.label) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left: auto; font-size: 0.875rem;"></i>
            </div>  
            <ul v-if="section.items && section.items.length > 0 && isSectionOpen(section.label) && isExpandedContent" class="sidebar-submenu">
              <SidebarMenuItems :items="section.items" :highlight="searchQuery" :counts="menuCounts" />
            </ul>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Flyout overlay quand la sidebar est repliée -->
    <div v-if="isCollapsed && hoveredSection && isHovering" class="sidebar-flyout" :style="{ top: flyoutTop + 'px' }">
      <div class="sidebar-flyout-header">
        <i :class="hoveredSection.icon" />
        <span>{{ hoveredSection.label }}</span>
      </div>
      <SidebarMenuItems :items="hoveredSection.items || []" :level="0" :highlight="searchQuery" :counts="menuCounts" />
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarMenuItems from './SidebarMenuItems.vue';
import { useRoleStore } from '@/stores/role';
import { useAuthStore } from '@/stores/authStore';
import adminMenu from '@/config/adminMenu.js';

const router = useRouter();
const route = useRoute();
const roleStore = useRoleStore();
const authStore = useAuthStore();

// État de collapse
const isCollapsed = ref(false);
const isHovering = ref(false);
const isExpandedContent = computed(() => !isCollapsed.value);
const sidebarEl = ref(null);

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

// Liste des emails qui n'ont pas accès à la section Académique
const restrictedAcademicEmails = [
  'lucienne.darbellay-fumeaux@hevs.ch',
  'filipa.pereira@hevs.ch',
  'aline.chappuis@hevs.ch',
  'maude.epiney-perruchoud@hevs.ch',
  'isabelle.salamin-plaschy@hevs.ch',
  'rafael.weissbrodt@hevs.ch',
  'valerie.caloz-albrecht@hevs.ch',
  'tiffany.rapillard@hevs.ch',
  'omar.porteladossantos@hevs.ch',
  'jesse.curchod@hevs.ch',
  'line.martin@hevs.ch',
  'isabelle.rey@hevs.ch',
  'carla.gomesdarocha@hevs.ch'
];

// Vérifier si l'utilisateur est connecté avec Supabase
const isSupabaseUser = computed(() => authStore.isSupabaseUser && authStore.session);

// Vérifier si l'utilisateur est restreint pour la section Académique
const isRestrictedUser = computed(() => {
  const userEmail = authStore.user?.email?.toLowerCase();
  return userEmail && restrictedAcademicEmails.includes(userEmail);
});

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
    if (!p) return p;
    // S'assurer que p est une string
    const pStr = String(p);
    if (pStr === 'page1') return 'page1.access';
    if (pStr === 'page2') return 'page2.access';
    if (pStr.endsWith('.access')) return pStr.slice(0, -7); // AdminPhysio.access -> AdminPhysio
    return pStr;
  };

  const need = alias(last?.meta?.need ?? resolved.meta?.need);
  let reqRoles = last?.meta?.requiredRole ?? resolved.meta?.requiredRole;
  reqRoles = Array.isArray(reqRoles) ? reqRoles : (reqRoles ? [reqRoles] : []);
  reqRoles = reqRoles.map(alias).filter(r => r && typeof r === 'string');

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
    // Exclure la section "Académique" pour les utilisateurs restreints
    if (isRestrictedUser.value && item.label === 'Académique') {
      continue;
    }
    
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

// Recherche locale dans les labels des sections et sous-items
const searchQuery = ref('');

function filterByQuery(sections, q) {
  if (!q) return sections;
  const query = q.toLowerCase();
  const match = (label = '') => String(label).toLowerCase().includes(query);

  const filterItems = (items) => {
    const out = [];
    for (const it of items) {
      const hasChildren = Array.isArray(it.items) && it.items.length > 0;
      const children = hasChildren ? filterItems(it.items) : [];
      if (match(it.label) || (children && children.length)) {
        out.push({ ...it, items: children });
      }
    }
    return out;
  };

  return sections
    .map(sec => {
      const items = Array.isArray(sec.items) ? filterItems(sec.items) : [];
      if (match(sec.label) || items.length) {
        return { ...sec, items };
      }
      return null;
    })
    .filter(Boolean);
}

const displayMenu = computed(() => filterByQuery(filteredMenu.value, searchQuery.value));

// Effacer la recherche à chaque changement de route
watch(() => route.fullPath, () => {
  searchQuery.value = '';
});

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function highlightText(text) {
  if (!searchQuery.value) return String(text ?? '');
  try {
    const re = new RegExp('(' + escapeRegExp(searchQuery.value) + ')', 'ig');
    return String(text ?? '').replace(re, '<mark>$1</mark>');
  } catch (e) {
    return String(text ?? '');
  }
}

const menuCounts = ref({
  '/admin/academic/tickets': 5,
  '/management_votation_prioritaire': 2,
  '/admin/users': 12,
});

// Gestion du flyout en mode icon-only
const hoveredSection = ref(null);
const flyoutTop = ref(0);
function handleSectionEnter(section, evt) {
  if (isCollapsed.value) {
    hoveredSection.value = section;
    const asideRect = sidebarEl.value?.getBoundingClientRect?.() || null;
    const targetRect = evt?.currentTarget?.getBoundingClientRect?.() || null;
    if (asideRect && targetRect) {
      flyoutTop.value = Math.max(0, targetRect.top - asideRect.top);
    } else {
      flyoutTop.value = 0;
    }
  }
}
function handleSectionLeave() {
  // On garde le flyout ouvert tant que la souris est dans la sidebar (isHovering)
}

// Permissions: affichage chips avec "voir plus"
const permsExpanded = ref(false);
const displayPerms = computed(() => {
  const perms = roleStore.perms || [];
  return permsExpanded.value ? perms : perms.slice(0, 8);
});

function permClass(p) {
  const v = String(p || '').toLowerCase();
  if (v.includes('super')) return 'perm-super';
  if (v.includes('admin')) return 'perm-admin';
  if (v.includes('physio') || v.includes('page1')) return 'perm-physio';
  if (v.includes('soins') || v.includes('page2')) return 'perm-soins';
  return 'perm-generic';
}

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
  
  // Restriction spécifique pour certains utilisateurs qui ne peuvent accéder qu'à la section d'index 2
  const userEmail = authStore.user?.email;
  const restrictedUsers = [
    'lucienne.darbellay-fumeaux@hevs.ch',
    'filipa.pereira@hevs.ch',
    'aline.chappuis@hevs.ch',
    'maude.epiney-perruchoud@hevs.ch',
    'isabelle.salamin-plaschy@hevs.ch',
    'rafael.weissbrodt@hevs.ch',
    'valerie.caloz-albrecht@hevs.ch',
    'tiffany.rapillard@hevs.ch',
    'omar.porteladossantos@hevs.ch',
    'jesse.curchod@hevs.ch',
    'line.martin@hevs.ch',
    'isabelle.rey@hevs.ch',
    'carla.gomesdarocha@hevs.ch'
  ];
  
  if (restrictedUsers.includes(userEmail)) {
    // Ces utilisateurs ne peuvent accéder qu'à la section d'index 2
    return index === 2;
  }
  
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
.sidebar-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0 1rem 0;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--surface-border, #e0e0e0);
  border-radius: 0.6rem;
  background: var(--surface-ground);
  color: var(--text-color);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-clear {
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-color-secondary);
}

.sidebar-topbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.sidebar-topbar .sidebar-search {
  flex: 1;
  margin: 0; /* override margin from .sidebar-search */
}

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

.perms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.perms-header h4 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.05rem;
}

.perms-header small {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border, #e0e0e0);
  padding: 0.1rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
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

.perms-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.perm-chip {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.6rem;
  border: 1px solid var(--surface-border, #e0e0e0);
  background: var(--surface-ground);
  color: var(--text-color);
}

.perms-toggle {
  margin-top: 0.5rem;
  background: transparent;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
}

/* Coloration légère selon catégories */
.perm-super {
  border-color: #8b5cf6;
  color: #8b5cf6;
  background: rgba(139, 92, 246, 0.08);
}
.perm-admin {
  border-color: #0ea5e9;
  color: #0ea5e9;
  background: rgba(14, 165, 233, 0.08);
}
.perm-physio {
  border-color: #22c55e;
  color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
}
.perm-soins {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}
.perm-generic {}

/* Bouton de collapse dans la topbar */
.collapse-toggle {
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

.admin-sidebar.collapsed:hover {
  width: 80px !important;
  min-width: 80px !important;
  max-width: 80px !important;
  padding: 1rem 0.5rem;
  overflow: visible;
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

.sidebar-flyout {
  position: absolute;
  left: calc(100% + 8px);
  width: 260px;
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)) - (2 * var(--layout-pad)));
  overflow-y: auto;
  background: var(--surface-card);
  border-radius: 1.2rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  padding: 1rem;
  z-index: 999;
}
.sidebar-flyout::-webkit-scrollbar { display: none; }
.sidebar-flyout-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
</style>