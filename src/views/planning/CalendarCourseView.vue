<template>
  <TheNavbar />
  <div class="p-4">
    <h1 class="text-3xl mb-4">Calendar - Course</h1>
    <Panel header="Informations du cours">
      <ul class="m-0 pl-3">
        <li><strong>Nom</strong>: {{ course?.name || '—' }}</li>
        <li><strong>Module</strong>: {{ course?.modules?.name || '—' }}</li>
        <li><strong>Durée</strong>: {{ course?.duration_hours || '—' }}</li>
        <li><strong>Semaine</strong>: {{ course?.schedule?.week || '—' }}</li>
      </ul>
    </Panel>
  </div>
  </template>

<script setup>
import TheNavbar from '@/components/TheNavbar.vue'
import Panel from 'primevue/panel'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCoursesStore } from '@/views/planning/stores/coursesStore.js'

const route = useRoute()
const coursesStore = useCoursesStore()
const course = ref(null)

const load = async () => {
  const id = route.params.courseId
  if (!id) return
  try { course.value = await coursesStore.getById(id) } catch (e) { console.warn('Course load failed', e) }
}

onMounted(load)
</script>
