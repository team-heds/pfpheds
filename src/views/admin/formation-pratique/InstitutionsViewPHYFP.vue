<template>
  <AdminLayout>
    <ConfirmDialog />
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
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
            <InputText v-model="searchTerm" placeholder="Rechercher (nom, adresse, localité)" class="w-16rem" />
            <Button icon="pi pi-file-excel" label="Excel" outlined severity="success" @click="exportExcel" />
            <Button icon="pi pi-plus" label="Ajouter" outlined @click="goToInstitutionForm" />
            <Button icon="pi pi-refresh" outlined @click="loadInstitutions" />
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
        <div class="text-600 mb-2">{{ filteredInstitutions.length }} institution(s)</div>
        <DataTable
          :value="filteredInstitutions"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50]"
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

          <Column header="Actions" style="min-width: 10rem">
            <template #body="{ data }">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-info mr-2" size="small" v-tooltip.top="'Voir détails'" @click="goToDetails(data.InstitutionId)" />
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" size="small" v-tooltip.top="'Modifier'" @click="goToInstitutionFormModif(data.InstitutionId)" />
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
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';

const router = useRouter();
const institutionsStore = useInstitutionsStore();
const toast = useToast();
const confirm = useConfirm();

const searchTerm = ref('');
const filterCanton = ref(null);
const filterLocality = ref(null);
const loading = computed(() => institutionsStore.loading);
const multiSortMeta = ref([{ field: 'Name', order: 1 }]);
const FILTERS_KEY = 'fp_phy_institutions_filters';

try {
  const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}');
  if (typeof saved.searchTerm === 'string') searchTerm.value = saved.searchTerm;
  if (typeof saved.filterCanton === 'string' || saved.filterCanton === null) filterCanton.value = saved.filterCanton;
  if (typeof saved.filterLocality === 'string' || saved.filterLocality === null) filterLocality.value = saved.filterLocality;
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

const filteredInstitutions = computed(() => {
  let list = institutions.value || [];

  if (filterCanton.value) {
    list = list.filter(i => i.Canton === filterCanton.value);
  }
  if (filterLocality.value) {
    list = list.filter(i => i.Locality === filterLocality.value);
  }
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.trim().toLowerCase();
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

watch([searchTerm, filterCanton, filterLocality], () => {
  localStorage.setItem(FILTERS_KEY, JSON.stringify({
    searchTerm: searchTerm.value,
    filterCanton: filterCanton.value,
    filterLocality: filterLocality.value,
  }))
})

onMounted(() => {
  loadInstitutions();
});

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
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué.', life: 3000 });
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
</style>
