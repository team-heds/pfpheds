<template>
  <div class="map-page">
    <div v-if="isMobile">
      <HeaderIcons />
    </div>
    <Navbar />
    <FiltreMap />
  </div>
</template>


<script>

import { defineComponent } from 'vue'
import FiltreMap from '@/components/Filters/FiltreMap.vue'
import Navbar from '@/components/Utils/Navbar.vue'
import HeaderIcons from '@/components/Utils/HeaderIcons.vue'

export default defineComponent({
  components: { Navbar, FiltreMap, HeaderIcons }
})
</script>

<style scoped>
</style>
