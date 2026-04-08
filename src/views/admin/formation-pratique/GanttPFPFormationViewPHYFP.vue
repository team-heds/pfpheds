<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Gantt PFP</span>
      </div>
      <div class="surface-card fp-dark p-4 border-round shadow-2">
        <div class="flex align-items-center gap-3 mb-4">
          <i class="pi pi-chart-line text-primary text-4xl"></i>
          <div>
            <h1 class="text-3xl font-bold text-900 m-0">Gantt PFP</h1>
            <p class="text-600 m-0 mt-2">Planning visuel des périodes de formation pratique</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
</script>

<style scoped>
</style>
