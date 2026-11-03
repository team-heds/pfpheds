<template>
  <StatusPage
    :title="content.title"
    :description="content.description"
    :hint="content.hint"
    :icon="content.icon"
    :tone="content.tone"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import StatusPage from '@/components/common/states/StatusPage.vue'

const REASONS = {
  'profile-scope': {
    title: 'Ce profil n’est pas accessible',
    description: 'Pour protéger les données personnelles, les profils détaillés ne sont visibles que par la personne concernée et par l’équipe encadrante.',
    hint: 'Les publications de cette personne restent visibles dans le fil et dans vos communautés communes.',
    icon: 'pi pi-user-minus',
    tone: 'neutral',
  },
  'profile-check-failed': {
    title: 'Le profil n’a pas pu être vérifié',
    description: 'La vérification de vos droits d’accès a échoué. Cela vient souvent d’une connexion interrompue.',
    hint: 'Revenez en arrière et réessayez dans un instant.',
    icon: 'pi pi-wifi',
    tone: 'warning',
  },
}

const DEFAULT_REASON = {
  title: 'Accès réservé',
  description: 'Cette page est réservée à certains rôles et votre compte ne dispose pas des droits nécessaires.',
  hint: 'Si vous pensez que c’est une erreur, contactez le secrétariat de votre filière.',
  icon: 'pi pi-lock',
  tone: 'neutral',
}

const route = useRoute()
const content = computed(() => REASONS[route.query.reason] || DEFAULT_REASON)
</script>
