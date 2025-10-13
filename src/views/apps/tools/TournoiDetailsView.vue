<template>
  <div class="tournoi-details-view">
    <Navbar />
    
    <div class="tournoi-content">
      <div v-if="!tournoi" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 3rem;"></i>
        <p>Chargement du tournoi...</p>
      </div>
      
      <div v-else-if="!tournoi" class="error-state">
        <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: #ff6b6b;"></i>
        <h3>Tournoi introuvable</h3>
        <Button label="Retour aux tournois" icon="pi pi-arrow-left" @click="router.push('/tournois')" />
      </div>
      
      <TournoiDetails 
        v-else
        :tournoi="tournoi" 
        @update="updateTournoi"
        @close="router.push('/tournois')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import TournoiDetails from '@/components/tournois/TournoiDetails.vue'

const router = useRouter()
const route = useRoute()
const tournoi = ref(null)

onMounted(() => {
  loadTournoi()
})

function loadTournoi() {
  const tournoiId = route.params.id
  const saved = localStorage.getItem('tournois')
  
  if (saved) {
    const tournois = JSON.parse(saved)
    tournoi.value = tournois.find(t => t.id === tournoiId)
  }
}

function updateTournoi(updatedTournoi) {
  const saved = localStorage.getItem('tournois')
  
  if (saved) {
    const tournois = JSON.parse(saved)
    const index = tournois.findIndex(t => t.id === updatedTournoi.id)
    
    if (index !== -1) {
      tournois[index] = updatedTournoi
      localStorage.setItem('tournois', JSON.stringify(tournois))
      // Forcer la réactivité en créant une nouvelle référence
      tournoi.value = JSON.parse(JSON.stringify(updatedTournoi))
    }
  }
}
</script>

<style scoped>
.tournoi-details-view {
  min-height: 100vh;

}

.tournoi-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1.5rem;
  text-align: center;
}

.loading-state i {
  color: var(--primary-color);
}

.error-state h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .tournoi-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .tournoi-content {
    padding: 0.5rem;
  }
}
</style>
