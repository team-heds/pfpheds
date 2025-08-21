<template>
  <div class="vimeo-wrapper">
    <iframe
      :src="embedUrl"
      class="vimeo-iframe"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      referrerpolicy="no-referrer-when-downgrade"
    ></iframe>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildEmbedUrl } from '@/service/vimeoService'

const props = defineProps({
  vimeoId: { type: String, required: true },
  params: { type: Object, default: () => ({}) },
})

const embedUrl = computed(() => buildEmbedUrl(props.vimeoId, props.params))
</script>

<style scoped>
.vimeo-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; background: #000; }
.vimeo-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
</style>
