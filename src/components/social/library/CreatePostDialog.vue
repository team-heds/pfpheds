<template>
  <Dialog
    :visible="modelValue"
    modal
    header="Nouvelle publication"
    class="create-post-dialog"
    :closable="!busy"
    :close-on-escape="!busy"
    :draggable="false"
    :style="{ width: 'min(96vw, 640px)' }"
    :breakpoints="{ '640px': '100vw' }"
    @update:visible="onVisibleChange"
  >
    <PostComposer
      :publish="publish"
      @state="busy = $event.publishing"
      @published="onPublished"
    />
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import PostComposer from '@/components/social/library/PostComposer.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  /** Fonction async ({ content, files }) fournie par le fil ; lève une erreur en cas d'échec. */
  publish: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'published'])

const busy = ref(false)

// Pendant l'envoi, la fenêtre reste ouverte : l'état de chargement ou l'erreur reste visible.
function onVisibleChange(visible) {
  if (!visible && busy.value) return
  emit('update:modelValue', visible)
}

function onPublished() {
  emit('published')
  emit('update:modelValue', false)
}
</script>

<style scoped>
@media (max-width: 640px) {
  :global(.create-post-dialog.p-dialog) {
    max-height: 100%;
    height: 100%;
    margin: 0;
    border-radius: 0;
  }
}
</style>
