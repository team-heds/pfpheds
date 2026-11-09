<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="quest-management-page">
      <div class="col-12">
        <AdminGamificationPageHeader
          title="Gestion des quêtes"
          description="Créez, planifiez et publiez des parcours multi-étapes pour accompagner la communauté."
          icon="pi pi-flag"
        />
      </div>

      <!-- Composant de gestion -->
      <div class="col-12">
        <QuestManagement />
      </div>
    </div>
  </div>
  </AdminLayout>
</template>

<script setup>
import QuestManagement from '@/components/admin/QuestManagement.vue'
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

.quest-management-page {
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
  .quest-management-page {
    padding: 0.5rem;
    padding-bottom: 6rem;
    gap: 1rem;
  }
}
</style>
