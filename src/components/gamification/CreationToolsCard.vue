<template>
  <div class="creation-tools-card">
    <div class="card">
      <div class="card-header">
        <div class="flex align-items-center gap-3 mb-3">
          <i class="pi pi-wrench text-primary text-2xl"></i>
          <h3 class="text-xl font-bold text-900 m-0">Outils de Création</h3>
        </div>
        <p class="text-600 text-sm line-height-3 m-0">
          Créez et partagez vos propres quêtes et défis avec la communauté
        </p>
      </div>

      <div class="creation-tools-grid">
        <!-- Créer une Quête -->
        <div class="creation-tool-item">
          <div class="tool-icon quest-icon">
            <i class="pi pi-flag"></i>
          </div>
          <div class="tool-content">
            <h4 class="tool-title">Créer une Quête</h4>
            <p class="tool-description">
              Concevez des quêtes multi-étapes pour engager la communauté
            </p>
            <router-link to="/create-quest" class="tool-button quest-button">
              <i class="pi pi-plus"></i>
              Nouvelle Quête
            </router-link>
          </div>
        </div>

        <!-- Créer un Défi -->
        <div class="creation-tool-item">
          <div class="tool-icon challenge-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="tool-content">
            <h4 class="tool-title">Créer un Défi</h4>
            <p class="tool-description">
              Proposez des défis stimulants pour motiver les participants
            </p>
            <router-link to="/create-challenge" class="tool-button challenge-button">
              <i class="pi pi-plus"></i>
              Nouveau Défi
            </router-link>
          </div>
        </div>
      </div>

      <!-- Statistiques de création -->
      <div class="creation-stats" v-if="userCreationStats">
        <div class="stats-header">
          <h4 class="text-sm font-semibold text-700 mb-2">Vos Créations</h4>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-number">{{ userCreationStats.questsCreated || 0 }}</span>
            <span class="stat-label">Quêtes créées</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ userCreationStats.challengesCreated || 0 }}</span>
            <span class="stat-label">Défis créés</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ userCreationStats.totalEngagement || 0 }}</span>
            <span class="stat-label">Participations</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../../../firebase'

// Props
const props = defineProps({
  userCreationStats: {
    type: Object,
    default: () => ({
      questsCreated: 0,
      challengesCreated: 0,
      totalEngagement: 0
    })
  }
})

// Reactive data
const loading = ref(false)

// Lifecycle
onMounted(() => {
  // Composant prêt
})
</script>

<style scoped>
.creation-tools-card {
  width: 100%;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.creation-tools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .creation-tools-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.creation-tool-item {
  display: flex;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.creation-tool-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
  flex-shrink: 0;
}

.quest-icon {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
}

.challenge-icon {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.tool-content {
  flex: 1;
}

.tool-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.tool-description {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0 0 1rem 0;
}

.tool-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.quest-button {
  background: #8b5cf6;
  color: white;
}

.quest-button:hover {
  background: #7c3aed;
  color: white;
  text-decoration: none;
}

.challenge-button {
  background: #f59e0b;
  color: white;
}

.challenge-button:hover {
  background: #d97706;
  color: white;
  text-decoration: none;
}

.creation-stats {
  padding: 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 767px) {
  .creation-tool-item {
    flex-direction: column;
    text-align: center;
  }
  
  .tool-icon {
    align-self: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }
  
  .stat-number {
    font-size: 1.25rem;
  }
  
  .stat-label {
    margin-top: 0;
    font-size: 0.875rem;
  }
}
</style>
