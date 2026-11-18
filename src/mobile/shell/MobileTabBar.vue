<template>
  <nav class="m-tabs" :class="{ 'is-hidden': hidden }" aria-label="Navigation principale" @focusin="emit('reveal')">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="m-tabs__item"
      :class="{ 'is-active': tab.key === active }"
      :aria-label="tab.label"
      :aria-current="tab.key === active ? 'page' : undefined"
      @click="emit('select', tab.key)"
    >
      <!-- Profil : la photo de la personne, comme repère. -->
      <span v-if="tab.key === 'profile' && avatarUrl && !avatarFailed" class="m-tabs__avatar">
        <img :src="avatarUrl" alt="" @error="avatarFailed = true" />
      </span>
      <MIcon v-else :name="tab.icon" />
    </button>
  </nav>
</template>

<script setup>
import { ref, watch } from 'vue'
import MIcon from '@/mobile/ui/MIcon.vue'

const props = defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
  /** Photo de profil affichée sur l'onglet Profil (pictogramme à défaut). */
  avatarUrl: { type: String, default: null },
  /** Barre glissée sous le bord (défilement, tâche plein écran, clavier). */
  hidden: { type: Boolean, default: false },
})
// `reveal` : le clavier arrive sur la barre cachée, elle doit réapparaître.
const emit = defineEmits(['select', 'reveal'])

const avatarFailed = ref(false)
watch(() => props.avatarUrl, () => {
  avatarFailed.value = false
})
</script>

<style scoped>
.m-tabs {
  /* Ancrée au bas de l'écran, par-dessus le contenu. Le fond descend jusqu'au
     bord physique (barre d'accueil de l'iPhone comprise) ; les pictogrammes
     restent au-dessus de cette zone. */
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  padding: 2px max(8px, env(safe-area-inset-right, 0px)) var(--m-safe-bottom, env(safe-area-inset-bottom, 0px)) max(8px, env(safe-area-inset-left, 0px));
  border-top: 1px solid var(--m-line);
  background: var(--m-surface);
  transition: transform 220ms cubic-bezier(0, 0, 0.2, 1);
  will-change: transform;
}
@supports ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .m-tabs {
    background: color-mix(in srgb, var(--m-surface) 86%, transparent);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    backdrop-filter: blur(20px) saturate(140%);
  }
}
.m-tabs.is-hidden {
  transform: translateY(100%);
}
.m-tabs__item {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 52px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: none;
  color: var(--m-muted);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  transition: transform 120ms ease;
}
.m-tabs__item :deep(.m-icon) {
  width: 26px;
  height: 26px;
}
.m-tabs__item.is-active {
  color: var(--m-accent-text);
}
.m-tabs__item.is-active :deep(.m-icon) {
  stroke-width: 2.2;
}
/* Repère de l'onglet actif : un trait sous le pictogramme, lisible sans la couleur. */
.m-tabs__item.is-active::after {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 50%;
  width: 18px;
  height: 3px;
  border-radius: 2px;
  background: var(--m-accent);
  transform: translateX(-50%);
}
.m-tabs__item:active {
  transform: scale(0.92);
}
.m-tabs__item:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-tabs__avatar {
  display: block;
  width: 30px;
  height: 30px;
  padding: 2px;
  border: 2px solid transparent;
  border-radius: 50%;
}
.m-tabs__item.is-active .m-tabs__avatar {
  border-color: var(--m-accent);
}
.m-tabs__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}
@media (prefers-reduced-motion: reduce) {
  .m-tabs,
  .m-tabs__item {
    transition: none;
  }
}
@media (forced-colors: active) {
  .m-tabs__item.is-active {
    outline: 1px solid CanvasText;
    outline-offset: -3px;
  }
}
</style>
