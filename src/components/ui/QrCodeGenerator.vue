<template>
  <div class="qr-page-wrapper">
    <Navbar v-if="navbarAvailable" />
    <div class="landing-bg">
      <div class="landing-container">
        <h1 class="p-text-center">Générateur de QR Code</h1>
        <p class="p-text-center p-mb-4">Créez facilement des QR codes personnalisés et téléchargez-les en un clic.</p>
        <div class="p-grid p-justify-center">
          <div class="p-col-12 p-md-6 p-lg-4">
            <div class="qr-card p-card">
              <canvas ref="canvas" :width="size" :height="size"></canvas>
            </div>
          </div>
          <div class="p-col-12 p-md-6 p-lg-4">
            <div class="p-fluid p-formgrid p-grid form-card">
            <div class="p-field p-col-12">
              <label for="url">Lien à encoder</label>
              <InputText id="url" v-model="url" placeholder="https://..." class="p-inputtext-lg" />
            </div>
            <div class="p-field p-col-6 color-field">
              <label for="fgColor">Couleur du QR</label>
              <div class="color-picker-wrapper">
                <ColorPicker id="fgColor" v-model="fgColor" format="hex" class="pretty-color-picker" />
                <InputText v-model="fgColor" maxlength="7" class="hex-input" />
              </div>
            </div>
            <div class="p-field p-col-6 color-field">
              <label for="bgColor">Fond</label>
              <div class="color-picker-wrapper">
                <ColorPicker id="bgColor" v-model="bgColor" format="hex" class="pretty-color-picker" />
                <InputText v-model="bgColor" maxlength="7" class="hex-input" />
              </div>
            </div>
            <div class="p-field-checkbox p-col-12">
              <Checkbox inputId="transparentBg" v-model="transparentBg" :binary="true" />
              <label for="transparentBg">Fond transparent</label>
            </div>
            <br>
            <div class="p-field p-col-12">
              <label for="size">Taille (px)</label>
              <InputNumber id="size" v-model="size" :min="10" :max="1000" class="p-inputtext-lg" />
            </div>
            <div class="p-field p-col-12">
              <Button label="Télécharger en PNG" class="p-button-primary p-button-lg" @click="downloadPng" :disabled="!url" icon="pi pi-download" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import QRCode from 'qrcode'
import InputText from 'primevue/inputtext'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Navbar from '@/components/common/utils/Navbar.vue';

// Variables réactives
const url = ref('https://example.com')
const size = ref(240)
const canvas = ref(null)
const fgColor = ref('#000000')
const bgColor = ref('#ffffff')
const transparentBg = ref(false)
const navbarAvailable = ref(true)

const renderQr = async () => {
  if (!canvas.value) return
  await QRCode.toCanvas(canvas.value, url.value, {
    width: size.value,
    margin: 0,
    errorCorrectionLevel: 'H',
    color: {
      dark: fgColor.value,
      light: transparentBg.value ? '#00000000' : bgColor.value,
    }
  })
}

watch([url, size, fgColor, bgColor, transparentBg], renderQr)
onMounted(renderQr)

function downloadPng() {
  if (!canvas.value) {
    alert('QR code non généré !')
    return
  }
  renderQr()
  setTimeout(() => {
    const link = document.createElement('a')
    link.download = 'qr-code.png'
    link.href = canvas.value.toDataURL('image/png')
    link.click()
  }, 120)
}
</script>

<style scoped>
.qr-page-wrapper {
  min-height: 100vh;
  width: 100%;
}

.landing-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.landing-container {
  background: var(--surface-card, #232946);
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 2.5rem 2rem;
  max-width: 900px;
  width: 100%;
  color: var(--text-color, #ffffff);
}

.landing-container h1 {
  color: var(--text-color, #ffffff);
  font-size: 2rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.landing-container p {
  color: var(--text-color-secondary, #cbd5e1);
  font-size: 1rem;
}
.qr-card {
  background: var(--surface-overlay, #2a2f4f);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

canvas {
  background: #ffffff;
  width: 240px;
  height: 240px;
  max-width: 100%;
  border-radius: 8px;
}

.form-card {
  background: var(--surface-card, #232946);
  border-radius: 12px;
  padding: 2rem 1rem 1rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-top: 1rem;
}
.p-field {
  margin-bottom: 1.5rem;
}

.p-field label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color, #ffffff);
  font-weight: 500;
  font-size: 0.95rem;
}

.color-field label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-color, #ffffff);
  font-weight: 500;
}
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.pretty-color-picker {
  border-radius: 8px;
  box-shadow: 0 0 0 2px var(--primary-color, #2196F3)33;
  overflow: hidden;
}
.hex-input {
  width: 90px;
  font-size: 1rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #ddd;
  background: var(--surface-overlay, #2a2f4f);
  color: #fff;
}

.p-field-checkbox label {
  color: var(--text-color, #ffffff);
  margin-left: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}
.p-button-lg {
  font-size: 1.15rem;
  padding: 0.75rem 2rem;
}
@media (max-width: 600px) {
  .landing-container {
    padding: 1rem 0.5rem;
  }
  .qr-card {
    padding: 1rem;
    min-height: 180px;
  }
  canvas {
    width: 160px;
    height: 160px;
  }
  .form-card {
    padding: 1rem 0.5rem;
  }
}
</style>
