<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="house-management-page">
      
      <div class="page-header">
        <AdminGamificationPageHeader
          title="Gestion des maisons HES"
          description="Consultez les membres, les points calculés et le classement de chaque maison."
          icon="pi pi-home"
        />
      </div>

      <!-- Composant de gestion -->
      <div class="content-container">
        <HouseManagement />
      </div>
      
    </div>
  </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import HouseManagement from '@/components/admin/HouseManagement.vue'
import AdminGamificationPageHeader from '@/components/admin/common/AdminGamificationPageHeader.vue'
// Permissions gérées par le router - pas besoin de vérification supplémentaire ici
</script>

<style scoped>
/* Page wrapper pour le scroll - même structure que HousesRankingPage */
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  /* Masquer la scrollbar */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

/* Masquer la scrollbar pour WebKit (Chrome, Safari, Edge) */
.page-wrapper::-webkit-scrollbar {
  display: none;
}

.house-management-page {
  min-height: 100vh;
  padding-bottom: 8rem;
}

.page-header {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem 1rem;
}

@media (max-width: 768px) {
  .page-header {
    padding: 0.5rem;
  }
}
</style>
