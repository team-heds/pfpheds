<template>
  <StatusPage :title="message.title" :description="message.description" :icon="message.icon">
    <Button label="Retour à l’accueil" icon="pi pi-home" @click="router.push('/')" />
    <Button v-if="canGoBack" label="Page précédente" icon="pi pi-arrow-left" outlined @click="router.back()" />
  </StatusPage>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import StatusPage from '@/components/common/feedback/StatusPage.vue'
import { accessMessage } from '@/utils/accessMessages'

const route = useRoute()
const router = useRouter()
const message = computed(() => accessMessage(route.query.reason))
const canGoBack = computed(() => Boolean(window.history.state?.back))
</script>
