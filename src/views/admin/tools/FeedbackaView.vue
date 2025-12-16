<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Feedbacka" 
        subtitle="Fiches de feedback auto-corrigées (question ouverte)" 
        icon="pi pi-comments" 
      />
    </template>

    <div class="feedbacka-view">
      <div class="content-grid">

        <div class="onboarding">
          <div class="onboarding-card">
            <h3><i class="pi pi-book"></i> À quoi ça sert ?</h3>
            <p>
              Feedbacka permet de préparer une <strong>fiche d'auto-correction</strong> pour une question ouverte.
              Les étudiants répondent, puis reçoivent un feedback structuré généré à partir d'un prompt de correction,
              d'un exemple de réponse attendue et de critères.
            </p>
          </div>

          <div class="onboarding-card">
            <h3><i class="pi pi-check"></i> Pour que ça marche bien</h3>
            <div class="checklist">
              <div class="check">1. Énoncé clair + consignes</div>
              <div class="check">2. Prompt de correction (règles + style)</div>
              <div class="check">3. Exemple de bonne réponse</div>
              <div class="check">4. Critères (structure, exactitude, vocabulaire, raisonnement…)</div>
              <div class="check">5. (Optionnel) Score/barème</div>
            </div>
          </div>

          <div class="onboarding-card">
            <h3><i class="pi pi-sitemap"></i> Flux</h3>
            <div class="flow">
              <div class="step">Créer une fiche</div>
              <div class="arrow">→</div>
              <div class="step">Tester rapidement</div>
              <div class="arrow">→</div>
              <div class="step">Publier</div>
              <div class="arrow">→</div>
              <div class="step">Soumissions + feedback</div>
            </div>
          </div>

          <div class="actions-section">
            <Button label="Aller à la liste" icon="pi pi-list" class="p-button-outlined" @click="goList" />
            <Button label="Créer une fiche" icon="pi pi-plus" @click="goCreate" />
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Button from 'primevue/button';
const router = useRouter();

function goList() {
  router.push('/admin/tools/feedbacka/list');
}

function goCreate() {
  router.push('/admin/tools/feedbacka/create');
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

.onboarding {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

.onboarding-card {
  grid-column: span 12;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 1.25rem;
}

.onboarding-card h3 {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
}

.onboarding-card p {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.checklist {
  display: grid;
  gap: 0.5rem;
}

.check {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
  color: var(--text-color);
}

.flow {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.step {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  padding: 0.4rem 0.85rem;
  color: var(--text-color);
  font-weight: 600;
}

.arrow {
  color: var(--text-color-secondary);
  font-weight: 700;
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

@media (max-width: 900px) {
  .feedbacka-view {
    padding: 1.25rem;
  }
  .actions-section {
    flex-direction: column;
    align-items: stretch;
  }
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
