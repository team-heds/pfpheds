<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="analytics-dashboard-page">
      
      <!-- Header de la page -->
      <div class="page-header">
        <div class="header-content">
          <div class="breadcrumb-section">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary transition-colors">
              <i class="pi pi-home mr-1"></i>
              Dashboard
            </router-link>
            <i class="pi pi-angle-right text-300 mx-2"></i>
            <span class="text-900 font-medium">Analytics & Statistiques</span>
          </div>
          <div class="title-section">
            <h1><i class="pi pi-chart-bar mr-3"></i>Analytics & Statistiques</h1>
            <p>Analysez les performances de la gamification avec des statistiques détaillées et des graphiques interactifs.</p>
          </div>
        </div>
      </div>

      <!-- Composant de gestion -->
      <div class="content-container">
        <AnalyticsDashboard />
      </div>
      
    </div>
  </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
// import Navbar from '@/components/common/utils/Navbar.vue'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard.vue'
// Permissions gérées par le router - pas besoin de vérification supplémentaire ici
</script>

<style scoped>
/* Page wrapper pour le scroll - même structure que HouseManagementView */
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

.analytics-dashboard-page {
  min-height: 100vh;
  padding-bottom: 8rem;
}

.page-header {
  padding: 2rem 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.breadcrumb-section {
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.title-section h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: bold;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

.title-section p {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 1.1rem;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem 2rem 1rem;
}

@media (max-width: 768px) {
  .title-section h1 {
    font-size: 2rem;
  }
  
  .page-header {
    padding: 1.5rem 1rem;
  }
}
</style>
