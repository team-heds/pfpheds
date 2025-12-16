<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        title="Feedbacka"
        subtitle="Centre de pilotage des fiches auto-corrigées"
        icon="pi pi-comments"
      />
    </template>

    <div class="feedbacka-list">
      <div class="list-header">
        <div class="search-bar">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchQuery" placeholder="Rechercher..." />
          </span>
        </div>
        <div class="list-actions">
          <Button label="Nouvelle fiche" icon="pi pi-plus" @click="goCreate" />
        </div>
      </div>

      <div class="filters-bar">
        <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Statut" showClear />
      </div>

      <DataTable
        :value="filtered"
        :paginator="true"
        :rows="10"
        :loading="loading"
        stripedRows
        responsiveLayout="scroll"
        class="clickable-rows"
        @row-click="onRowClick"
      >
        <Column field="title" header="Titre" sortable />
        <Column field="status" header="Statut" sortable>
          <template #body="{ data }">
            <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="Réponses">
          <template #body="{ data }">
            <span>{{ data?.feedbacka_submissions?.[0]?.count ?? 0 }}</span>
          </template>
        </Column>
        <Column field="created_at" header="Créé" sortable>
          <template #body="{ data }">
            {{ formatDate(data.created_at) }}
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <div class="action-buttons">
              <Button icon="pi pi-pencil" class="p-button-sm p-button-text" v-tooltip.top="'Éditer'" @click.stop="goEdit(data)" />
              <Button icon="pi pi-eye" class="p-button-sm p-button-text" v-tooltip.top="'Ouvrir (étudiant)'" @click.stop="goStudent(data)" />
              <Button icon="pi pi-copy" class="p-button-sm p-button-text" v-tooltip.top="'Dupliquer'" @click.stop="duplicate(data)" />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="!loading && feedbackas.length === 0" class="empty-state">
        <i class="pi pi-inbox"></i>
        <p>Aucune fiche pour l'instant</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import { useFeedbackaStore } from '@/stores/feedbackaStore';

const router = useRouter();
const authStore = useAuthStore();
const store = useFeedbackaStore();

const loading = computed(() => store.loading);
const feedbackas = computed(() => store.feedbackas);

const searchQuery = ref('');
const filterStatus = ref(null);

const statusOptions = [
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' },
  { label: 'Archivé', value: 'archived' },
];

const filtered = computed(() => {
  let items = feedbackas.value || [];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter(i => (i.title || '').toLowerCase().includes(q) || (i.question || '').toLowerCase().includes(q));
  }

  if (filterStatus.value) {
    items = items.filter(i => i.status === filterStatus.value);
  }

  return items;
});

onMounted(async () => {
  const userId = authStore.isFirebaseUser ? authStore.user?.uid : authStore.user?.id;
  await store.fetchFeedbackas({ author_id: userId });
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

function getStatusLabel(status) {
  const labels = { draft: 'Brouillon', published: 'Publié', archived: 'Archivé' };
  return labels[status] || status;
}

function getStatusSeverity(status) {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return null;
    default:
      return null;
  }
}

function onRowClick(evt) {
  const data = evt?.data;
  if (!data?.id) return;
  goEdit(data);
}

function goCreate() {
  router.push('/admin/tools/feedbacka/create');
}

function goEdit(item) {
  router.push(`/admin/tools/feedbacka/${item.id}/edit`);
}

function goStudent(item) {
  router.push(`/feedbacka/${item.id}`);
}

async function duplicate(item) {
  const userId = authStore.isFirebaseUser ? authStore.user?.uid : authStore.user?.id;
  const payload = {
    ...item,
    id: undefined,
    status: 'draft',
    title: `${item.title} (copie)`,
    author_id: userId,
    created_at: undefined,
    updated_at: undefined,
  };
  await store.createFeedbacka(payload);
  await store.fetchFeedbackas({ author_id: userId });
}
</script>

<style scoped>
.feedbacka-list {
  padding: 2rem;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  flex: 1;
  max-width: 520px;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 2.25rem;
  opacity: 0.35;
  display: block;
  margin-bottom: 0.5rem;
}

.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

@media (max-width: 900px) {
  .feedbacka-list {
    padding: 1.25rem;
  }
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-bar {
    max-width: none;
  }
}
</style>
