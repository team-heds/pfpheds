<template>
  <transition name="slide-up">
    <div v-if="showPrompt" class="pwa-install-prompt">
      <div class="pwa-install-content">
        <img src="/assets/images/hespicto.png" alt="HEdS" class="pwa-logo" />
        <span class="pwa-text">Ajoutez <b>HEdS</b> à votre écran d'accueil pour une expérience optimale !</span>
        <button class="pwa-add-btn" @click="installPwa">Ajouter</button>
        <button class="pwa-close-btn" @click="showPrompt = false" title="Fermer">×</button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const showPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showPrompt.value = true;
  });
});

function installPwa() {
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
  background: #111827;
  color: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.20);
  padding: 1rem 2rem 1rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 1.2rem;
  min-width: 320px;
  max-width: 90vw;
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
  background: linear-gradient(90deg, #fbbf24 0%, #6366f1 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(99,102,241,0.10);
  transition: background .2s, box-shadow .2s;
}
.pwa-add-btn:hover {
  background: linear-gradient(90deg, #f59e42 0%, #4f46e5 100%);
  box-shadow: 0 4px 16px rgba(99,102,241,0.14);
}
.pwa-close-btn {
  background: transparent;
  color: #fff;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  margin-left: 0.4rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity .15s;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pwa-close-btn:hover {
  opacity: 1;
  background: #222b3a;
}
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.35s cubic-bezier(.38,1.15,.7,1), opacity 0.25s;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(80px);
}
@media (max-width: 600px) {
  .pwa-install-content {
    min-width: 0;
    padding: 0.8rem 0.7rem 0.8rem 0.7rem;
    font-size: 0.97rem;
  }
  .pwa-logo {
    width: 32px;
    height: 32px;
  }
}
</style>
