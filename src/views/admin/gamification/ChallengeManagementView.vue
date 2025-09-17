<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="challenge-management-page">
      <!-- Header de la page -->
      <div class="col-12">
        <div class="card">
          <!-- Breadcrumb -->
          <div class="flex align-items-center gap-2 mb-4 text-sm text-600">
            <router-link to="/admin" class="flex align-items-center gap-1 text-600 no-underline hover:text-primary transition-colors">
              <i class="pi pi-home"></i>
              <span>Dashboard</span>
            </router-link>
            <i class="pi pi-angle-right text-300 text-xs"></i>
            <span class="text-900 font-medium">Gestion des Défis</span>
          </div>
          
          <!-- Titre et description -->
          <div class="flex align-items-center gap-3 mb-3">
            <i class="pi pi-trophy text-orange-500 text-3xl"></i>
            <h1 class="text-3xl font-bold text-900 m-0">Gestion des Défis</h1>
          </div>
          <p class="text-600 text-lg line-height-3 m-0">
            Créez, modifiez et gérez les défis de gamification pour motiver vos étudiants.
          </p>
        </div>
      </div>

      <!-- Composant de gestion -->
      <div class="col-12">
        <ChallengeManagement />
      </div>
    </div>
  </div>
</template>

<script setup>
import ChallengeManagement from '@/components/admin/ChallengeManagement.vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import rolesService, { PERMISSIONS } from '@/service/rolesService'
import Navbar from '@/components/common/utils/Navbar.vue'

const router = useRouter()

// Vérification des permissions au montage
onMounted(() => {
  if (!rolesService.hasPermission(PERMISSIONS.VIEW_CHALLENGES)) {
    router.push('/admin')
  }
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.challenge-management-page {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .challenge-management-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>
