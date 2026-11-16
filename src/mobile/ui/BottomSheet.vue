<template>
  <div class="m-sheet" @keydown="onKeydown">
    <div class="m-sheet__scrim" aria-hidden="true" @click="requestClose"></div>
    <section
      ref="panelRef"
      class="m-sheet__panel"
      :class="{ 'm-sheet__panel--tall': tall, 'is-dragging': dragging }"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      :style="dragStyle"
    >
      <header
        class="m-sheet__header"
        @pointerdown="onDragStart"
        @pointermove="onDragMove"
        @pointerup="onDragEnd"
        @pointercancel="onDragEnd"
      >
        <span class="m-sheet__grab" aria-hidden="true"></span>
        <div class="m-sheet__title-row">
          <h2 :id="titleId" class="m-sheet__title">{{ title }}</h2>
          <button type="button" class="m-icon-button" :aria-label="closeLabel" :disabled="locked" @click="requestClose">
            <MIcon name="x" />
          </button>
        </div>
      </header>
      <div class="m-sheet__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="m-sheet__footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  closeLabel: { type: String, default: 'Fermer' },
  /** Panneau haut d'office (liste longue, saisie). */
  tall: { type: Boolean, default: false },
  /** Fermeture bloquée, par exemple pendant un envoi. */
  locked: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const DISMISS_DISTANCE = 110
const titleId = `m-sheet-title-${Math.random().toString(36).slice(2, 9)}`
const panelRef = ref(null)
const dragOffset = ref(0)
const dragging = ref(false)
let dragStartY = null
let previousFocus = null

const dragStyle = computed(() => (dragOffset.value > 0 ? { transform: `translateY(${dragOffset.value}px)` } : null))

function requestClose() {
  if (!props.locked) emit('close')
}

// Tirer le panneau vers le bas par sa poignée le ferme.
function onDragStart(event) {
  if (props.locked || event.target.closest('button')) return
  dragStartY = event.clientY
  dragging.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}
function onDragMove(event) {
  if (dragStartY === null) return
  dragOffset.value = Math.max(0, event.clientY - dragStartY)
}
function onDragEnd() {
  if (dragStartY === null) return
  const shouldClose = dragOffset.value > DISMISS_DISTANCE
  dragStartY = null
  dragging.value = false
  if (shouldClose) requestClose()
  else dragOffset.value = 0
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    requestClose()
    return
  }
  if (event.key !== 'Tab') return
  // Le clavier reste dans le panneau tant qu'il est ouvert.
  const items = Array.from(panelRef.value?.querySelectorAll(FOCUSABLE) || []).filter((el) => el.offsetParent !== null)
  if (!items.length) {
    event.preventDefault()
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  previousFocus = document.activeElement
  panelRef.value?.focus({ preventScroll: true })
})
onBeforeUnmount(() => {
  if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true })
})
</script>

<style scoped>
.m-sheet {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
}
.m-sheet__scrim {
  position: absolute;
  inset: 0;
  background: rgba(2, 8, 18, 0.6);
  transition: opacity 220ms ease;
}
.m-sheet__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100% - var(--m-keyboard, 0px) - 3rem);
  margin-bottom: var(--m-keyboard, 0px);
  border-radius: 24px 24px 0 0;
  background: var(--m-surface);
  color: var(--m-fg);
  box-shadow: 0 -12px 40px rgba(2, 8, 18, 0.35);
  outline: none;
  transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.m-sheet__panel--tall {
  min-height: min(62%, calc(100% - var(--m-keyboard, 0px) - 3rem));
}
.m-sheet__panel.is-dragging {
  transition: none;
}
.m-sheet__header {
  flex-shrink: 0;
  padding: 8px 8px 4px 16px;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}
.m-sheet__grab {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto 6px;
  border-radius: 2px;
  background: var(--m-line);
}
.m-sheet__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.m-sheet__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}
.m-sheet__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 4px 16px 16px;
}
.m-sheet__footer {
  flex-shrink: 0;
  /* Clavier ouvert : la zone sûre du bas est déjà recouverte. */
  padding: 10px 16px max(12px, calc(12px + env(safe-area-inset-bottom, 0px) - var(--m-keyboard, 0px)));
  border-top: 1px solid var(--m-line);
}
/* Entrée et sortie, pilotées par la coque (TransitionGroup « m-overlay »). */
.m-sheet.m-overlay-enter-from .m-sheet__scrim,
.m-sheet.m-overlay-leave-to .m-sheet__scrim {
  opacity: 0;
}
.m-sheet.m-overlay-enter-from .m-sheet__panel,
.m-sheet.m-overlay-leave-to .m-sheet__panel {
  transform: translateY(105%);
}
.m-sheet.m-overlay-leave-active {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .m-sheet__scrim,
  .m-sheet__panel {
    transition: none;
  }
}
</style>
