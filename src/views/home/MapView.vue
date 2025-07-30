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
import FiltreMap from '@/components/common/filters/FiltreMap.vue'
import Navbar from '@/components/common/utils/Navbar.vue'
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'

export default defineComponent({
  components: { Navbar, FiltreMap, HeaderIcons }
})
</script>

<style scoped>
</style>