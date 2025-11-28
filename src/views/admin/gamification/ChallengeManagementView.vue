<template>
  <AdminLayout>
    <div class="page-wrapper">
    <div class="challenge-management-page">
      <!-- Header de la page -->
      <div class="col-12">
        <div class="card">
          <!-- Breadcrumb -->
          <div class="flex align-items-center gap-2 mb-4 text-sm text-600">
            <router-link to="/" class="flex align-items-center gap-1 text-600 no-underline hover:text-primary transition-colors">
              <i class="pi pi-home"></i>
              <span>Accueil</span>
            </router-link>
            <i class="pi pi-angle-right text-300 text-xs"></i>
            <span class="text-900 font-medium">Créer un Défi</span>
          </div>
          
          <!-- Titre et description -->
          <div class="flex align-items-center gap-3 mb-3">
            <i class="pi pi-trophy text-orange-500 text-3xl"></i>
            <h1 class="text-3xl font-bold text-900 m-0">Créer un Défi</h1>
          </div>
          <p class="text-600 text-lg line-height-3 m-0">
            Créez et partagez des défis de gamification pour motiver la communauté.
          </p>
        </div>
      </div>

      <!-- Composant de gestion -->
      <div class="col-12">
        <ChallengeManagement />
      </div>
    </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import ChallengeManagement from '@/components/admin/ChallengeManagement.vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
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
  padding: 1rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .challenge-management-page {
    padding: 0.5rem;
    padding-bottom: 6rem;
    gap: 1rem;
  }
}
</style>
