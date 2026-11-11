<template>
  <header class="m-header">
    <div class="m-header__side">
      <button v-if="canGoBack" type="button" class="m-icon-button" aria-label="Retour" @click="emit('back')">
        <MIcon name="back" />
      </button>
      <template v-else>
        <button
          v-for="action in leadingActions"
          :key="action.key"
          type="button"
          class="m-icon-button"
          :aria-label="action.label"
          @click="emit('action', action.key)"
        >
          <MIcon :name="action.icon" />
        </button>
      </template>
    </div>

    <!-- Écran mobile : c'est le titre de la page. Page existante : elle a déjà son
         propre titre, celui de l'en-tête n'est qu'un repère visuel. -->
    <component
      :is="heading ? 'h1' : 'p'"
      class="m-header__title"
      :aria-hidden="heading ? undefined : 'true'"
    >{{ title }}</component>

    <div class="m-header__side m-header__side--end">
      <button
        v-for="action in trailingActions"
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
import { computed } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  canGoBack: { type: Boolean, default: false },
  /** Le titre de l'en-tête est-il le titre principal de la page ? */
  heading: { type: Boolean, default: true },
  /** [{ key, icon, label, badge, side }] — `side: 'start'` place l'action à gauche. */
  actions: { type: Array, default: () => [] },
})
const emit = defineEmits(['back', 'action'])

const leadingActions = computed(() => props.actions.filter((action) => action.side === 'start'))
const trailingActions = computed(() => props.actions.filter((action) => action.side !== 'start'))
</script>

<style scoped>
/* Titre centré, actions de part et d'autre : les deux côtés ont la même
   largeur pour que le titre reste au milieu de l'écran. */
.m-header {
  display: grid;
  grid-template-columns: minmax(48px, 1fr) auto minmax(48px, 1fr);
  align-items: center;
  gap: 4px;
  min-height: 52px;
  padding: 4px 8px;
  flex-shrink: 0;
  background: var(--m-bg);
}
.m-header__side {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.m-header__side--end {
  justify-content: flex-end;
}
.m-header__title {
  min-width: 0;
  max-width: 60vw;
  margin: 0;
  overflow: hidden;
  font-size: 1.0625rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--m-fg);
  outline: none;
}
.m-header__side .m-icon-button {
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
