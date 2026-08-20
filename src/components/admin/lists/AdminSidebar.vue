<template>
  <aside
    :class="['admin-sidebar card sidebar', { 'collapsed': isCollapsed }]"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    @scroll.passive="saveSidebarScroll"
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

    <!-- Sections dynamiques basées sur le menu filtré (permissions + recherche) -->
    <div 
      v-for="section in displayMenu" 
      :key="section.label"
      :class="[
        'sidebar-section-card',
        getSectionClass(section)
      ]"
      v-show="shouldShowSection(section)"
      @mouseenter="handleSectionEnter(section, $event)"
      @mouseleave="handleSectionLeave"
    >
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li class="sidebar-section">
            <button type="button" class="sidebar-section-label" @click="isExpandedContent && toggleSection(section.label)" :aria-expanded="isExpandedContent ? isSectionOpen(section.label) : undefined" :title="!isExpandedContent ? section.label : ''">
              <i :class="section.icon" />
              <span v-if="isExpandedContent" v-html="highlightText(section.label)"></span>
              <i v-if="isExpandedContent" class="pi" :class="isSectionOpen(section.label) ? 'pi-chevron-down' : 'pi-chevron-right'" style="margin-left: auto; font-size: 0.875rem;"></i>
            </button>
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
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SidebarMenuItems from './SidebarMenuItems.vue';
import { useRoleStore } from '@/stores/role';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase';
import { countStudents } from '@/service/studentDirectoryService';
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
const sidebarScrollKey = 'adminSidebarScrollTop';

function saveSidebarScroll() {
  try {
    if (sidebarEl.value) {
      sessionStorage.setItem(sidebarScrollKey, String(sidebarEl.value.scrollTop));
    }
  } catch (e) {
    console.warn('Erreur sauvegarde scroll sidebar:', e);
  }
}

async function restoreSidebarScroll() {
  try {
    await nextTick();
    const saved = sessionStorage.getItem(sidebarScrollKey);
    if (saved && sidebarEl.value) {
      sidebarEl.value.scrollTop = Number(saved);
    }
  } catch (e) {
    console.warn('Erreur restauration scroll sidebar:', e);
  }
}

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

// Les utilisateurs avec ce rôle conceptuel ne voient que les sections académiques.
const isRestrictedUser = computed(() => roleStore.can('academic.restricted'));

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
    if (item.hidden) continue;
    // Exclure uniquement un éventuel legacy label "Académique"
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

async function loadMenuCounts() {
  try {
    const [studentsCount, institutionsRes, praticiensRes, placesRes] = await Promise.all([
      countStudents(),
      supabase
        .from('institutions')
        .select('InstitutionId', { count: 'exact', head: true }),
      supabase
        .from('praticiens_formateurs')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('places')
        .select('PlaceId', { count: 'exact', head: true }),
    ]);

    menuCounts.value = {
      ...menuCounts.value,
      '/admin/formation-pratique/etudiants': studentsCount,
      '/admin/formation-pratique/institutions': institutionsRes?.count || 0,
      '/admin/formation-pratique/praticiens-formateur': praticiensRes?.count || 0,
      '/admin/formation-pratique/places': placesRes?.count || 0,
    };
  } catch (error) {
    console.warn('Erreur chargement badges menu:', error);
  }
}

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

// Obtenir la classe CSS pour une section selon son index
function getSectionClass(section) {
  const label = String(section?.label || '').toLowerCase();
  if (label === 'admin général') return 'admin-general-section';
  if (label === 'physiothérapie') return 'physio-section';
  if (label === 'soins infirmiers' || label === 'académique') return 'academic-section';
  if (label === 'général') return 'tools-section';
  return '';
}

// Déterminer si une section doit être affichée
function shouldShowSection(section) {
  if (!isSupabaseUser.value) return false;
  
  const label = String(section?.label || '').toLowerCase();
  
  if (isRestrictedUser.value) {
    // Ces utilisateurs ne peuvent accéder qu'à la section Soins Infirmiers
    return label === 'soins infirmiers' || label === 'académique';
  }
  
  switch (label) {
    case 'admin général': // Admin Général - super.all OU admin
      return roleStore.isSuper || roleStore.can('super.all') || roleStore.can('admin')|| roleStore.can('page1.access');
    case 'physiothérapie': // Physiothérapie & Gamification
      return (
        roleStore.can('page1.access') ||
        roleStore.can('AdminPhysio') ||
        roleStore.can('EnseignantPhysio') ||
        roleStore.can('FormationPratique') ||
        roleStore.can('admin') ||
        roleStore.can('super.all') ||
        roleStore.isSuper
      );
    case 'soins infirmiers': // Soins Infirmiers / Académique
    case 'académique':
      return (
        roleStore.can('academic.restricted') ||
        roleStore.can('page2.access') ||
        roleStore.can('AdminSoins') ||
        roleStore.can('EnseignantSoins') ||
        roleStore.can('RMSoins') ||
        roleStore.isSuper
      );
    case 'général': // Outils transversaux
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

  await loadMenuCounts();

  await restoreSidebarScroll();
});

onBeforeUnmount(() => {
  saveSidebarScroll();
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
  min-height: 2.75rem;
  padding: 0.625rem 0.75rem;
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
  border: 1px solid var(--surface-border, rgba(148, 163, 184, 0.2));
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
  gap: 0.625rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  color: var(--text-color);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.975rem;
  line-height: 1.2;
  margin-bottom: 0.25rem;
}

.sidebar-section-label:hover {
  background: var(--surface-hover);
}

.sidebar-section-label:focus-visible,
.collapse-toggle:focus-visible,
.search-input:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.sidebar-divider {
  height: 1px;
  background: var(--surface-border, #eee);
  margin: 1rem 0;
  border-radius: 2px;
}

.sidebar-submenu {
  margin: 0 0 0.25rem 0.5rem;
  padding-left: 0.375rem;
  border-left: 1px solid var(--surface-border, rgba(148, 163, 184, 0.24));
}

.sidebar-section-card {
  background: transparent;
  border-radius: 0.75rem;
  box-shadow: none;
  padding: 0.25rem 0;
  width: 100%;
}

.admin-general-section,
.pfp-section,
.academic-section {
  margin-bottom: 0.75rem;
}


/* Bouton de collapse dans la topbar */
.collapse-toggle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: 2px solid var(--surface-card);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, transform 0.2s ease;
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
