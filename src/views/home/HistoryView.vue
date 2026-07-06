<template>
  <div class="history-view">
    <div class="history-header">
      <h1>Historique</h1>
      <p>Suivi des activités et des éléments consultés.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = useRouter()

const fetchUserProfileById = async () => {}

const navigateToInstitution = (instId) => {
  if (instId) {
    router.push({ name: 'InstitutionView', params: { id: instId } })
  }
}

onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserProfileById(user.uid)
    }
  })
})
</script>

<style scoped>
.history-view {
  padding: 2rem;
}

.history-header h1 {
  margin: 0 0 0.5rem;
}
</style>
