<template>
  <AdminLayout>
    <ConfirmDialog />
    <div class="admin-table-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Institutions</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-building text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Institutions</h1>
              <p class="text-600 m-0 mt-2">Liste des institutions</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <Dropdown
              v-model="filterCanton"
              :options="cantonOptions"
              placeholder="Tous les cantons"
              showClear
              class="w-10rem"
            />
            <Dropdown
              v-model="filterLocality"
              :options="localityOptions"
              placeholder="Toutes les localités"
              showClear
              filter
              class="w-12rem"
            />
            <Button icon="pi pi-refresh" outlined :disabled="loading" @click="loadInstitutions" />
          </div>
        </div>
        <ProgressBar v-if="loading" mode="indeterminate" style="height: 4px" class="mt-3" />
      </div>

      <div class="grid mb-3" v-if="globalKpisReady">
        <div class="col-6 md:col-3" v-for="kpi in globalKpis" :key="kpi.label">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold" :class="kpi.colorClass">{{ kpi.value }}</div>
            <div class="text-600 text-sm mt-1">{{ kpi.label }}</div>
          </div>
        </div>
      </div>
      <div class="grid mb-3" v-if="institutions.length">
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-blue-400">{{ institutions.length }}</div>
            <div class="text-600 text-sm mt-1">Institutions</div>
          </div>
        </div>
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-green-400">{{ cantonOptions.length }}</div>
            <div class="text-600 text-sm mt-1">Cantons</div>
          </div>
        </div>
        <div class="col-6 md:col-4">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold text-yellow-400">{{ allLocalityCount }}</div>
            <div class="text-600 text-sm mt-1">Localités</div>
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <DataTableToolbar v-model:query="searchTerm" :result-count="filteredInstitutions.length" placeholder="Rechercher une institution…">
          <template #primary><Button icon="pi pi-plus" label="Ajouter" outlined @click="goToInstitutionForm" /></template>
          <template #tools><Button icon="pi pi-file-excel" label="Excel" outlined severity="success" @click="exportExcel" /><Button icon="pi pi-filter-slash" label="Réinitialiser" outlined severity="secondary" @click="resetFilters" /></template>
        </DataTableToolbar>
        <DataTable
          :value="filteredInstitutions"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[20, 30, 50]"
          dataKey="InstitutionId"
          :rowHover="true"
          :loading="loading"
          sortMode="multiple"
          :multiSortMeta="multiSortMeta"
          :scrollable="true"
          scrollHeight="65vh"
        >
          <template #empty>Aucune institution trouvée.</template>
          <template #loading> Chargement des données... </template>

          <Column field="Name" header="Nom" :sortable="true" style="min-width: 14rem"></Column>
          <Column field="Address" header="Adresse" style="min-width: 12rem"></Column>
          <Column field="Locality" header="Localité" :sortable="true" style="min-width: 8rem"></Column>
          <Column field="Canton" header="Canton" :sortable="true" style="min-width: 6rem">
            <template #body="{ data }">
              <Tag v-if="data.Canton" :value="data.Canton" severity="info" />
              <span v-else class="text-400">—</span>
            </template>
          </Column>
          <Column header="Visibilité" style="min-width: 8rem">
            <template #body="{ data }">
              <Tag
                :value="data.is_hidden ? 'Masquée' : 'Visible'"
                :severity="data.is_hidden ? 'warning' : 'success'"
              />
            </template>
          </Column>

          <Column header="Actions" style="min-width: 10rem">
            <template #body="{ data }">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-info mr-2" size="small" v-tooltip.top="'Voir détails'" @click="goToDetails(data.InstitutionId)" />
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" size="small" v-tooltip.top="'Modifier'" @click="goToInstitutionFormModif(data.InstitutionId)" />
              <Button
                :icon="data.is_hidden ? 'pi pi-eye' : 'pi pi-eye-slash'"
                :class="data.is_hidden ? 'p-button-rounded p-button-warning mr-2' : 'p-button-rounded p-button-secondary mr-2'"
                size="small"
                :title="data.is_hidden ? 'Réafficher' : 'Masquer sans supprimer'"
                @click="toggleHidden(data)"
              />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" v-tooltip.top="'Supprimer'" @click="handleDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useInstitutionsStore } from '@/stores/institutionsStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import ConfirmDialog from 'primevue/confirmdialog';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import DataTableToolbar from '@/components/common/tables/DataTableToolbar.vue';
