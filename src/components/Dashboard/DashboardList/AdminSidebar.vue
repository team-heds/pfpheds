<template>
  <aside class="admin-sidebar card sidebar">
    <div class="sidebar-card-listes">
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li class="sidebar-section">
            <div class="sidebar-section-label">
              <i :class="menu[0].icon" />
              <span>{{ menu[0].label }}</span>
            </div>
            <ul v-if="menu[0].items" class="sidebar-submenu">
              <SidebarMenuItems :items="menu[0].items" />
            </ul>
          </li>
        </ul>
      </nav>
    </div>
    <div class="sidebar-card-outils">
      <nav class="sidebar-nav">
        <ul class="sidebar-menu">
          <li class="sidebar-section">
            <div class="sidebar-section-label">
              <i :class="menu[1].icon" />
              <span>{{ menu[1].label }}</span>
            </div>
            <ul v-if="menu[1].items" class="sidebar-submenu">
              <SidebarMenuItems :items="menu[1].items" />
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import SidebarMenuItems from './SidebarMenuItems.vue';

const menu = ref([
  {
    label: 'Listes',
    icon: 'pi pi-home',
    items: [
      { label: 'Étudiant', icon: 'pi pi-users', to: '/etudiant_list' },
      { label: 'Profil Users Admin', icon: 'pi pi-users', to: '/profilAdmin/4qoWztDujictoqTEJvJK6xF1Zcr1' },
      { label: 'Institution', icon: 'pi pi-home', to: '/institution_list' },
      { label: 'Enseignant', icon: 'pi pi-flag', to: '/enseignent_list' },
      { label: 'Praticien formateur', icon: 'pi pi-check-circle', to: '/praticien_formateur_list' },
      { label: 'Utilisateur', icon: 'pi pi-user', to: '/user_list' },
    ]
  },
  {
    label: 'Outils',
    icon: 'pi pi-fw pi-cog',
    items: [
      {
        label: 'Votation',
        icon: 'pi pi-check-square',
        items: [
          { label: 'Management Offres', icon: 'pi pi-cog', to: '/management_offre' },
          { label: 'Management Votation Lese', icon: 'pi pi-cog', to: '/management_votation_lese' },
          { label: 'Management Votation Etudiant', icon: 'pi pi-cog', to: '/management_votation_etudiants' },
          { label: 'Places assigned', icon: 'pi pi-fw pi-image', to: '/places_asssigned' },
          { label: 'Places Assignement', icon: 'pi pi-fw pi-image', to: '/places_assignment' },
          { label: 'Result Votation Preview', icon: 'pi pi-cog', to: '/result_preview_votation' }
        ]
      },
      {
        label: 'PFP',
        icon: 'pi pi-fw pi-comment',
        items: [
          { label: 'Management PFP EN cours', icon: 'pi pi-fw pi-image', to: '/management_pfpencours' },
          { label: 'Création PFP', icon: 'pi pi-fw pi-image', to: '/pfp_details' },
          { label: 'Gantt PFP', icon: 'pi pi-fw pi-image', to: '/gantt' },
          { label: 'Management Places', icon: 'pi pi-cog', to: '/git commitmanagement_places' },
          { label: 'Management Places Safe', icon: 'pi pi-cog', to: '/management_places_safe' },
          { label: 'Stage Repartition', icon: 'pi pi-cog', to: '/stage_repartition' },
          { label: 'Validation PFP1A', icon: 'pi pi-cog', to: '/validate-pfp1a' }
        ]
      },
      {
        label: 'Répondant HES',
        icon: 'pi pi-fw pi-comment',
        items: [
          { label: 'Management Répondant HES', icon: 'pi pi-fw pi-image', to: '/management_repondant' },
          { label: 'Informations Répondant HES', icon: 'pi pi-fw pi-image', to: '/info_repondant' }
        ]
      },
      { label: 'Export Excel', icon: 'pi pi-file-excel', to: '/export_excel' },
        { label: 'Rapports', icon: 'pi pi-chart-bar', to: '/rapports' },
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
  font-weight: bold;
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

.sidebar-card-listes,
.sidebar-card-outils {
  background: var(--surface-card);
  border-radius: 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1.2rem 1rem 1.2rem 1rem;
  width: 100%;
}

.sidebar-card-outils {
  margin-top: 1.5rem;
}
</style>
