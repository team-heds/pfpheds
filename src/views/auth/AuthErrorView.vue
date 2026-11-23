<template>
  <StatusPage
    title="Connexion impossible"
    description="Nous n’avons pas pu vous connecter. Réessayez depuis la page de connexion."
    icon="pi-exclamation-triangle"
  >
    <Button label="Retour à la connexion" icon="pi pi-sign-in" @click="router.push('/home')" />
  </StatusPage>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import StatusPage from '@/components/common/feedback/StatusPage.vue'

const router = useRouter()
</script>
