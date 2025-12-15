<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Table des matières"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Capsules Insuffisance Rhénale</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <CapsulesInsuffisanceRenaleTableDesMatieres />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleTableDesMatieres from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleTableDesMatieres.vue'
</script>
