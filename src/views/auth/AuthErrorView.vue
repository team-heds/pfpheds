<template>
  <StatusPage
    :title="content.title"
    :description="content.description"
    :hint="content.hint"
    icon="pi pi-exclamation-triangle"
    tone="warning"
    primary-label="Retour à la connexion"
    primary-icon="pi pi-sign-in"
    primary-to="/home"
    :show-back="false"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StatusPage from '@/components/common/states/StatusPage.vue'

const route = useRoute()

// Supabase renvoie error_code (ex. otp_expired) dans la query ou le fragment de l'URL.
function readErrorCode() {
  const fromQuery = route.query.error_code || route.query.error
  if (fromQuery) return String(fromQuery)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('error_code') || hash.get('error') || ''
}

const content = computed(() => {
  const code = readErrorCode()
  if (code === 'otp_expired') {
    return {
      title: 'Ce lien a expiré',
      description: 'Les liens de connexion et de réinitialisation ne sont valables qu’une heure et une seule fois.',
      hint: 'Demandez un nouveau lien depuis la page de connexion, puis utilisez uniquement le dernier email reçu.',
    }
  }
  if (code === 'access_denied') {
    return {
      title: 'Connexion refusée',
      description: 'La connexion n’a pas pu être validée.',
      hint: 'Reconnectez-vous depuis la page de connexion. Si le problème continue, contactez le secrétariat.',
    }
  }
  return {
    title: 'La connexion n’a pas abouti',
    description: 'Une erreur est survenue pendant l’authentification.',
    hint: 'Revenez à la page de connexion et réessayez.',
  }
})
</script>
