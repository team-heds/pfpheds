<template>
  <div class="capsules-ir-table-des-matieres">
    <div class="card">
      <div class="flex align-items-start justify-content-between flex-wrap gap-2">
        <div>
          <div class="text-900 font-semibold text-xl mb-2">Table des matières</div>
          <div class="text-600">Choisis une section pour commencer. Chaque étape contient du contenu “fake” pour tester l’UX.</div>
        </div>

        <div class="flex align-items-center gap-2 flex-wrap">
          <router-link
            v-if="resumeItem"
            :to="resumeItem.to"
            class="capsules-ir-toc__resume"
            :aria-label="`Reprendre: ${resumeItem.label}`"
          >
            <i class="pi pi-refresh" aria-hidden="true"></i>
            <span>Reprendre</span>
          </router-link>

          <router-link
            to="/capsules-insuffisance-renale/introduction"
            class="capsules-ir-toc__start"
          >
            <i class="pi pi-play" aria-hidden="true"></i>
            <span>Commencer</span>
          </router-link>
        </div>
      </div>

      <div class="grid mt-3">
        <div v-for="(item, idx) in items" :key="item.key" class="col-12 md:col-6 lg:col-4">
          <router-link
            :to="item.to"
            class="capsules-ir-toc__card"
            :aria-label="`Ouvrir la section ${idx + 1}: ${item.label}`"
          >
            <div class="flex align-items-start justify-content-between gap-2">
              <div class="capsules-ir-toc__badge">{{ idx + 1 }}</div>
              <div class="text-600 text-sm">{{ item.duration }}</div>
            </div>

            <div class="text-900 font-medium mt-2">{{ item.label }}</div>
            <div class="text-700 text-sm mt-2">{{ item.desc }}</div>

            <div class="flex align-items-center gap-2 mt-3 text-600">
              <span class="text-sm">Ouvrir</span>
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const LAST_PATH_KEY = 'capsules_ir_last_path'

const items = [
  {
    key: 'intro',
    label: 'Introduction',
    to: '/capsules-insuffisance-renale/introduction',
    duration: '3–5 min',
    desc: 'Objectifs, cas fil rouge et déroulé de la capsule.',
  },
  {
    key: 'anatomie',
    label: 'Anatomie et physiologie',
    to: '/capsules-insuffisance-renale/anatomie-physiologie',
    duration: '5–7 min',
    desc: 'Rappels essentiels sur le néphron et la filtration.',
  },
  {
    key: 'comprendre',
    label: 'Comprendre IRA et IRC',
    to: '/capsules-insuffisance-renale/comprendre-ira-irc',
    duration: '6–8 min',
    desc: 'Définitions, comparaison et mini-cas.',
  },
  {
    key: 'chatbot',
    label: 'Conversation guidée avec chatbot',
    to: '/capsules-insuffisance-renale/chatbot',
    duration: '5–8 min',
    desc: 'Simulation de questions/réponses pour structurer l’anamnèse.',
  },
  {
    key: 'activites-ira',
    label: 'Activités IRA',
    to: '/capsules-insuffisance-renale/activites-ira',
    duration: '8–10 min',
    desc: 'Tri des causes, lecture de bilan et plan d’action.',
  },
  {
    key: 'activite-irc',
    label: 'Activité IRC',
    to: '/capsules-insuffisance-renale/activite-irc',
    duration: '8–10 min',
    desc: 'Suivi, éducation patient et complications.',
  },
  {
    key: 'validation-ira',
    label: 'Validations des acquis IRA',
    to: '/capsules-insuffisance-renale/validation-acquis-ira',
    duration: '4–6 min',
    desc: 'Checklist + mini-cas de validation.',
  },
  {
    key: 'validation-irc',
    label: 'Validations des acquis IRC',
    to: '/capsules-insuffisance-renale/validation-acquis-irc',
    duration: '4–6 min',
    desc: 'Checklist + messages clés de prévention.',
  },
  {
    key: 'synthese',
    label: 'Synthèse',
    to: '/capsules-insuffisance-renale/synthese',
    duration: '3–5 min',
    desc: 'Red flags + mini-algorithme de décision.',
  },
  {
    key: 'qcm',
    label: 'QCM évaluatif',
    to: '/capsules-insuffisance-renale/qcm-evaluatif',
    duration: '5–7 min',
    desc: 'QCM “fake” pour tester l’ergonomie du quiz.',
  },
]

const resumePath = ref('')

onMounted(() => {
  try {
    resumePath.value = localStorage.getItem(LAST_PATH_KEY) || ''
  } catch (e) {
    resumePath.value = ''
  }
})

const resumeItem = computed(() => {
  if (!resumePath.value) return null
  return items.find(i => i.to === resumePath.value) || null
})
</script>

<style scoped>
.capsules-ir-table-des-matieres {
  width: 100%;
}

.capsules-ir-toc__resume {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.6rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color);
  text-decoration: none;
}

.capsules-ir-toc__resume:hover {
  border-color: var(--primary-color);
}

.capsules-ir-toc__resume:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.capsules-ir-toc__start {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.6rem;
  border: 1px solid var(--primary-color);
  background: var(--primary-color);
  color: var(--primary-color-text);
  text-decoration: none;
}

.capsules-ir-toc__start:hover {
  filter: brightness(0.95);
}

.capsules-ir-toc__start:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.capsules-ir-toc__card {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0.85rem;
  border-radius: 0.75rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  text-decoration: none;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
}

.capsules-ir-toc__card:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.capsules-ir-toc__card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.capsules-ir-toc__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  border-radius: 999px;
  background: var(--surface-200);
  color: var(--text-color);
  font-weight: 600;
}
</style>
