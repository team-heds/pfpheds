<template>
  <section class="m-screen" :class="{ 'm-screen--modal': modal }" :aria-labelledby="titleId" @keydown.esc.stop="emit('back')">
    <header class="m-screen__header">
      <div class="m-screen__side">
        <button type="button" class="m-icon-button" :aria-label="modal ? 'Fermer' : 'Retour'" :disabled="locked" @click="emit('back')">
          <MIcon :name="modal ? 'x' : 'back'" />
        </button>
      </div>
      <h1 :id="titleId" ref="titleRef" class="m-screen__title" tabindex="-1">{{ title }}</h1>
      <div class="m-screen__side m-screen__side--end"><slot name="actions" /></div>
    </header>
    <slot name="subheader" />
    <div ref="bodyRef" class="m-screen__body">
      <slot />
    </div>
    <slot name="footer" />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'

defineProps({
  title: { type: String, required: true },
  /** Écran de création : monte du bas et se ferme par une croix. */
  modal: { type: Boolean, default: false },
  /** Fermeture bloquée, par exemple pendant un envoi. */
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['back'])

const titleId = `m-screen-title-${Math.random().toString(36).slice(2, 9)}`
const titleRef = ref(null)
const bodyRef = ref(null)
let previousFocus = null

onMounted(() => {
  previousFocus = document.activeElement
  titleRef.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => {
  if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true })
})

defineExpose({ body: bodyRef })
</script>

<style scoped>
.m-screen {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  background: var(--m-bg);
  color: var(--m-fg);
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.m-screen__header {
  display: grid;
  grid-template-columns: minmax(48px, 1fr) auto minmax(48px, 1fr);
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 4px 8px;
  flex-shrink: 0;
}
.m-screen__side {
  display: flex;
  align-items: center;
  min-width: 0;
}
.m-screen__side--end {
  justify-content: flex-end;
}
.m-screen__title {
  min-width: 0;
  max-width: 56vw;
  margin: 0;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
}
.m-screen__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px calc(24px + env(safe-area-inset-bottom, 0px));
}
.m-screen.m-overlay-enter-from,
.m-screen.m-overlay-leave-to {
  transform: translateX(100%);
}
.m-screen--modal.m-overlay-enter-from,
.m-screen--modal.m-overlay-leave-to {
  transform: translateY(100%);
}
.m-screen.m-overlay-leave-active {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .m-screen {
    transition: none;
  }
}
</style>