import { supabase } from '@/supabase';
import { getAllStudents } from '@/service/studentDirectoryService';

const router = useRouter();
const institutionsStore = useInstitutionsStore();
const toast = useToast();
const confirm = useConfirm();

const searchTerm = ref('');
const debouncedSearchTerm = ref('');
const filterCanton = ref(null);
const filterLocality = ref(null);
const loading = computed(() => institutionsStore.loading);
const multiSortMeta = ref([{ field: 'Name', order: 1 }]);
const FILTERS_KEY = 'fp_phy_institutions_filters';
const globalKpisReady = ref(false)
const globalKpisData = ref({ activeStudents: 0, openPlaces: 0, publishedAssignments: 0, incompleteFiles: 0 })

let searchDebounceTimer = null
watch(searchTerm, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchTerm.value = val
  }, 250)
}, { immediate: true })

try {
  const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}');
  if (typeof saved.searchTerm === 'string') searchTerm.value = saved.searchTerm;
  if (typeof saved.filterCanton === 'string' || saved.filterCanton === null) filterCanton.value = saved.filterCanton;
  if (typeof saved.filterLocality === 'string' || saved.filterLocality === null) filterLocality.value = saved.filterLocality;
  if (Array.isArray(saved.multiSortMeta) && saved.multiSortMeta.length) multiSortMeta.value = saved.multiSortMeta;
} catch {
  localStorage.removeItem(FILTERS_KEY);
}

const institutions = computed(() => institutionsStore.institutions);

const cantonOptions = computed(() => {
  const set = new Set()
  ;(institutions.value || []).forEach(i => { if (i.Canton) set.add(i.Canton) })
  return [...set].sort()
});

const localityOptions = computed(() => {
  let list = institutions.value || []
  if (filterCanton.value) list = list.filter(i => i.Canton === filterCanton.value)
  const set = new Set()
  list.forEach(i => { if (i.Locality) set.add(i.Locality) })
  return [...set].sort()
});

const allLocalityCount = computed(() => {
  const set = new Set()
  ;(institutions.value || []).forEach(i => {
    if (i.Locality) set.add(i.Locality)
  })
  return set.size
});

const globalKpis = computed(() => ([
  { label: 'Étudiants actifs', value: globalKpisData.value.activeStudents, colorClass: 'text-green-400' },
  { label: 'Places ouvertes', value: globalKpisData.value.openPlaces, colorClass: 'text-blue-400' },
  { label: 'Attributions publiées', value: globalKpisData.value.publishedAssignments, colorClass: 'text-yellow-400' },
  { label: 'Dossiers incomplets', value: globalKpisData.value.incompleteFiles, colorClass: 'text-red-400' },
]))

async function loadGlobalKpis() {
  try {
    const [profiles, placesRes, assignmentsRes] = await Promise.all([
      getAllStudents(),
      supabase.from('places').select('PlaceId, InstitutionId, NomPlace'),
      supabase.from('student_result_vote').select('id').eq('status', 'published'),
    ])

    const activeStudents = profiles.filter((p) => p.is_active !== false).length
    const incompleteFiles = profiles.filter((p) => !p.family_name || !p.forname || !p.email || !p.Classe).length
    const places = placesRes.data || []
    const openPlaces = places.filter((p) => p.InstitutionId && p.NomPlace).length

    globalKpisData.value = {
      activeStudents,
      openPlaces,
      publishedAssignments: (assignmentsRes.data || []).length,
      incompleteFiles,
    }
  } catch (error) {
    console.warn('Erreur chargement KPI globaux institutions:', error)
  } finally {
    globalKpisReady.value = true
  }
}

