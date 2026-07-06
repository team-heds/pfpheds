<template>
  <div class="quiz-view-container">
    <div class="quiz-content">
      <HESHouseQuiz
        v-if="currentUserId"
        :userId="currentUserId"
        @houseSelected="onHouseSelected"
      />
      <div v-else class="loading">
        <p>Chargement...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import HESHouseQuiz from '@/components/user/profile/HESHouseQuiz.vue'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const currentUserId = ref(null)

const onHouseSelected = (house) => {
  toast.add({
    severity: 'success',
    summary: 'Maison assignée !',
    detail: `Bienvenue dans la maison ${house.name}`,
    life: 5000
  })
}

onMounted(async () => {
  await authStore.checkAuthState()

  if (authStore.isLoggedIn && authStore.user) {
    currentUserId.value = authStore.user.id
  } else {
    router.push('/')
  }
})
</script>

<style scoped>
.quiz-view-container {
  min-height: 100vh;
  padding: 2rem;
}

.quiz-header {
  text-align: center;
  margin-bottom: 2rem;
}

.quiz-header h1 {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.quiz-header p {
  font-size: 1.2rem;
  color: var(--primary-color);
}

.quiz-content {
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .quiz-view-container {
    padding: 1rem;
  }

  .quiz-header h1 {
    font-size: 2rem;
  }

  .quiz-header p {
    font-size: 1rem;
  }
}
</style>
