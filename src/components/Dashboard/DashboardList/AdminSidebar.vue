<template>
  <aside class="admin-sidebar card">
    <div class="sidebar-header">
      <div class="admin-name">Dashboard Admin</div>
    </div>
    <nav class="sidebar-nav">
      <ul class="sidebar-menu">
        <template v-for="(section, idx) in menu" :key="section.label">
          <li class="sidebar-section">
            <div class="sidebar-section-label">
              <i :class="section.icon" />
              <span>{{ section.label }}</span>
            </div>
            <ul v-if="section.items" class="sidebar-submenu">
              <SidebarMenuItems :items="section.items" />
            </ul>
          </li>
          <li v-if="idx < menu.length - 1" class="sidebar-divider"></li>
        </template>
      </ul>
    </nav>
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
          { label: 'Management Places', icon: 'pi pi-cog', to: '/management_places' },
          { label: 'Management Places Safe', icon: 'pi pi-cog', to: '/management_places_safe' },
          { label: 'Stage Repartition', icon: 'pi pi-cog', to: '/stage_repartition' }
        ]
      },
      { label: 'Export Excel', icon: 'pi pi-file-excel', to: '/export_excel' },
      { label: 'Rapports', icon: 'pi pi-chart-bar', to: '/rapports' },
    ]
  }
]);
</script>

<style scoped>
.admin-sidebar {
  width: 260px;
  min-height: 100vh;
  background: var(--surface-card);
  box-shadow: 0 0 8px 0 rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0.5rem;
  position: relative;
}
.sidebar-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
}
.admin-name {
  font-weight: 700;
  font-size: 1.2rem;
  color: #ffffff
;
  letter-spacing: 1px;
}
.sidebar-nav {
  flex: 1;
}
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}
.sidebar-section {
  margin-bottom: 0.5rem;
}
.sidebar-section-label {
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: var(--surface-section);
}
.sidebar-divider {
  height: 1px;
  background: var(--surface-border);
  margin: 1rem 0;
  border-radius: 1px;
}
.sidebar-submenu {
  list-style: none;
  padding-left: 1.2rem;
}
</style>