const filteredInstitutions = computed(() => {
  let list = institutions.value || [];

  if (filterCanton.value) {
    list = list.filter(i => i.Canton === filterCanton.value);
  }
  if (filterLocality.value) {
    list = list.filter(i => i.Locality === filterLocality.value);
  }
  if (debouncedSearchTerm.value.trim()) {
    const q = debouncedSearchTerm.value.trim().toLowerCase();
    list = list.filter(i =>
      (i.Name || '').toLowerCase().includes(q) ||
      (i.Address || '').toLowerCase().includes(q) ||
      (i.Locality || '').toLowerCase().includes(q) ||
      (i.Canton || '').toLowerCase().includes(q) ||
      (i.repondant_hes_name || '').toLowerCase().includes(q) ||
      (i.repondant_hes_email || '').toLowerCase().includes(q)
    );
  }

  return list;
});

const loadInstitutions = () => institutionsStore.fetchInstitutions();

watch([searchTerm, filterCanton, filterLocality, multiSortMeta], () => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({
      searchTerm: searchTerm.value,
      filterCanton: filterCanton.value,
      filterLocality: filterLocality.value,
      multiSortMeta: multiSortMeta.value,
    }))
  } catch (e) {
    console.warn('Erreur sauvegarde filtres institutions:', e)
  }
})

function resetFilters() {
  searchTerm.value = ''
  filterCanton.value = null
  filterLocality.value = null
  multiSortMeta.value = [{ field: 'Name', order: 1 }]
  try {
    localStorage.removeItem(FILTERS_KEY)
  } catch (e) {
    console.warn('Erreur reset filtres institutions:', e)
  }
}

onMounted(() => {
  loadInstitutions();
  loadGlobalKpis();
});

const toggleHidden = async (inst) => {
  const nextHidden = !inst.is_hidden
  try {
    await institutionsStore.updateInstitution(inst.InstitutionId, {
      is_hidden: nextHidden
    })
    toast.add({
      severity: 'success',
      summary: 'Visibilité mise à jour',
      detail: nextHidden
        ? `L'institution "${inst.Name}" est maintenant masquée des vues publiques.`
        : `L'institution "${inst.Name}" est de nouveau visible publiquement.`,
      life: 3000
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Mise à jour impossible',
      detail: error?.message || 'Impossible de modifier la visibilité.',
      life: 4000
    })
  }
}

const handleDelete = (inst) => {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer l'institution "${inst.Name}" ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: async () => {
      try {
        await institutionsStore.deleteInstitution(inst.InstitutionId);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Institution supprimée.', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Suppression impossible', detail: error?.message || 'Cette institution est peut-être liée à des places existantes.', life: 4000 });
      }
    }
  });
};

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const data = filteredInstitutions.value.map(i => ({
    Nom: i.Name || '',
    Adresse: i.Address || '',
    Localité: i.Locality || '',
    Canton: i.Canton || ''
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Institutions')
  const parts = ['institutions']
  if (filterCanton.value) parts.push(filterCanton.value)
  if (filterLocality.value) parts.push(filterLocality.value)
  XLSX.writeFile(wb, `${parts.join('_')}.xlsx`)
};

const goToInstitutionForm = () => router.push({ name: 'InstitutionForm' });
const goToInstitutionFormModif = (id) => router.push({ name: 'InstitutionFormModif', params: { id } });
const goToDetails = (id) => router.push({ name: 'InstitutionView', params: { id } });
</script>

<style>
@import '@/assets/styles/fp-dark.css';
.admin-table-page { min-width:0; }
.admin-table-page .p-datatable-wrapper { max-width:100%; }
@media (max-width: 48rem) {
  .admin-table-page { padding:.75rem !important; }
  .admin-table-page > .surface-card { padding:1rem !important; }
  .admin-table-page .p-dropdown { width:100% !important; }
  .admin-table-page .p-paginator { justify-content:flex-start; overflow-x:auto; flex-wrap:nowrap; }
}
</style>
