<template>
  <div class="p-4">
    <h1>🧪 Test SmartVisualization</h1>
    
    <Card class="mt-4">
      <template #content>
        <h3>Test avec données simples</h3>
        <SmartVisualization
          :data="testData"
          title="Test"
          :height="300"
        />
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import SmartVisualization from '@/components/admin/widgets/SmartVisualization.vue'

const testData = ref([
  { label: 'Catégorie A', value: 30, color: '#f59e0b' },
  { label: 'Catégorie B', value: 50, color: '#10b981' },
  { label: 'Catégorie C', value: 20, color: '#3b82f6' }
])
</script>
