<template>
  <transition name="slide-up">
    <aside v-if="showPrompt" class="pwa-install-prompt" aria-label="Installer l’application HEdS">
      <div class="pwa-install-content">
        <img :src="hedsIcon" alt="HEdS" class="pwa-logo" />
        <span class="pwa-text">{{ message }}</span>
        <button type="button" class="pwa-add-btn" @click="installPwa">Installer</button>
        <button type="button" class="pwa-close-btn" aria-label="Fermer l’invitation" @click="dismissPrompt">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
    </aside>
  </transition>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, watch } from 'vue';
import hedsIcon from '@/assets/images/hespicto.png'

const props = defineProps({
  forceVisible: { type: Boolean, default: false },
  message: { type: String, default: 'Installez HEdS sur votre écran d’accueil pour un accès plus rapide.' },
})
const emit = defineEmits(['install', 'dismiss'])
const showPrompt = ref(props.forceVisible);
let deferredPrompt = null;

function handleInstallPrompt(e) {
  e.preventDefault();
  deferredPrompt = e;
  showPrompt.value = true;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleInstallPrompt);
});

onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', handleInstallPrompt))
watch(() => props.forceVisible, (visible) => { showPrompt.value = visible })

function dismissPrompt() {
  showPrompt.value = false
  emit('dismiss')
}

function installPwa() {
  emit('install')
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      showPrompt.value = false;
      deferredPrompt = null;
    });
  }
}
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 32px;
  left: 0;
  width: 100vw;
  z-index: 9999;
  display: flex;
  justify-content: center;
  pointer-events: none;
}
.pwa-install-content {
  background: var(--surface-card);
  color: var(--text-color);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  box-shadow: 0 16px 40px rgba(2, 12, 27, .28);
  padding: .85rem 1rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  width: min(42rem, calc(100vw - 2rem));
  pointer-events: auto;
  font-size: 1.07rem;
}
.pwa-logo {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #fff;
  object-fit: cover;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}
.pwa-text {
  flex: 1;
  font-weight: 500;
  line-height: 1.3;
}
.pwa-add-btn {
  min-height: 2.75rem;
  background: var(--primary-color);
  color: var(--primary-color-text, #071426);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: filter .2s ease, transform .2s ease;
}
.pwa-add-btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}
.pwa-close-btn {
  background: transparent;
  color: var(--text-color-secondary);
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  margin-left: 0.4rem;
  cursor: pointer;
  transition: color .15s, background .15s;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pwa-close-btn:hover {
  color: var(--text-color);
  background: var(--surface-hover);
}
.pwa-add-btn:focus-visible,
.pwa-close-btn:focus-visible { outline: 3px solid color-mix(in srgb, var(--primary-color) 35%, transparent); outline-offset: 2px; }
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(.38,1.15,.7,1), opacity 0.25s;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(80px);
}
@media (max-width: 600px) {
  .pwa-install-content {
    display: grid;
    grid-template-columns: auto 1fr auto;
    padding: .8rem;
    font-size: 0.97rem;
    gap: .75rem;
  }
  .pwa-logo {
    width: 32px;
    height: 32px;
  }
  .pwa-add-btn { grid-column: 1 / -1; grid-row: 2; width: 100%; }
  .pwa-close-btn { grid-column: 3; grid-row: 1; }
}
</style>
