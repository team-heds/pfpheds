<template>
  <div class="document-field" :class="{ 'document-field--wide': wide }">
    <span :id="labelId" class="document-field__label">{{ label }}</span>
    <div class="document-field__row">
      <a v-if="modelValue" class="document-field__link" :href="modelValue" target="_blank" rel="noopener noreferrer"><i class="pi pi-file-pdf" aria-hidden="true" />Voir le document actuel</a>
      <span v-else class="document-field__none"><i class="pi pi-file" aria-hidden="true" />Aucun document</span>
      <input ref="input" class="document-field__input" type="file" accept="application/pdf" :aria-labelledby="labelId" @change="onFile" />
      <button type="button" class="document-field__button" :disabled="busy" @click="input?.click()">
        <i :class="busy ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" aria-hidden="true" />{{ busy ? 'Envoi en cours…' : modelValue ? 'Remplacer le PDF' : 'Choisir un PDF' }}
      </button>
      <button v-if="modelValue" type="button" class="document-field__button document-field__button--quiet" :disabled="busy" @click="clear"><i class="pi pi-times" aria-hidden="true" />Retirer</button>
    </div>
    <p v-if="message" class="document-field__message" :class="{ 'document-field__message--error': failed }" role="status">{{ message }}</p>
    <p v-else class="document-field__hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { ref, useId } from 'vue'
import { uploadAlpinDocument } from '@/service/alpinPhysioMediaService'

defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  hint: { type: String, default: 'PDF de 5 Mo au maximum.' },
  wide: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const labelId = useId()
const input = ref(null)
const busy = ref(false)
const failed = ref(false)
const message = ref('')

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  busy.value = true
  failed.value = false
  message.value = ''
  try {
    emit('update:modelValue', await uploadAlpinDocument(file))
    message.value = 'Document envoyé. Pensez à publier les modifications.'
  } catch (error) {
    failed.value = true
    message.value = `Envoi impossible : ${error.message}`
  } finally {
    busy.value = false
  }
}

function clear() {
  emit('update:modelValue', '')
  failed.value = false
  message.value = 'Document retiré. Pensez à publier les modifications.'
}
</script>

<style scoped>
.document-field{display:flex;flex-direction:column;gap:.4rem;min-width:0;color:#f7f9fc}
.document-field--wide{grid-column:1/-1}
.document-field__label{font-size:.72rem;font-weight:700}
.document-field__row{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.document-field__link,.document-field__none{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .85rem;background:#071426;border:1px solid #294866;border-radius:.55rem;font-size:.8rem}
.document-field__link{color:#f3c300;font-weight:700}
.document-field__none{color:#aab8c9}
.document-field__input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.document-field__button{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border:1px solid #f3c300;border-radius:.55rem;color:#0b213f;background:#f3c300;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.document-field__button--quiet{color:#f7f9fc;background:transparent;border-color:#294866}
.document-field__button:disabled{cursor:progress;opacity:.65}
.document-field__button:focus-visible,.document-field__link:focus-visible{outline:3px solid #f3c300;outline-offset:2px}
.document-field__hint,.document-field__message{margin:0;color:#aab8c9;font-size:.72rem;line-height:1.4}
.document-field__message{color:#c8f7d9}
.document-field__message--error{color:#ffc7c7}
@media(max-width:720px){.document-field--wide{grid-column:1}}
</style>
