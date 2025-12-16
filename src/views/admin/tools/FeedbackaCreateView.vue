<template>
  <AdminLayout>
    <template #header>
      <PageHeader
        title="Créer une fiche Feedbacka"
        subtitle="Prépare une question ouverte auto-corrigée"
        icon="pi pi-plus-circle"
      />
    </template>

    <div class="feedbacka-create">
      <div class="form-card">
        <h3><i class="pi pi-info-circle"></i> Question</h3>

        <div class="form-grid">
          <div class="form-field full-width">
            <label>Titre *</label>
            <InputText v-model="form.title" placeholder="Ex: Analyse d'un cas clinique" />
          </div>

          <div class="form-field full-width">
            <label>Question *</label>
            <Textarea v-model="form.question" rows="4" placeholder="Énoncé de la question..." />
          </div>

          <div class="form-field full-width">
            <label>Contexte</label>
            <Textarea v-model="form.context" rows="3" placeholder="Contexte (optionnel)..." />
          </div>

          <div class="form-field full-width">
            <label>Consignes</label>
            <Textarea v-model="form.instructions" rows="3" placeholder="Consignes (optionnel)..." />
          </div>
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-sliders-h"></i> Correction IA</h3>

        <div class="form-grid">
          <div class="form-field full-width">
            <label>Prompt de correction</label>
            <Textarea v-model="form.correction_prompt" rows="5" placeholder="Règles de correction, style, contraintes..." />
          </div>

          <div class="form-field full-width">
            <label>Exemple de réponse attendue</label>
            <Textarea v-model="form.expected_answer" rows="5" placeholder="Réponse modèle..." />
          </div>

          <div class="form-field full-width">
            <label>Critères (un par ligne)</label>
            <Textarea v-model="criteriaText" rows="5" placeholder="Structure\nExactitude\nVocabulaire\nRaisonnement" />
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
            <Dropdown v-model="form.tone" :options="toneOptions" optionLabel="label" optionValue="value" placeholder="Tonalité" />
          </div>

          <div class="form-field">
            <label>Langue</label>
            <Dropdown v-model="form.language" :options="languageOptions" optionLabel="label" optionValue="value" placeholder="Langue" />
          </div>
        </div>
      </div>

      <div class="form-card">
        <h3><i class="pi pi-bolt"></i> Test rapide</h3>
        <div class="form-grid">
          <div class="form-field full-width">
            <label>Réponse fictive</label>
            <Textarea v-model="testAnswer" rows="5" placeholder="Colle une réponse d'étudiant pour tester le feedback..." />
          </div>
          <div class="form-field full-width">
            <Button label="Créer + Tester" icon="pi pi-play" class="p-button-outlined" :loading="loading" @click="createAndTest" />
          </div>

          <div v-if="testResult" class="test-result full-width">
            <h4>Résultat IA</h4>
            <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div class="actions">
        <Button label="Créer (brouillon)" icon="pi pi-save" :loading="loading" @click="createDraft" />
        <Button label="Créer et publier" icon="pi pi-upload" class="p-button-success" :loading="loading" @click="createPublished" />
        <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="goBack" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import InputNumber from 'primevue/inputnumber';
import { useFeedbackaStore } from '@/stores/feedbackaStore';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const toast = useToast();
const store = useFeedbackaStore();
const authStore = useAuthStore();

const loading = computed(() => store.loading);

const form = ref({
  title: '',
  question: '',
  context: '',
  instructions: '',
  correction_prompt: '',
  expected_answer: '',
  criteria: [],
  status: 'draft',
  language: 'fr',
  level: null,
  expected_length: null,
  scoring_enabled: false,
  max_score: 10,
  tone: 'bienveillant',
  course_id: null,
  class_id: null,
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

async function create(status) {
  normalizeCriteria();
  const userId = getUserId();

  form.value.author_id = userId;
  form.value.status = status;

  if (!form.value.title || !form.value.question) {
    toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Titre et question sont obligatoires', life: 3000 });
    return null;
  }

  const created = await store.createFeedbacka({ ...form.value });
  if (!created) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: store.error || 'Création échouée', life: 4000 });
    return null;
  }

  toast.add({ severity: 'success', summary: 'OK', detail: 'Fiche créée', life: 2500 });
  return created;
}

async function createDraft() {
  const created = await create('draft');
  if (created?.id) router.push(`/admin/tools/feedbacka/${created.id}/edit`);
}

async function createPublished() {
  const created = await create('published');
  if (created?.id) router.push(`/admin/tools/feedbacka/${created.id}/edit`);
}

async function createAndTest() {
  testResult.value = null;
  const created = await create('draft');
  if (!created?.id) return;

  if (!testAnswer.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Réponse manquante', detail: 'Ajoute une réponse fictive', life: 2500 });
    return;
  }

  const userId = getUserId();
  const result = await store.testFeedbacka(created.id, testAnswer.value, { author_id: userId });
  if (!result) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: store.error || 'Test échoué', life: 4000 });
    return;
  }

  testResult.value = result.ai_result;
}

function goBack() {
  router.push('/admin/tools/feedbacka/list');
}
</script>

<style scoped>
.feedbacka-create {
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
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

@media (max-width: 900px) {
  .feedbacka-create {
    padding: 1.25rem;
  }
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
