<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        title="Éditer une fiche Feedbacka"
        subtitle="Ajuste la question, les critères, le prompt et publie"
        icon="pi pi-pencil"
      />
    </template>

    <div class="feedbacka-edit" v-if="loaded">
      <div class="top-actions">
        <Button label="Retour" icon="pi pi-arrow-left" class="p-button-text" @click="goBack" />
        <div class="right">
          <Tag :value="getStatusLabel(form.status)" :severity="getStatusSeverity(form.status)" />
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-info-circle"></i> Question</h3>

        <div class="form-grid">
          <div class="form-field full-width">
            <label>Titre *</label>
            <InputText v-model="form.title" />
          </div>

          <div class="form-field full-width">
            <label>Question *</label>
            <Textarea v-model="form.question" rows="4" />
          </div>

          <div class="form-field full-width">
            <label>Contexte</label>
            <Textarea v-model="form.context" rows="3" />
          </div>

          <div class="form-field full-width">
            <label>Consignes</label>
            <Textarea v-model="form.instructions" rows="3" />
          </div>
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-sliders-h"></i> Correction IA</h3>

        <div class="form-grid">
          <div class="form-field full-width">
            <label>Prompt de correction</label>
            <Textarea v-model="form.correction_prompt" rows="5" />
          </div>

          <div class="form-field full-width">
            <label>Exemple de réponse attendue</label>
            <Textarea v-model="form.expected_answer" rows="5" />
          </div>

          <div class="form-field full-width">
            <label>Critères (un par ligne)</label>
            <Textarea v-model="criteriaText" rows="5" />
          </div>

          <div class="form-field">
            <label>Activer score</label>
            <div class="inline">
              <Checkbox v-model="form.scoring_enabled" :binary="true" />
              <span>Oui</span>
            </div>
          </div>

          <div class="form-field" v-if="form.scoring_enabled">
            <label>Score max</label>
            <InputNumber v-model="form.max_score" :min="1" :max="100" />
          </div>

          <div class="form-field">
            <label>Tonalité</label>
            <Dropdown v-model="form.tone" :options="toneOptions" optionLabel="label" optionValue="value" />
          </div>

          <div class="form-field">
            <label>Langue</label>
            <Dropdown v-model="form.language" :options="languageOptions" optionLabel="label" optionValue="value" />
          </div>
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-bolt"></i> Test rapide</h3>
        <div class="form-grid">
          <div class="form-field full-width">
            <label>Réponse fictive</label>
            <Textarea v-model="testAnswer" rows="5" placeholder="Colle une réponse pour tester..." />
          </div>
          <div class="form-field full-width">
            <Button label="Tester" icon="pi pi-play" class="p-button-outlined" :loading="loading" @click="runTest" />
          </div>

          <div v-if="testResult" class="test-result full-width">
            <h4>Résultat IA</h4>
            <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-users"></i> Soumissions</h3>
        <div class="sub-actions">
          <Button label="Rafraîchir" icon="pi pi-refresh" class="p-button-outlined" :loading="loading" @click="loadSubmissions" />
        </div>
        <DataTable :value="submissions" :paginator="true" :rows="10" :loading="loading" responsiveLayout="scroll">
          <Column field="created_at" header="Date">
            <template #body="{ data }">{{ formatDate(data.created_at) }}</template>
          </Column>
          <Column field="student_id" header="Étudiant" />
          <Column field="status" header="Statut">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="data.status === 'done' ? 'success' : data.status === 'pending' ? 'warning' : 'danger'" />
            </template>
          </Column>
          <Column field="score" header="Score" />
        </DataTable>
      </div>

      <div class="actions">
        <Button label="Enregistrer" icon="pi pi-save" :loading="loading" @click="save" />
        <Button v-if="form.status !== 'published'" label="Publier" icon="pi pi-upload" class="p-button-success" :loading="loading" @click="publish" />
        <Button v-if="form.status !== 'archived'" label="Archiver" icon="pi pi-box" class="p-button-outlined" :loading="loading" @click="archive" />
      </div>
    </div>

    <div v-else class="loading">
      <ProgressSpinner />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ProgressSpinner from 'primevue/progressspinner';
import { useFeedbackaStore } from '@/stores/feedbackaStore';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const store = useFeedbackaStore();
const authStore = useAuthStore();

const loading = computed(() => store.loading);
const submissions = computed(() => store.submissions);

const loaded = ref(false);

const form = ref({
  id: null,
  title: '',
  question: '',
  context: '',
  instructions: '',
  correction_prompt: '',
  expected_answer: '',
  criteria: [],
  status: 'draft',
  language: 'fr',
  scoring_enabled: false,
  max_score: 10,
  tone: 'bienveillant',
  author_id: null,
});

const criteriaText = ref('');
const testAnswer = ref('');
const testResult = ref(null);

const toneOptions = [
  { label: 'Bienveillant', value: 'bienveillant' },
  { label: 'Direct', value: 'direct' },
];

const languageOptions = [
  { label: 'Français', value: 'fr' },
  { label: 'Anglais', value: 'en' },
];

function getUserId() {
  return authStore.isFirebaseUser ? authStore.user?.uid : authStore.user?.id;
}

function normalizeCriteria() {
  const lines = String(criteriaText.value || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  form.value.criteria = lines;
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('fr-FR');
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

async function load() {
  const id = route.params.id;
  const userId = getUserId();

  const data = await store.fetchFeedbacka(id, { author_id: userId });
  if (!data) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: store.error || 'Chargement échoué', life: 4000 });
    return;
  }

  form.value = { ...form.value, ...data };
  criteriaText.value = (data.criteria || []).join('\n');

  loaded.value = true;
  await loadSubmissions();
}

async function save() {
  normalizeCriteria();
  const updated = await store.updateFeedbacka(form.value.id, { ...form.value });
  if (!updated) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: store.error || 'Enregistrement échoué', life: 4000 });
    return;
  }
  toast.add({ severity: 'success', summary: 'OK', detail: 'Enregistré', life: 2500 });
}

async function publish() {
  await store.updateFeedbacka(form.value.id, { status: 'published' });
  await load();
}

async function archive() {
  await store.updateFeedbacka(form.value.id, { status: 'archived' });
  await load();
}

async function runTest() {
  testResult.value = null;
  if (!testAnswer.value.trim()) return;
  const userId = getUserId();
  const result = await store.testFeedbacka(form.value.id, testAnswer.value, { author_id: userId });
  if (!result) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: store.error || 'Test échoué', life: 4000 });
    return;
  }
  testResult.value = result.ai_result;
}

async function loadSubmissions() {
  const userId = getUserId();
  store.current = { ...form.value, author_id: userId };
  await store.fetchSubmissions(form.value.id);
}

function goBack() {
  router.push('/admin/tools/feedbacka/list');
}

onMounted(load);
</script>

<style scoped>
.feedbacka-edit {
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
}

.top-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.form-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 1.25rem;
}

.form-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.form-card h4 {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}

.full-width {
  grid-column: 1 / -1;
}

.inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sub-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.test-result pre {
  background: var(--surface-ground);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
  padding: 1rem;
  border-radius: 0.75rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

@media (max-width: 900px) {
  .feedbacka-edit {
    padding: 1.25rem;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
