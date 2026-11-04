<template>
  <div class="qr-page-wrapper">
    <Navbar v-if="showNavbar" />
    <main class="qr-workspace">
      <header class="qr-header">
        <h1>Générateur de QR code</h1>
        <p>Créez un QR code personnalisé et téléchargez-le au format PNG.</p>
      </header>

      <div class="qr-layout">
        <section class="qr-preview" aria-label="Aperçu du QR code">
          <canvas ref="canvas" :width="size" :height="size"></canvas>
          <p v-if="renderError" class="qr-error" role="alert">{{ renderError }}</p>
          <p v-else class="qr-preview-help">Aperçu actualisé automatiquement</p>
        </section>

        <form class="qr-form" @submit.prevent="downloadPng">
          <div class="field">
            <label for="qr-url">Lien à encoder</label>
            <InputText id="qr-url" v-model="url" type="url" placeholder="https://…" class="w-full" />
          </div>

          <div class="color-grid">
            <div class="field color-field">
              <label for="qr-fg-color">Couleur du QR</label>
              <div class="color-picker-wrapper">
                <ColorPicker inputId="qr-fg-color" v-model="fgColor" format="hex" />
                <InputText v-model="fgColor" aria-label="Couleur du QR en hexadécimal" maxlength="7" class="hex-input" />
              </div>
            </div>
            <div class="field color-field">
              <label for="qr-bg-color">Couleur du fond</label>
              <div class="color-picker-wrapper">
                <ColorPicker inputId="qr-bg-color" v-model="bgColor" format="hex" :disabled="transparentBg" />
                <InputText v-model="bgColor" aria-label="Couleur du fond en hexadécimal" maxlength="7" class="hex-input" :disabled="transparentBg" />
              </div>
            </div>
          </div>

          <div class="transparent-field">
            <Checkbox inputId="qr-transparent" v-model="transparentBg" :binary="true" />
            <label for="qr-transparent">Fond transparent</label>
          </div>

          <div class="field">
            <label for="qr-size">Taille du fichier</label>
            <InputNumber inputId="qr-size" v-model="size" :min="120" :max="1000" suffix=" px" class="w-full" />
            <small>Entre 120 et 1 000 pixels.</small>
          </div>

          <Button type="submit" label="Télécharger en PNG" icon="pi pi-download" :disabled="!url || Boolean(renderError)" />
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import ColorPicker from 'primevue/colorpicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Navbar from '@/components/common/utils/Navbar.vue'

const props = defineProps({
  showNavbar: { type: Boolean, default: true },
  initialUrl: { type: String, default: 'https://www.hevs.ch/fr/hautes-ecoles/haute-ecole-de-sante/' },
  initialSize: { type: Number, default: 240 },
  initialForeground: { type: String, default: '#071426' },
  initialBackground: { type: String, default: '#ffffff' },
  initialTransparent: { type: Boolean, default: false },
})

const url = ref(props.initialUrl)
const size = ref(props.initialSize)
const canvas = ref(null)
const fgColor = ref(props.initialForeground)
const bgColor = ref(props.initialBackground)
const transparentBg = ref(props.initialTransparent)
const renderError = ref('')

const normalizeHex = (value) => {
  if (!value) return null
  const normalized = value.startsWith('#') ? value : `#${value}`
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : null
}

const renderQr = async () => {
  if (!canvas.value || !url.value) return
  const dark = normalizeHex(fgColor.value)
  const light = normalizeHex(bgColor.value)
  if (!dark || (!transparentBg.value && !light)) {
    renderError.value = 'Utilisez une couleur hexadécimale à six caractères, par exemple #071426.'
    return
  }

  try {
    renderError.value = ''
    await QRCode.toCanvas(canvas.value, url.value, {
      width: size.value,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark, light: transparentBg.value ? '#00000000' : light },
    })
  } catch {
    renderError.value = 'Le QR code ne peut pas être généré avec ces informations.'
  }
}

watch([url, size, fgColor, bgColor, transparentBg], renderQr)
onMounted(renderQr)

async function downloadPng() {
  if (!canvas.value || renderError.value) return
  await renderQr()
  const link = document.createElement('a')
  link.download = 'qr-code.png'
  link.href = canvas.value.toDataURL('image/png')
  link.click()
}
</script>

<style scoped>
.qr-page-wrapper {
  min-height: 100vh;
  width: 100%;
}

.qr-workspace {
  width: min(100% - 2rem, 64rem);
  margin-inline: auto;
  padding-block: clamp(2rem, 6vw, 5rem);
}

.qr-header { margin-bottom: 2rem; }

.qr-header h1 {
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  letter-spacing: -.03em;
}

.qr-header p {
  max-width: 58ch;
  margin: .65rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.6;
}

.qr-layout {
  display: grid;
  grid-template-columns: minmax(18rem, .85fr) minmax(20rem, 1.15fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: start;
}

.qr-preview {
  display: grid;
  place-items: center;
  gap: 1rem;
  min-height: 24rem;
  padding: 2rem;
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  background: var(--surface-card);
}

canvas {
  width: min(100%, 15rem);
  height: auto;
  aspect-ratio: 1;
  border-radius: .5rem;
}

.qr-preview-help,
.qr-error {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: .875rem;
  text-align: center;
}

.qr-error { color: #f87171; }

.qr-form {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  border-top: 1px solid var(--surface-border);
  border-bottom: 1px solid var(--surface-border);
}

.field { display: grid; gap: .5rem; }

.field label,
.transparent-field label {
  color: var(--text-color);
  font-weight: 600;
}

.field small { color: var(--text-color-secondary); }

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.color-picker-wrapper,
.transparent-field {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.hex-input { min-width: 0; width: 8rem; }

@media (max-width: 44rem) {
  .qr-layout { grid-template-columns: 1fr; }
  .qr-preview { min-height: 19rem; padding: 1.25rem; }
  .qr-form { padding-inline: 0; }
}

@media (max-width: 28rem) {
  .color-grid { grid-template-columns: 1fr; }
}
</style>
