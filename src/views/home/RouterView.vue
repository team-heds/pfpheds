<template>
  <div class="router-inspector">
    <h2>📚 Catalogue des routes</h2>

    <div class="toolbar">
      <input v-model="q" placeholder="Filtrer par nom, chemin ou permission (need)" />
      <label class="toggle">
        <input type="checkbox" v-model="onlyProtected" />
        <span>Uniquement routes protégées (avec need)</span>
      </label>
    </div>

    <div class="legend">
      <span class="chip you">Vous avez accès</span>
      <span class="chip no">Accès refusé</span>
      <span class="chip open">Route ouverte</span>
    </div>

    <table class="routes-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Chemin</th>
          <th>Permission (meta.need)</th>
          <th>Rôles pertinents</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in filteredRoutes" :key="r.name + r.path">
          <td>{{ r.name || '—' }}</td>
          <td><code>{{ r.path }}</code></td>
          <td>
            <span v-if="r.need"><code>{{ r.need }}</code></span>
            <span v-else class="muted">—</span>
          </td>
          <td>
            <div class="roles">
              <span v-for="role in rolesFor(r.need)" :key="role" class="role-chip">{{ role }}</span>
            </div>
          </td>
          <td>
            <span v-if="!r.need" class="chip open">Ouverte</span>
            <span v-else-if="roleStore.can(r.need) || roleStore.isSuper" class="chip you">Autorisé</span>
            <span v-else class="chip no">Refusé</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRoleStore } from '@/stores/role';

const router = useRouter();
const roleStore = useRoleStore();

// Recherche / filtres
const q = ref('');
const onlyProtected = ref(false);

// Récupérer toutes les routes déclarées
const routes = computed(() => {
  return router.getRoutes()
    .filter(r => !!r.path) // écarter les alias internes
    .map(r => {
      // Agréger besoins (need) des records matchés
      const needs = (r.meta?.need ? [r.meta.need] : []);
      return {
        name: r.name || '',
        path: r.path,
        need: needs[0] || null,
      };
    })
    // dédoublonner par path
    .reduce((acc, cur) => {
      if (!acc.find(x => x.path === cur.path)) acc.push(cur);
      return acc;
    }, []);
});

const filteredRoutes = computed(() => {
  const term = q.value.trim().toLowerCase();
  return routes.value.filter(r => {
    if (onlyProtected.value && !r.need) return false;
    if (!term) return true;
    return (
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.path && r.path.toLowerCase().includes(term)) ||
      (r.need && r.need.toLowerCase().includes(term))
    );
  }).sort((a, b) => a.path.localeCompare(b.path));
});

// Cartographie indicative des rôles pertinents par besoin
const KNOWN_ROLES = [
  'super.all',
  'admin',
  'page1.access',
  'page2.access',
  'AdminSoins',
  'AdminPhysio',
  'EnseignantSoins',
  'EnseignantPhysio',
  'EtudiantSoins',
  'EtudiantPhysio',
  'RMSoins'
];

function rolesFor(need) {
  if (!need) return [];
  // Toujours super.all valable
  const list = ['super.all'];
  // Ajouter le besoin lui-même s'il ressemble à un rôle connu
  if (KNOWN_ROLES.includes(need)) list.push(need);
  // Mapping custom: regrouper par familles si pertinent
  if (need === 'page1.access') list.push('AdminPhysio', 'EnseignantPhysio');
  if (need === 'page2.access') list.push('AdminSoins', 'EnseignantSoins', 'RMSoins');
  if (need === 'admin') list.push('admin');
  return Array.from(new Set(list));
}
</script>

<style scoped>
.router-inspector { padding: 1.25rem; }
.toolbar { display: flex; gap: .75rem; align-items: center; margin: .75rem 0 1rem; }
.toolbar input { flex: 1; padding: .5rem .75rem; border: 1px solid var(--surface-border); border-radius: .5rem; background: var(--surface-card); color: var(--text-color); }
.toggle { display: flex; align-items: center; gap: .5rem; color: var(--text-color-secondary); }

.legend { display: flex; gap: .5rem; margin-bottom: .5rem; }
.chip { padding: .15rem .5rem; border-radius: 1rem; font-size: .8rem; }
.chip.you { background: #16a34a; color: #fff; }
.chip.no { background: #ef4444; color: #fff; }
.chip.open { background: #0369a1; color: #fff; }

.routes-table { width: 100%; border-collapse: collapse; }
.routes-table th, .routes-table td { padding: .6rem .5rem; border-bottom: 1px solid var(--surface-border); text-align: left; }
.routes-table thead th { color: var(--text-color); font-weight: 700; }
.muted { color: var(--text-color-secondary); }
.roles { display: flex; flex-wrap: wrap; gap: .25rem; }
.role-chip { background: var(--surface-200); color: var(--text-color); padding: .1rem .5rem; border-radius: .75rem; font-size: .75rem; }
code { background: var(--surface-200); padding: .1rem .3rem; border-radius: .25rem; }
</style>
