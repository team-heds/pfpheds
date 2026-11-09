<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="badge-management-page">
      <!-- Header de la page -->
      <div class="col-12">
        <AdminGamificationPageHeader
          title="Gestion des badges"
          description="Définissez les récompenses qui reconnaissent les accomplissements des étudiants."
          icon="pi pi-star"
        />
      </div>

      <!-- Composant de gestion -->
      <div class="col-12">
        <BadgeManagement />
      </div>
    </div>
  </div>
  </AdminLayout>
</template>

<script setup>
import BadgeManagement from '@/components/admin/BadgeManagement.vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import AdminGamificationPageHeader from '@/components/admin/common/AdminGamificationPageHeader.vue'
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

.badge-management-page {
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
  .badge-management-page {
    padding: 0.5rem;
    padding-bottom: 6rem;
    gap: 1rem;
  }
}
</style>
