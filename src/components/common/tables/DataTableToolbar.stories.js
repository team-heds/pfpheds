import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Tag from 'primevue/tag'
import DataTableToolbar from './DataTableToolbar.vue'
import EmptyState from '@/components/common/states/EmptyState.vue'

const institutions = [
  { id: 'VS-101', name: 'Hôpital du Valais', locality: 'Sion', canton: 'VS', status: 'Partenaire' },
  { id: 'VD-204', name: 'CHUV', locality: 'Lausanne', canton: 'VD', status: 'Partenaire' },
  { id: 'GE-118', name: 'HUG', locality: 'Genève', canton: 'GE', status: 'À valider' },
  { id: 'FR-076', name: 'HFR Fribourg', locality: 'Fribourg', canton: 'FR', status: 'Partenaire' },
]

export default {
  title: 'Aperçus/Liste d’institutions',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export const ListeInteractive = {
  render: () => ({
    components: { Button, Column, DataTable, DataTableToolbar, EmptyState, Tag },
    setup() {
      const query = ref('')
      const activeFilters = ref([{ key: 'canton', label: 'Canton : Valais' }])
      const rows = computed(() => {
        const normalizedQuery = query.value.trim().toLocaleLowerCase('fr-CH')
        if (!normalizedQuery) return institutions
        return institutions.filter((item) => [item.name, item.locality, item.canton].some((value) => value.toLocaleLowerCase('fr-CH').includes(normalizedQuery)))
      })
      const removeFilter = (key) => { activeFilters.value = activeFilters.value.filter((filter) => filter.key !== key) }
      return { activeFilters, query, removeFilter, rows }
    },
    template: `
      <main style="min-width:0;min-height:100vh;overflow:hidden;padding:clamp(1rem,3vw,2rem);background:var(--surface-ground)">
        <div style="display:grid;min-width:0;gap:1.5rem;max-width:90rem;margin-inline:auto">
          <header>
            <h1 style="margin:0;font-size:var(--app-font-size-page-title)">Liste des institutions</h1>
            <p style="margin:.5rem 0 0;color:var(--text-color-secondary)">Recherchez, consultez et gérez les institutions partenaires.</p>
          </header>
          <DataTable class="storybook-data-table" :value="rows" data-key="id" paginator :rows="5" row-hover responsive-layout="scroll">
            <template #header>
              <DataTableToolbar v-model:query="query" :result-count="rows.length" :active-filters="activeFilters" placeholder="Rechercher une institution…" @remove-filter="removeFilter" @clear-filters="activeFilters = []">
                <template #primary><Button label="Ajouter une institution" icon="pi pi-plus" /></template>
                <template #tools><Button label="Exporter" icon="pi pi-download" outlined severity="secondary" /></template>
              </DataTableToolbar>
            </template>
            <template #empty><EmptyState title="Aucune institution trouvée" description="Modifiez votre recherche ou ajoutez une nouvelle institution." action-label="Ajouter une institution" /></template>
            <Column field="id" header="ID" />
            <Column field="name" header="Institution" />
            <Column field="locality" header="Localité" />
            <Column field="canton" header="Canton" />
            <Column header="Statut">
              <template #body="{ data }"><Tag :value="data.status" :severity="data.status === 'Partenaire' ? 'success' : 'warning'" /></template>
            </Column>
            <Column header="Actions">
              <template #body><div class="storybook-component-row" style="flex-wrap:nowrap"><Button label="Détails" size="small" outlined /><Button aria-label="Modifier" icon="pi pi-pencil" size="small" text /></div></template>
            </Column>
          </DataTable>
        </div>
      </main>
    `,
  }),
}

export const AucunResultat = {
  render: () => ({
    components: { Button, DataTableToolbar, EmptyState },
    setup() {
      const query = ref('Martigny')
      return { query }
    },
    template: `
      <div class="storybook-stack">
        <DataTableToolbar v-model:query="query" :result-count="0" placeholder="Rechercher une institution…">
          <template #primary><Button label="Ajouter une institution" icon="pi pi-plus" /></template>
        </DataTableToolbar>
        <div class="storybook-surface"><EmptyState title="Aucune institution trouvée" description="Modifiez votre recherche ou ajoutez une nouvelle institution." action-label="Ajouter une institution" /></div>
      </div>
    `,
  }),
}
