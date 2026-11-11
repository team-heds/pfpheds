<template>
  <header class="m-header">
    <button v-if="canGoBack" type="button" class="m-icon-button" aria-label="Retour" @click="emit('back')">
      <MIcon name="back" />
    </button>
    <!-- Écran mobile : c'est le titre de la page. Page existante : elle a déjà son
         propre titre, celui de l'en-tête n'est qu'un repère visuel. -->
    <component
      :is="heading ? 'h1' : 'p'"
      class="m-header__title"
      :class="{ 'm-header__title--sub': canGoBack }"
      :aria-hidden="heading ? undefined : 'true'"
    >{{ title }}</component>
    <div class="m-header__actions">
      <button
        v-for="action in actions"
        :key="action.key"
        type="button"
        class="m-icon-button"
        :aria-label="action.badge ? `${action.label} (nouveautés)` : action.label"
        @click="emit('action', action.key)"
      >
        <MIcon :name="action.icon" />
        <span v-if="action.badge" class="m-header__dot" aria-hidden="true"></span>
      </button>
    </div>
  </header>
</template>

<script setup>
import MIcon from '@/mobile/ui/MIcon.vue'

defineProps({
  title: { type: String, required: true },
  canGoBack: { type: Boolean, default: false },
  /** Le titre de l'en-tête est-il le titre principal de la page ? */
  heading: { type: Boolean, default: true },
  /** [{ key, icon, label, badge }] */
  actions: { type: Array, default: () => [] },
})
const emit = defineEmits(['back', 'action'])
</script>

<style scoped>
.m-header {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 4px 8px 4px 16px;
  flex-shrink: 0;
  background: var(--m-bg);
}
.m-header:has(> .m-icon-button:first-child) {
  padding-left: 8px;
}
.m-header__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--m-fg);
  outline: none;
}
.m-header__title--sub {
  font-size: 1.0625rem;
}
.m-header__actions {
  display: flex;
  gap: 2px;
}
.m-header__actions .m-icon-button {
  position: relative;
}
.m-header__dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border: 2px solid var(--m-bg);
  border-radius: 50%;
  background: var(--m-accent);
}
</style>
