<template>
  <div class="shared-follow-up">
    <span v-if="!student" class="follow-up-status">Chargement du suivi…</span>
    <details v-else>
      <summary>
        <span class="summary-label"><i class="pi pi-file-edit" aria-hidden="true"></i>{{ title }}</span>
        <span class="summary-count">{{ entries.length }}</span>
      </summary>
      <div class="follow-up-content">
        <p v-if="!entries.length" class="empty-copy">Aucun commentaire enregistré pour cet étudiant.</p>
        <section v-for="entry in entries" :key="entry.field" class="follow-up-entry">
          <div class="entry-heading">
            <h4>{{ entry.label }}</h4>
            <button type="button" class="edit-button" :aria-label="`Modifier ${entry.label}`" @click="$emit('edit', entry.field)">
              <i class="pi pi-pencil" aria-hidden="true"></i>Modifier
            </button>
          </div>
          <p>{{ entry.text }}</p>
        </section>
        <div class="add-follow-up">
          <label :for="selectId">Ajouter ou compléter une rubrique</label>
          <div class="add-controls">
            <select :id="selectId" v-model="selectedField">
              <option v-for="field in availableFields" :key="field.value" :value="field.value">{{ field.label }}</option>
            </select>
            <button type="button" class="add-button" @click="$emit('edit', selectedField)">
              <i class="pi pi-plus" aria-hidden="true"></i>Ouvrir
            </button>
          </div>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'

const props = defineProps({
  student: { type: Object, default: null },
  title: { type: String, default: 'Cas particuliers de l’étudiant' },
  excludedFields: { type: Array, default: () => [] }
})
defineEmits(['edit'])
const fields = [
  { value: 'info_etudiant', label: 'Remarques / Suivi LPP' },
  { value: 'pfp1', label: 'PFP1' }, { value: 'pfp1_prime', label: 'PFP1 bis' },
  { value: 'pfp2', label: 'PFP2' }, { value: 'pfp2_prime', label: 'PFP2 bis' },
  { value: 'pfp3', label: 'PFP3' }, { value: 'pfp3_prime', label: 'PFP3 bis' },
  { value: 'pfp4', label: 'PFP4' }, { value: 'pfp4_prime', label: 'PFP4 bis' },
  { value: 'sae', label: 'Suivi SAE' }
]
const selectedField = ref('info_etudiant')
const selectId = `follow-up-field-${Math.random().toString(36).slice(2, 9)}`
const visibleFields = computed(() => fields.filter(field => !props.excludedFields.includes(field.value)))
const entries = computed(() => visibleFields.value
  .map(field => ({ ...field, field: field.value, text: props.student?.[field.value]?.commentaire || '' }))
  .filter(entry => entry.text.trim()))
const availableFields = computed(() => {
  const empty = visibleFields.value.filter(field => !props.student?.[field.value]?.commentaire?.trim())
  return empty.length ? empty : visibleFields.value
})
watchEffect(() => {
  if (!availableFields.value.some(field => field.value === selectedField.value)) {
    selectedField.value = availableFields.value[0].value
  }
})
</script>

<style scoped>
.shared-follow-up { width: 100%; min-width: 0; max-width: 48rem; }
.follow-up-status, .empty-copy { color: var(--text-color-secondary); font-size: .875rem; }
details { max-width: 100%; box-sizing: border-box; border: 1px solid var(--surface-border); border-radius: 8px; background: var(--surface-card); }
summary { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-height: 44px; padding: .65rem .8rem; cursor: pointer; font-weight: 600; list-style: none; }
summary::-webkit-details-marker { display: none; }
summary:focus-visible, button:focus-visible, select:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
.summary-label { display: inline-flex; min-width: 0; align-items: center; gap: .5rem; overflow-wrap: anywhere; }
.summary-count { display: inline-grid; place-items: center; min-width: 1.6rem; min-height: 1.6rem; padding: 0 .35rem; border-radius: 999px; color: var(--primary-color-text); background: var(--primary-color); font-size: .75rem; }
.follow-up-content { padding: .25rem .85rem .85rem; border-top: 1px solid var(--surface-border); }
.follow-up-entry { padding: .75rem 0; border-bottom: 1px solid var(--surface-border); }
.entry-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
h4 { margin: 0; font-size: .875rem; }
p { white-space: pre-wrap; overflow-wrap: anywhere; margin: .45rem 0 0; line-height: 1.45; }
button, select { min-height: 40px; font: inherit; }
button { cursor: pointer; border: 1px solid var(--surface-border); border-radius: 6px; background: var(--surface-ground); color: var(--text-color); }
.edit-button { display: inline-flex; align-items: center; gap: .35rem; padding: .4rem .6rem; color: var(--primary-color); white-space: nowrap; }
.add-follow-up { display: grid; gap: .45rem; padding-top: .75rem; }
.add-follow-up label { font-size: .8rem; font-weight: 600; color: var(--text-color-secondary); }
.add-controls { display: flex; gap: .5rem; }
select { flex: 1; min-width: 0; padding: 0 .55rem; border: 1px solid var(--surface-border); border-radius: 6px; color: var(--text-color); background: var(--surface-card); }
.add-button { display: inline-flex; align-items: center; gap: .35rem; padding: 0 .7rem; color: var(--primary-color-text); background: var(--primary-color); border-color: var(--primary-color); }
@media (max-width: 640px) {
  .add-controls, .entry-heading { align-items: stretch; flex-direction: column; }
}
</style>
