<template>
  <TheNavbar />

  <div class="planning-home">
    <header class="planning-home__header">
      <h1>Planning</h1>
      <p>Consultez le calendrier de formation par semaine, semestre, module ou enseignant.</p>
    </header>

    <PlanningLegend class="planning-home__legend" />

    <nav class="planning-home__links" aria-label="Vues du planning">
      <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="planning-home__link">
        <i :class="['pi', link.icon]" aria-hidden="true"></i>
        <span>
          <strong>{{ link.label }}</strong>
          <small>{{ link.description }}</small>
        </span>
        <i class="pi pi-chevron-right" aria-hidden="true"></i>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import TheNavbar from '@/components/TheNavbar.vue'
import PlanningLegend from '@/components/common/planning/PlanningLegend.vue'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()

const READ_LINKS = [
  { to: '/calendar/full', icon: 'pi-calendar', label: 'Calendrier complet', description: 'La formation à temps plein, semaine par semaine' },
  { to: '/calendar/semester', icon: 'pi-list', label: 'Par semestre', description: 'Les semaines d’un semestre' },
  { to: '/calendar/module', icon: 'pi-th-large', label: 'Par module', description: 'Le planning d’un module' },
  { to: '/calendar/teacher', icon: 'pi-users', label: 'Par enseignant', description: 'Le planning d’un enseignant' },
  { to: '/calendar/my-courses', icon: 'pi-book', label: 'Tous les cours', description: 'Les cours, leur module et leur horaire' },
  { to: '/calendar/my-modules', icon: 'pi-sitemap', label: 'Tous les modules', description: 'La liste des modules' },
]

const ADMIN_LINK = { to: '/calendar/admin', icon: 'pi-cog', label: 'Administration', description: 'Modifier le calendrier de formation' }

const links = computed(() => (roleStore.can('admin') ? [...READ_LINKS, ADMIN_LINK] : READ_LINKS))
</script>

<style scoped>
.planning-home {
  width: min(100%, 60rem);
  margin-inline: auto;
  padding: var(--app-space-6);
}

.planning-home__header h1 {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.75rem;
  font-weight: var(--app-font-weight-semibold);
  line-height: 1.2;
}

.planning-home__header p {
  margin: var(--app-space-2) 0 0;
  color: var(--app-color-text-muted);
}

.planning-home__legend {
  margin-block: var(--app-space-6);
}

.planning-home__links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--app-space-4);
}

.planning-home__link {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  min-height: 4.5rem;
  padding: var(--app-space-4);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  color: var(--app-color-text);
  background: var(--app-color-surface);
  text-decoration: none;
  transition: background-color var(--app-duration-fast) var(--app-ease-standard);
}

.planning-home__link:hover {
  background: var(--app-color-hover);
}

.planning-home__link > span {
  display: grid;
  flex: 1;
  gap: 0.125rem;
  min-width: 0;
}

.planning-home__link strong {
  font-weight: var(--app-font-weight-semibold);
}

.planning-home__link small {
  color: var(--app-color-text-muted);
  font-size: var(--app-font-size-xs);
}

.planning-home__link > .pi:last-child {
  color: var(--app-color-text-muted);
  font-size: var(--app-font-size-xs);
}

@media (max-width: 40rem) {
  .planning-home {
    padding: var(--app-space-4);
  }
}
</style>
