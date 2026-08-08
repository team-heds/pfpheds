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
.form-field{grid-column:span 6;display:grid;align-content:start;gap:var(--app-space-2);min-width:0;flex:1 1 calc(50% - var(--app-space-4));padding:var(--app-space-2)}.form-field--span-3{grid-column:span 3}.form-field--span-4{grid-column:span 4}.form-field--span-6{grid-column:span 6}.form-field--span-8{grid-column:span 8}.form-field--span-12{grid-column:1/-1}label{display:flex;align-items:baseline;gap:var(--app-space-1);color:var(--app-color-text);font-size:var(--app-font-size-sm);font-weight:var(--app-font-weight-semibold);line-height:var(--app-line-height-ui)}.form-field__required,.form-field__error{color:var(--app-color-danger)}.form-field__optional{color:var(--app-color-text-muted);font-size:var(--app-font-size-xs);font-weight:var(--app-font-weight-medium)}.form-field__hint,.form-field__error,.form-field__success{margin:0;font-size:var(--app-font-size-xs);line-height:var(--app-line-height-ui)}.form-field__hint{color:var(--app-color-text-muted)}.form-field__success{color:var(--app-color-success)}.form-field--disabled{opacity:.7}:deep(.p-inputtext),:deep(.p-dropdown),:deep(.p-multiselect),:deep(.p-calendar),:deep(.p-inputnumber),:deep(.p-password),:deep(textarea){width:100%;min-width:0;min-height:var(--app-control-height)}.form-field--invalid :deep(.p-inputtext),.form-field--invalid :deep(.p-dropdown),.form-field--invalid :deep(.p-multiselect),.form-field--invalid :deep(.p-calendar .p-inputtext),.form-field--invalid :deep(textarea){border-color:var(--app-color-danger)}:deep(textarea){min-height:7rem;resize:vertical}@media(max-width:48rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8{grid-column:span 12;flex-basis:100%}}@media(max-width:40rem){.form-field,.form-field--span-3,.form-field--span-4,.form-field--span-6,.form-field--span-8,.form-field--span-12{grid-column:1}}
</style>
