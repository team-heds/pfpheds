<template>
  <div class="map-page">
    <Navbar />
    <!-- Téléphone (768 px et moins) : la carte d'origine, inchangée. -->
    <FiltreMap v-if="isMobile" />
    <DesktopInstitutionMap v-else />
  </div>
</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import Navbar from '@/components/common/utils/Navbar.vue'

const FiltreMap = defineAsyncComponent(() => import('@/components/common/filters/FiltreMap.vue'))
const DesktopInstitutionMap = defineAsyncComponent(() => import('@/components/map/DesktopInstitutionMap.vue'))

// Même seuil que la carte d'origine (FiltreMap) : 768 px et moins = téléphone.
const MOBILE_QUERY = '(max-width: 768px)'
const media = typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY) : null
const isMobile = ref(media ? media.matches : false)
const onChange = (event) => { isMobile.value = event.matches }

onMounted(() => media?.addEventListener('change', onChange))
onBeforeUnmount(() => media?.removeEventListener('change', onChange))
</script>
