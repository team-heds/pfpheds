<template>
  <div class="feedbacka-student">
    <Navbar />

    <div class="container" v-if="loaded">
      <div class="header">
        <h1>{{ feedbacka.title }}</h1>
        <Tag v-if="feedbacka.scoring_enabled" value="Score activé" severity="info" />
      </div>

      <div class="card">
        <h3>Question</h3>
        <p class="pre">{{ feedbacka.question }}</p>

        <div v-if="feedbacka.context">
          <h4>Contexte</h4>
          <p class="pre">{{ feedbacka.context }}</p>
        </div>

        <div v-if="feedbacka.instructions">
          <h4>Consignes</h4>
          <p class="pre">{{ feedbacka.instructions }}</p>
        </div>

        <div v-if="Array.isArray(feedbacka.criteria) && feedbacka.criteria.length">
          <h4>Critères</h4>
          <ul>
            <li v-for="(c, idx) in feedbacka.criteria" :key="idx">{{ c }}</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <h3>Ta réponse</h3>
        <Textarea v-model="answer" rows="10" placeholder="Écris ta réponse..." />

        <div class="actions">
          <Button label="Envoyer" icon="pi pi-send" :loading="loading" :disabled="!answer.trim()" @click="submit" />
        </div>

        <div v-if="submission" class="result">
          <Tag :value="submission.status" :severity="submission.status === 'done' ? 'success' : submission.status === 'pending' ? 'warning' : 'danger'" />

          <div v-if="submission.status === 'error'" class="error">
            {{ submission.error_message }}
          </div>

          <div v-if="submission.ai_result" class="ai">
            <h4>Feedback</h4>

            <div class="grid">
              <div>
                <h5>Points forts</h5>
                <ul>
                  <li v-for="(x, idx) in (submission.ai_result.strengths || [])" :key="'s'+idx">{{ x }}</li>
                </ul>
              </div>
              <div>
                <h5>Points à corriger</h5>
                <ul>
                  <li v-for="(x, idx) in (submission.ai_result.weaknesses || [])" :key="'w'+idx">{{ x }}</li>
                </ul>
              </div>
            </div>

            <div>
              <h5>Suggestions</h5>
              <ul>
                <li v-for="(x, idx) in (submission.ai_result.improvements || [])" :key="'i'+idx">{{ x }}</li>
              </ul>
            </div>

            <div v-if="submission.ai_result.suggested_rewrite">
              <h5>Proposition d'amélioration</h5>
              <p class="pre">{{ submission.ai_result.suggested_rewrite }}</p>
            </div>

            <div v-if="submission.ai_result.score">
              <h5>Score</h5>
              <p><strong>{{ submission.ai_result.score.value }}</strong> / {{ submission.ai_result.score.max }}</p>
              <p v-if="submission.ai_result.score.rationale" class="muted">{{ submission.ai_result.score.rationale }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from '@/components/common/utils/Navbar.vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import { useFeedbackaStore } from '@/stores/feedbackaStore';
import { useAuthStore } from '@/stores/authStore';

const route = useRoute();
const store = useFeedbackaStore();
const authStore = useAuthStore();

const loading = computed(() => store.loading);

const loaded = ref(false);
const feedbacka = ref({});
const answer = ref('');
const submission = ref(null);

function getUserId() {
  return authStore.isFirebaseUser ? authStore.user?.uid : authStore.user?.id;
}

onMounted(async () => {
  const id = route.params.id;
  const data = await store.fetchFeedbacka(id);
  if (data) {
    feedbacka.value = data;
    loaded.value = true;
  }
});

async function submit() {
  submission.value = null;
  const userId = getUserId();
  const result = await store.submitAnswer(feedbacka.value.id, { student_id: userId, answer_text: answer.value });
  if (result) submission.value = result;
}
</script>

<style scoped>
.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 1.5rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.card h3 {
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
}

.card h4 {
  margin: 1rem 0 0.5rem 0;
  color: var(--text-color);
}

.card h5 {
  margin: 0.75rem 0 0.5rem 0;
  color: var(--text-color);
}

.pre {
  white-space: pre-wrap;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.result {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}

.ai {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.75rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.muted {
  color: var(--text-color-secondary);
}

.error {
  margin-top: 10px;
  color: var(--text-color);
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-left: 4px solid #dc2626;
  border-radius: 0.75rem;
  padding: 0.75rem;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 50px 0;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .container {
    padding: 1.25rem;
  }
}
</style>
