<template>
  <section class="m-screen" :aria-labelledby="titleId" @keydown.esc.stop="emit('back')">
    <header class="m-screen__header">
      <button type="button" class="m-icon-button" aria-label="Retour" @click="emit('back')">
        <MIcon name="back" />
      </button>
      <h1 :id="titleId" ref="titleRef" class="m-screen__title" tabindex="-1">{{ title }}</h1>
      <div class="m-screen__actions"><slot name="actions" /></div>
    </header>
    <div ref="bodyRef" class="m-screen__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'

defineProps({ title: { type: String, required: true } })
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
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 4px 8px;
  flex-shrink: 0;
}
.m-screen__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
}
.m-screen__actions {
  display: flex;
  gap: 4px;
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
.m-screen.m-overlay-leave-active {
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .m-screen {
    transition: none;
  }
}
</style>
