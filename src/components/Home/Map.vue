<template>
  <Navbar />
  <FiltreMap />
</template>


<script>

import { defineComponent } from 'vue'
import FiltreMap from '@/components/Filters/FiltreMap.vue'
import Navbar from '@/components/Utils/Navbar.vue'

export default defineComponent({
  components: { Navbar,   FiltreMap }
})
</script>

<style scoped>
</style>
