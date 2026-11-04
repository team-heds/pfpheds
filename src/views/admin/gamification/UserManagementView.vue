<template>
  <AdminLayout :wide="true">
    <div class="page-wrapper">
      <div class="user-management-page">
        <AdminGamificationPageHeader
          title="Gestion des utilisateurs"
          description="Consultez leur progression et réalisez des ajustements administratifs sécurisés."
          icon="pi pi-users"
        />

        <div class="content-container">
          <UserManagement />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import UserManagement from '@/components/admin/UserManagement.vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminGamificationPageHeader from '@/components/admin/common/AdminGamificationPageHeader.vue'
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.user-management-page {
  min-height: 100vh;
  padding: 1rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

.content-container {
  min-width: 0;
}

@media (max-width: 768px) {
  .user-management-page {
    padding: 0;
    padding-bottom: 6rem;
    gap: 1rem;
  }
}
</style>
