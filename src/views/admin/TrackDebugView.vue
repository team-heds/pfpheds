
<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="Track Debug" subtitle="Outil de diagnostic" icon="pi pi-wrench" />
    </template>

    <div class="p-4">
      <Card>
        <template #content>
          <div class="text-600">Cette page est en construction.</div>
        </template>
      </Card>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import Card from 'primevue/card';
</script>
