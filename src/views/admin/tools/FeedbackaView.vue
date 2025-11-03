<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Feedbacka" 
        subtitle="Plateforme de feedback et d'évaluation" 
        icon="pi pi-comments" 
      />
    </template>

    <div class="feedbacka-view">
      <div class="content-grid">
        
        <!-- Statistiques -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon" style="background: #3b82f6;">
              <i class="pi pi-comment"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalFeedbacks }}</span>
              <span class="stat-label">Feedbacks totaux</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #10b981;">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ processedFeedbacks }}</span>
              <span class="stat-label">Traités</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #f59e0b;">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ pendingFeedbacks }}</span>
              <span class="stat-label">En attente</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style="background: #8b5cf6;">
              <i class="pi pi-star"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ averageRating.toFixed(1) }}</span>
              <span class="stat-label">Note moyenne</span>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="actions-section">
          <Button label="Nouveau Feedback" icon="pi pi-plus" @click="createFeedback" />
          <Button label="Exporter" icon="pi pi-download" class="p-button-outlined" @click="exportFeedbacks" />
          <Button label="Paramètres" icon="pi pi-cog" class="p-button-outlined" @click="openSettings" />
        </div>

        <!-- Onglets -->
        <div class="tabs-section">
          <TabView v-model:activeIndex="activeTab">
            
            <!-- Onglet: Feedbacks reçus -->
            <TabPanel header="Feedbacks Reçus">
              <div class="filters-bar">
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText v-model="searchQuery" placeholder="Rechercher..." />
                </span>
                <Dropdown v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Statut" showClear />
                <Dropdown v-model="filterType" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Type" showClear />
                <Dropdown v-model="filterCourse" :options="courseOptions" optionLabel="label" optionValue="value" placeholder="Cours" showClear />
              </div>

              <DataTable 
                :value="filteredFeedbacks" 
                :paginator="true" 
                :rows="10"
                :loading="loading"
                responsiveLayout="scroll"
                @row-click="viewFeedback"
                class="clickable-rows"
              >
                <Column field="date" header="Date" sortable>
                  <template #body="{ data }">
                    {{ formatDate(data.date) }}
                  </template>
                </Column>

                <Column field="from" header="De" sortable>
                  <template #body="{ data }">
                    <div class="user-info">
                      <Avatar :label="data.fromInitials" shape="circle" size="small" />
                      <span>{{ data.from }}</span>
                    </div>
                  </template>
                </Column>

                <Column field="course" header="Cours" sortable>
                  <template #body="{ data }">
                    <Tag :value="data.course" />
                  </template>
                </Column>

                <Column field="type" header="Type" sortable>
                  <template #body="{ data }">
                    <Tag :value="getFeedbackTypeLabel(data.type)" :severity="getTypeSeverity(data.type)" />
                  </template>
                </Column>

                <Column field="rating" header="Évaluation" sortable>
                  <template #body="{ data }">
                    <Rating :modelValue="data.rating" :readonly="true" :cancel="false" />
                  </template>
                </Column>

                <Column field="status" header="Statut" sortable>
                  <template #body="{ data }">
                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                  </template>
                </Column>

                <Column header="Actions">
                  <template #body="{ data }">
                    <div class="action-buttons">
                      <Button icon="pi pi-eye" class="p-button-sm p-button-text" v-tooltip.top="'Voir'" @click.stop="viewFeedback(data)" />
                      <Button icon="pi pi-reply" class="p-button-sm p-button-text" v-tooltip.top="'Répondre'" @click.stop="replyFeedback(data)" />
                      <Button icon="pi pi-check" class="p-button-sm p-button-text p-button-success" v-tooltip.top="'Marquer traité'" @click.stop="markProcessed(data)" />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Onglet: Mes feedbacks -->
            <TabPanel header="Mes Feedbacks">
              <div class="my-feedbacks-list">
                <div v-for="feedback in myFeedbacks" :key="feedback.id" class="feedback-card">
                  <div class="feedback-header">
                    <div class="feedback-meta">
                      <Avatar :label="feedback.toInitials" shape="circle" />
                      <div class="meta-info">
                        <strong>{{ feedback.to }}</strong>
                        <span class="date">{{ formatDate(feedback.date) }}</span>
                      </div>
                    </div>
                    <div class="feedback-rating">
                      <Rating :modelValue="feedback.rating" :readonly="true" :cancel="false" />
                    </div>
                  </div>
                  <div class="feedback-content">
                    <Tag :value="feedback.course" class="mb-2" />
                    <p>{{ feedback.message }}</p>
                  </div>
                  <div class="feedback-footer" v-if="feedback.response">
                    <div class="response">
                      <i class="pi pi-reply"></i>
                      <span>{{ feedback.response }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="myFeedbacks.length === 0" class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <p>Vous n'avez pas encore donné de feedback</p>
                </div>
              </div>
            </TabPanel>

            <!-- Onglet: Analytiques -->
            <TabPanel header="Analytiques">
              <div class="analytics-grid">
                <div class="chart-card">
                  <h3>Évolution des feedbacks</h3>
                  <div class="chart-placeholder">
                    <i class="pi pi-chart-line"></i>
                    <p>Graphique à venir</p>
                  </div>
                </div>

                <div class="chart-card">
                  <h3>Répartition par type</h3>
                  <div class="chart-placeholder">
                    <i class="pi pi-chart-pie"></i>
                    <p>Graphique à venir</p>
                  </div>
                </div>

                <div class="chart-card">
                  <h3>Notes moyennes par cours</h3>
                  <div class="stats-list">
                    <div v-for="stat in courseStats" :key="stat.course" class="stat-item">
                      <span class="course-name">{{ stat.course }}</span>
                      <div class="rating-bar">
                        <ProgressBar :value="stat.rating * 20" :showValue="false" />
                        <span class="rating-value">{{ stat.rating.toFixed(1) }}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="chart-card">
                  <h3>Temps de réponse moyen</h3>
                  <div class="metric-display">
                    <div class="metric-value">2.5</div>
                    <div class="metric-label">jours</div>
                  </div>
                </div>
              </div>
            </TabPanel>

          </TabView>
        </div>

      </div>
    </div>

    <!-- Dialog de création/visualisation -->
    <Dialog v-model:visible="feedbackDialog" :header="dialogMode === 'create' ? 'Nouveau Feedback' : 'Détails du Feedback'" :modal="true" :style="{ width: '600px' }">
      <div v-if="dialogMode === 'create'" class="feedback-form">
        <div class="form-field">
          <label>À qui?</label>
          <Dropdown v-model="newFeedback.toId" :options="teachers" optionLabel="name" optionValue="id" placeholder="Sélectionnez un enseignant" />
        </div>
        <div class="form-field">
          <label>Cours</label>
          <Dropdown v-model="newFeedback.courseId" :options="courseOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez un cours" />
        </div>
        <div class="form-field">
          <label>Type de feedback</label>
          <Dropdown v-model="newFeedback.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Sélectionnez un type" />
        </div>
        <div class="form-field">
          <label>Évaluation</label>
          <Rating v-model="newFeedback.rating" :cancel="false" />
        </div>
        <div class="form-field">
          <label>Message</label>
          <Textarea v-model="newFeedback.message" rows="5" placeholder="Votre feedback..." />
        </div>
      </div>

      <div v-else-if="currentFeedback" class="feedback-detail">
        <div class="detail-section">
          <strong>De:</strong>
          <span>{{ currentFeedback.from }}</span>
        </div>
        <div class="detail-section">
          <strong>Cours:</strong>
          <Tag :value="currentFeedback.course" />
        </div>
        <div class="detail-section">
          <strong>Type:</strong>
          <Tag :value="getFeedbackTypeLabel(currentFeedback.type)" />
        </div>
        <div class="detail-section">
          <strong>Évaluation:</strong>
          <Rating :modelValue="currentFeedback.rating" :readonly="true" :cancel="false" />
        </div>
        <div class="detail-section full-width">
          <strong>Message:</strong>
          <p class="feedback-message">{{ currentFeedback.message }}</p>
        </div>
        <div class="detail-section full-width" v-if="!currentFeedback.response">
          <label>Votre réponse</label>
          <Textarea v-model="responseMessage" rows="3" placeholder="Écrivez votre réponse..." />
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="feedbackDialog = false" />
        <Button v-if="dialogMode === 'create'" label="Envoyer" icon="pi pi-send" @click="sendFeedback" />
        <Button v-else-if="!currentFeedback?.response" label="Répondre" icon="pi pi-reply" @click="sendResponse" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Avatar from 'primevue/avatar';
import Rating from 'primevue/rating';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import ProgressBar from 'primevue/progressbar';

const toast = useToast();
const loading = ref(false);
const activeTab = ref(0);
const feedbackDialog = ref(false);
const dialogMode = ref('view');
const currentFeedback = ref(null);
const responseMessage = ref('');

const searchQuery = ref('');
const filterStatus = ref(null);
const filterType = ref(null);
const filterCourse = ref(null);

const feedbacks = ref([]);
const myFeedbacks = ref([]);
const teachers = ref([]);
const courseOptions = ref([]);

const newFeedback = ref({
  toId: null,
  courseId: null,
  type: null,
  rating: 3,
  message: ''
});

const statusOptions = [
  { label: 'En attente', value: 'pending' },
  { label: 'Traité', value: 'processed' },
  { label: 'Archivé', value: 'archived' }
];

const typeOptions = [
  { label: 'Cours', value: 'course' },
  { label: 'TP', value: 'practical' },
  { label: 'Évaluation', value: 'assessment' },
  { label: 'Général', value: 'general' }
];

const courseStats = ref([
  { course: 'Anatomie', rating: 4.5 },
  { course: 'Physiologie', rating: 4.2 },
  { course: 'Pathologie', rating: 3.8 }
]);

const totalFeedbacks = computed(() => feedbacks.value.length);
const processedFeedbacks = computed(() => feedbacks.value.filter(f => f.status === 'processed').length);
const pendingFeedbacks = computed(() => feedbacks.value.filter(f => f.status === 'pending').length);
const averageRating = computed(() => {
  if (feedbacks.value.length === 0) return 0;
  return feedbacks.value.reduce((sum, f) => sum + f.rating, 0) / feedbacks.value.length;
});

const filteredFeedbacks = computed(() => {
  let filtered = feedbacks.value;

  if (searchQuery.value) {
    filtered = filtered.filter(f => 
      f.from.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  if (filterStatus.value) {
    filtered = filtered.filter(f => f.status === filterStatus.value);
  }

  if (filterType.value) {
    filtered = filtered.filter(f => f.type === filterType.value);
  }

  if (filterCourse.value) {
    filtered = filtered.filter(f => f.course === filterCourse.value);
  }

  return filtered;
});

onMounted(() => {
  loadData();
});

function loadData() {
  // Données de démo
  feedbacks.value = [
    {
      id: 1,
      date: '2024-11-15',
      from: 'Sophie Martin',
      fromInitials: 'SM',
      course: 'Anatomie',
      type: 'course',
      rating: 5,
      status: 'pending',
      message: 'Excellent cours, très clair et bien structuré!'
    },
    {
      id: 2,
      date: '2024-11-14',
      from: 'Pierre Dubois',
      fromInitials: 'PD',
      course: 'Physiologie',
      type: 'practical',
      rating: 4,
      status: 'processed',
      message: 'Les TP sont intéressants mais un peu trop rapides.',
      response: 'Merci pour votre retour, je vais ralentir le rythme.'
    }
  ];

  myFeedbacks.value = [
    {
      id: 1,
      date: '2024-11-10',
      to: 'Dr. Martin Dubois',
      toInitials: 'MD',
      course: 'Anatomie',
      rating: 5,
      message: 'Merci pour cet excellent enseignement!',
      response: 'Merci beaucoup pour ce retour positif!'
    }
  ];

  teachers.value = [
    { id: 1, name: 'Dr. Martin Dubois' },
    { id: 2, name: 'Prof. Sophie Renaud' }
  ];

  courseOptions.value = [
    { label: 'Anatomie', value: 'Anatomie' },
    { label: 'Physiologie', value: 'Physiologie' },
    { label: 'Pathologie', value: 'Pathologie' }
  ];
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function getFeedbackTypeLabel(type) {
  const labels = {
    'course': 'Cours',
    'practical': 'TP',
    'assessment': 'Évaluation',
    'general': 'Général'
  };
  return labels[type] || type;
}

function getTypeSeverity(type) {
  switch (type) {
    case 'course': return 'info';
    case 'practical': return 'warning';
    case 'assessment': return 'success';
    default: return null;
  }
}

function getStatusLabel(status) {
  const labels = {
    'pending': 'En attente',
    'processed': 'Traité',
    'archived': 'Archivé'
  };
  return labels[status] || status;
}

function getStatusSeverity(status) {
  switch (status) {
    case 'pending': return 'warning';
    case 'processed': return 'success';
    case 'archived': return null;
    default: return null;
  }
}

function createFeedback() {
  dialogMode.value = 'create';
  newFeedback.value = {
    toId: null,
    courseId: null,
    type: null,
    rating: 3,
    message: ''
  };
  feedbackDialog.value = true;
}

function viewFeedback(data) {
  dialogMode.value = 'view';
  currentFeedback.value = data.data || data;
  responseMessage.value = '';
  feedbackDialog.value = true;
}

function replyFeedback(data) {
  viewFeedback(data);
}

function markProcessed(data) {
  data.status = 'processed';
  toast.add({
    severity: 'success',
    summary: 'Feedback traité',
    detail: 'Le feedback a été marqué comme traité',
    life: 3000
  });
}

function sendFeedback() {
  toast.add({
    severity: 'success',
    summary: 'Feedback envoyé',
    detail: 'Votre feedback a été envoyé',
    life: 3000
  });
  feedbackDialog.value = false;
}

function sendResponse() {
  if (currentFeedback.value) {
    currentFeedback.value.response = responseMessage.value;
    currentFeedback.value.status = 'processed';
  }
  toast.add({
    severity: 'success',
    summary: 'Réponse envoyée',
    detail: 'Votre réponse a été envoyée',
    life: 3000
  });
  feedbackDialog.value = false;
}

function exportFeedbacks() {
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}

function openSettings() {
  toast.add({
    severity: 'info',
    summary: 'Paramètres',
    detail: 'Fonction à implémenter',
    life: 3000
  });
}
</script>

<style scoped>
.feedbacka-view {
  padding: 2rem;
}

.content-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.actions-section {
  display: flex;
  gap: 1rem;
  background: var(--surface-card);
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.tabs-section {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.clickable-rows :deep(tbody tr) {
  cursor: pointer;
}

.my-feedbacks-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feedback-card {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 1.5rem;
  border-left: 4px solid var(--primary-color);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.feedback-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-info .date {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.feedback-content p {
  margin: 0.5rem 0 0 0;
  line-height: 1.6;
}

.feedback-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.response {
  display: flex;
  gap: 0.5rem;
  font-style: italic;
  color: var(--text-color-secondary);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.chart-card {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.chart-card h3 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.course-name {
  font-weight: 600;
  color: var(--text-color);
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.rating-value {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 50px;
}

.metric-display {
  text-align: center;
  padding: 2rem;
}

.metric-value {
  font-size: 4rem;
  font-weight: 700;
  color: var(--primary-color);
}

.metric-label {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
}

.feedback-form, .feedback-detail {
  display: flex;
  flex-direction: column;
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

.detail-section {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.detail-section.full-width {
  flex-direction: column;
  align-items: flex-start;
}

.feedback-message {
  margin: 0.5rem 0 0 0;
  line-height: 1.6;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

@media (max-width: 768px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
