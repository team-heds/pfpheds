<template>
  <div class="form-field" :class="spanClass">
    <label :for="forId">{{ label }} <span v-if="required" aria-hidden="true">*</span></label>
    <slot :describedby="descriptionIds" :invalid="Boolean(error)" />
    <small v-if="hint" :id="hintId" class="form-field__hint">{{ hint }}</small>
    <small v-if="error" :id="errorId" class="form-field__error" role="alert">{{ error }}</small>
  </div>
</template>
<script setup>
import { computed, useId } from 'vue'
const props = defineProps({ forId: { type: String, required: true }, label: { type: String, required: true }, required: Boolean, hint: { type: String, default: '' }, error: { type: String, default: '' }, span: { type: [Number, String], default: 6 } })
const uid = useId(); const hintId = `${props.forId}-${uid}-hint`; const errorId = `${props.forId}-${uid}-error`
const descriptionIds = computed(() => [props.hint ? hintId : '', props.error ? errorId : ''].filter(Boolean).join(' ') || undefined)
const spanClass = computed(() => `form-field--span-${props.span}`)
</script>
<style scoped>
.form-field{grid-column:span 6;display:grid;align-content:start;gap:.45rem;min-width:0;flex:1 1 calc(50% - 1rem);padding:.375rem}.form-field--span-3{grid-column:span 3}.form-field--span-4{grid-column:span 4}.form-field--span-6{grid-column:span 6}.form-field--span-8{grid-column:span 8}.form-field--span-12{grid-column:1/-1}label{color:var(--text-color);font-size:.875rem;font-weight:650;line-height:1.35}label span,.form-field__error{color:var(--red-500,#dc2626)}.form-field__hint,.form-field__error{margin:0;font-size:.8125rem;line-height:1.4}.form-field__hint{color:var(--text-color-secondary)}:deep(.p-inputtext),:deep(.p-dropdown),:deep(.p-multiselect),:deep(.p-calendar),:deep(.p-inputnumber),:deep(.p-password),:deep(textarea){width:100%;min-width:0}:deep(textarea){min-height:7rem;resize:vertical}@media(max-width:48rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8{grid-column:span 12;flex-basis:100%}}@media(max-width:40rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8,.form-field--span-12{grid-column:1}}
</style>
