<template>
  <div class="image-field" :class="{ 'image-field--wide': wide }">
    <span :id="labelId" class="image-field__label">{{ label }}</span>
    <div class="image-field__row">
      <div class="image-field__preview" :class="{ 'image-field__preview--contain': contain }">
        <img v-if="preview && !broken" :src="preview" alt="" @error="broken = true" />
        <i v-else class="pi pi-image" aria-hidden="true" />
      </div>
      <div class="image-field__actions">
        <input ref="input" class="image-field__input" type="file" accept="image/jpeg,image/png,image/webp" :aria-labelledby="labelId" @change="onFile" />
        <button type="button" class="image-field__button" :disabled="busy" @click="input?.click()">
          <i :class="busy ? 'pi pi-spin pi-spinner' : 'pi pi-upload'" aria-hidden="true" />
          {{ busy ? 'Envoi en cours…' : modelValue ? 'Changer la photo' : 'Choisir une photo' }}
        </button>
        <button v-if="modelValue" type="button" class="image-field__button image-field__button--quiet" :disabled="busy" @click="clear">
          <i class="pi pi-times" aria-hidden="true" />Retirer
        </button>
      </div>
    </div>
    <p v-if="message" class="image-field__message" :class="{ 'image-field__message--error': failed }" role="status">{{ message }}</p>
    <p v-else class="image-field__hint">JPEG, PNG ou WebP. La photo est allégée automatiquement.</p>
  </div>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'
import { uploadAlpinImage } from '@/service/alpinPhysioMediaService'
import { resolveAlpinImage } from '@/utils/alpinPhysioMedia'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  folder: { type: String, default: 'site' },
  wide: Boolean,
  contain: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const labelId = useId()
const input = ref(null)
const busy = ref(false)
const failed = ref(false)
const broken = ref(false)
const message = ref('')
const preview = computed(() => resolveAlpinImage(props.modelValue))

watch(() => props.modelValue, () => { broken.value = false })

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  busy.value = true
  failed.value = false
  message.value = ''
  try {
    emit('update:modelValue', await uploadAlpinImage(file, props.folder))
    message.value = 'Photo envoyée. Pensez à enregistrer.'
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
  message.value = 'Photo retirée. Pensez à enregistrer.'
}
</script>

<style scoped>
.image-field{display:flex;flex-direction:column;gap:.4rem;min-width:0;color:#f7f9fc}
.image-field--wide{grid-column:1/-1}
.image-field__label{font-size:.72rem;font-weight:700}
.image-field__row{display:flex;align-items:center;gap:.75rem;min-width:0}
.image-field__preview{flex:0 0 auto;width:96px;height:72px;display:grid;place-items:center;overflow:hidden;color:#8294aa;background:#071426;border:1px solid #294866;border-radius:.55rem;font-size:1.3rem}
.image-field__preview img{width:100%;height:100%;display:block;object-fit:cover}
.image-field__preview--contain img{object-fit:contain;background:#fff}
.image-field__actions{display:flex;flex-wrap:wrap;gap:.5rem;min-width:0}
.image-field__input{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.image-field__button{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border:1px solid #f3c300;border-radius:.55rem;color:#0b213f;background:#f3c300;font:inherit;font-size:.8rem;font-weight:700;cursor:pointer}
.image-field__button--quiet{color:#f7f9fc;background:transparent;border-color:#294866}
.image-field__button:disabled{cursor:progress;opacity:.65}
.image-field__button:focus-visible{outline:3px solid #f3c300;outline-offset:2px}
.image-field__button--quiet:focus-visible{outline-color:#64d0d8}
.image-field__hint,.image-field__message{margin:0;color:#aab8c9;font-size:.72rem;line-height:1.4}
.image-field__message{color:#c8f7d9}
.image-field__message--error{color:#ffc7c7}
@media(max-width:720px){.image-field--wide{grid-column:1}}
</style>
