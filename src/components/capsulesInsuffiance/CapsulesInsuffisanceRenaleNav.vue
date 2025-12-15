<template>
  <div class="capsules-ir-nav">
    <div class="capsules-ir-nav__inner">
      <div class="flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="flex align-items-center gap-2 flex-wrap">
          <router-link
            v-if="prevTo"
            :to="prevTo"
            class="capsules-ir-nav__btn"
          >
            <i class="pi pi-arrow-left" aria-hidden="true"></i>
            <span>Précédent</span>
          </router-link>

          <router-link
            :to="tocTo"
            class="capsules-ir-nav__btn capsules-ir-nav__btn--secondary"
          >
            <i class="pi pi-list" aria-hidden="true"></i>
            <span>Sommaire</span>
          </router-link>

          <router-link
            v-if="nextTo"
            :to="nextTo"
            class="capsules-ir-nav__btn"
          >
            <span>Suivant</span>
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>

        <div v-if="progressLabel" class="capsules-ir-nav__progress">
          <div class="text-700 text-sm">
            <span class="text-900">{{ progressLabel }}</span>
            <span class="ml-2 text-600">{{ currentStepLabel }}</span>
          </div>
          <div class="capsules-ir-nav__bar" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
            <div class="capsules-ir-nav__barFill" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

defineProps({
  prevTo: { type: String, default: '' },
  nextTo: { type: String, default: '' },
  tocTo: { type: String, default: '/capsules-insuffisance-renale' },
})

const route = useRoute()

const LAST_PATH_KEY = 'capsules_ir_last_path'

watch(
  () => route.path,
  (path) => {
    if (!path) return
    if (path.startsWith('/capsules-insuffisance-renale/') && path !== '/capsules-insuffisance-renale') {
      try {
        localStorage.setItem(LAST_PATH_KEY, path)
      } catch (e) {
        return
      }
    }
  },
  { immediate: true }
)

const steps = [
  { to: '/capsules-insuffisance-renale/introduction', label: 'Introduction' },
  { to: '/capsules-insuffisance-renale/anatomie-physiologie', label: 'Anatomie et physiologie' },
  { to: '/capsules-insuffisance-renale/comprendre-ira-irc', label: 'Comprendre IRA et IRC' },
  { to: '/capsules-insuffisance-renale/chatbot', label: 'Conversation guidée' },
  { to: '/capsules-insuffisance-renale/activites-ira', label: 'Activités IRA' },
  { to: '/capsules-insuffisance-renale/activite-irc', label: 'Activité IRC' },
  { to: '/capsules-insuffisance-renale/validation-acquis-ira', label: 'Validation IRA' },
  { to: '/capsules-insuffisance-renale/validation-acquis-irc', label: 'Validation IRC' },
  { to: '/capsules-insuffisance-renale/synthese', label: 'Synthèse' },
  { to: '/capsules-insuffisance-renale/qcm-evaluatif', label: 'QCM évaluatif' },
]

const currentIndex = computed(() => steps.findIndex(s => s.to === route.path))
const progressLabel = computed(() => (currentIndex.value >= 0 ? `Étape ${currentIndex.value + 1}/${steps.length}` : ''))
const currentStepLabel = computed(() => (currentIndex.value >= 0 ? steps[currentIndex.value]?.label : ''))
const progressPercent = computed(() => (currentIndex.value >= 0 ? Math.round(((currentIndex.value + 1) / steps.length) * 100) : 0))
</script>

<style scoped>
.capsules-ir-nav {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.capsules-ir-nav__inner {
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  border-radius: 0.75rem;
  padding: 0.75rem;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.capsules-ir-nav__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  border: 1px solid var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.capsules-ir-nav__btn:hover {
  background: var(--surface-100);
  border-color: var(--primary-color);
}

.capsules-ir-nav__btn:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.capsules-ir-nav__btn--secondary {
  background: transparent;
}

.capsules-ir-nav__progress {
  min-width: 220px;
}

.capsules-ir-nav__bar {
  margin-top: 0.35rem;
  width: 100%;
  height: 8px;
  background: var(--surface-200);
  border-radius: 999px;
  overflow: hidden;
}

.capsules-ir-nav__barFill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 999px;
}
</style>
