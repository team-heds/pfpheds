<template>
  <section class="m-inst" aria-label="Institutions">
    <div class="m-inst__switch" role="tablist" aria-label="Vues de l’onglet Institutions">
      <button
        v-for="view in VIEWS"
        :id="`m-inst-tab-${view.key}`"
        :key="view.key"
        type="button"
        role="tab"
        :aria-selected="state.view === view.key ? 'true' : 'false'"
        :aria-controls="`m-inst-panel-${view.key}`"
        @click="state.view = view.key"
      >{{ view.label }}</button>
    </div>

    <div class="m-inst__panels">
      <InstitutionListView
        v-show="state.view === 'list'"
        id="m-inst-panel-list"
        role="tabpanel"
        aria-labelledby="m-inst-tab-list"
        :active="active && state.view === 'list'"
      />
      <!-- Chargées à la première ouverture, puis gardées. -->
      <MyStagesView
        v-if="opened.has('stages')"
        v-show="state.view === 'stages'"
        id="m-inst-panel-stages"
        role="tabpanel"
        aria-labelledby="m-inst-tab-stages"
        :active="active && state.view === 'stages'"
      />
      <DocumentsListView
        v-if="opened.has('documents')"
        v-show="state.view === 'documents'"
        id="m-inst-panel-documents"
        role="tabpanel"
        aria-labelledby="m-inst-tab-documents"
        :active="active && state.view === 'documents'"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import InstitutionListView from '@/mobile/institutions/InstitutionListView.vue'
import MyStagesView from '@/mobile/institutions/MyStagesView.vue'
import DocumentsListView from '@/mobile/institutions/DocumentsListView.vue'
import { useMobileInstitutionsStore } from '@/mobile/institutions/mobileInstitutionsStore'

const VIEWS = [
  { key: 'list', label: 'Institutions' },
  { key: 'stages', label: 'Mes stages' },
  { key: 'documents', label: 'Documents' },
]

defineProps({
  /** L'onglet reste en mémoire quand on en change : vrai quand il est affiché. */
  active: { type: Boolean, default: true },
})

const state = useMobileInstitutionsStore()
const opened = ref(new Set([state.view]))
watch(() => state.view, (view) => {
  if (!opened.value.has(view)) opened.value = new Set([...opened.value, view])
})
</script>

<style scoped>
.m-inst {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--m-bg);
}
.m-inst__switch {
  display: flex;
  flex-shrink: 0;
  margin: 2px 16px 8px;
  padding: 4px;
  border-radius: 14px;
  background: var(--m-surface);
}
.m-inst__switch button {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 0 4px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
}
.m-inst__switch button[aria-selected='true'] {
  background: var(--m-raised);
  color: var(--m-fg);
  font-weight: 600;
}
.m-inst__switch button:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-inst__panels {
  position: relative;
  flex: 1;
  min-height: 0;
}
/* Chaque vue a sa propre zone de défilement, gardée quand on change de vue. */
.m-inst__panels :deep(.m-inst-view) {
  position: absolute;
  inset: 0;
  padding: 0 16px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.m-inst__panels :deep(.m-inst-view::-webkit-scrollbar) {
  display: none;
}
</style>
