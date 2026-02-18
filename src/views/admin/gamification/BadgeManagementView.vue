<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="badge-management-page">
      <!-- Header de la page -->
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center gap-2 mb-3 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary transition-colors">
              <i class="pi pi-home mr-1"></i>
              Dashboard
            </router-link>
            <i class="pi pi-angle-right text-300"></i>
            <span class="text-900 font-medium">Gestion des Badges</span>
          </div>
          <h1 class="text-3xl font-bold text-900 m-0 mb-2 flex align-items-center gap-3">
            <i class="pi pi-star text-red-500 text-3xl"></i>
            Gestion des Badges
          </h1>
          <p class="text-600 text-lg line-height-3 m-0">
            Créez et gérez des badges de récompense pour reconnaître les accomplissements de vos étudiants.
          </p>
        </div>
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
// import Navbar from '@/components/common/utils/Navbar.vue'
import { onMounted } from 'vue'



// Permissions simplifiées - accès libre pour le développement
onMounted(() => {
  // Permissions désactivées temporairement
  // if (!rolesService.hasPermission(PERMISSIONS.VIEW_BADGES)) {
  //   router.push('/admin')
  // }
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
