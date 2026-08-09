<template>
  <div class="form-field" :class="[spanClass, { 'form-field--invalid': error, 'form-field--disabled': disabled }]">
    <label :for="forId">
      <span>{{ label }}</span>
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
      <span v-else-if="optionalLabel" class="form-field__optional">{{ optionalLabel }}</span>
    </label>
    <slot
      :control-attrs="controlAttrs"
      :describedby="descriptionIds"
      :invalid="Boolean(error)"
    />
    <small v-if="hint" :id="hintId" class="form-field__hint">{{ hint }}</small>
    <small v-if="error" :id="errorId" class="form-field__error" role="alert">{{ error }}</small>
    <small v-else-if="success" :id="successId" class="form-field__success" role="status">{{ success }}</small>
  </div>
</template>
<script setup>
import { computed, useId } from 'vue'
const props = defineProps({
  forId: { type: String, required: true },
  label: { type: String, required: true },
  required: Boolean,
  disabled: Boolean,
  optionalLabel: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
  span: { type: [Number, String], default: 6 }
})
const uid = useId()
const hintId = `${props.forId}-${uid}-hint`
const errorId = `${props.forId}-${uid}-error`
const successId = `${props.forId}-${uid}-success`
const descriptionIds = computed(() => [
  props.hint ? hintId : '',
  props.error ? errorId : '',
  !props.error && props.success ? successId : ''
].filter(Boolean).join(' ') || undefined)
const controlAttrs = computed(() => ({
  id: props.forId,
  disabled: props.disabled || undefined,
  'aria-describedby': descriptionIds.value,
  'aria-invalid': props.error ? 'true' : undefined,
  'aria-required': props.required ? 'true' : undefined
}))
const spanClass = computed(() => `form-field--span-${props.span}`)
</script>
<style scoped>
.form-field{grid-column:span 6;display:grid;align-content:start;gap:.45rem;min-width:0;flex:1 1 calc(50% - 1rem);padding:.375rem}.form-field--span-3{grid-column:span 3}.form-field--span-4{grid-column:span 4}.form-field--span-6{grid-column:span 6}.form-field--span-8{grid-column:span 8}.form-field--span-12{grid-column:1/-1}label{display:flex;align-items:baseline;gap:.35rem;color:var(--text-color);font-size:.875rem;font-weight:650;line-height:1.35}.form-field__required,.form-field__error{color:var(--red-500,#dc2626)}.form-field__optional{color:var(--text-color-secondary);font-size:.75rem;font-weight:500}.form-field__hint,.form-field__error,.form-field__success{margin:0;font-size:.8125rem;line-height:1.4}.form-field__hint{color:var(--text-color-secondary)}.form-field__success{color:var(--green-600,#15803d)}.form-field--disabled{opacity:.7}:deep(.p-inputtext),:deep(.p-dropdown),:deep(.p-multiselect),:deep(.p-calendar),:deep(.p-inputnumber),:deep(.p-password),:deep(textarea){width:100%;min-width:0}.form-field--invalid :deep(.p-inputtext),.form-field--invalid :deep(.p-dropdown),.form-field--invalid :deep(.p-multiselect),.form-field--invalid :deep(.p-calendar .p-inputtext),.form-field--invalid :deep(textarea){border-color:var(--red-500,#dc2626)}:deep(textarea){min-height:7rem;resize:vertical}@media(max-width:48rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8{grid-column:span 12;flex-basis:100%}}@media(max-width:40rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8,.form-field--span-12{grid-column:1}}
</style>
