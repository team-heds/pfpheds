<template>
  <div class="mobile-lang-apps-root">
    <Navbar />
    <div v-if="isMobile" class="mobile-lang-apps">
      <HeaderIcons />
      <button class="back-btn" @click="goBack">
        <i class="pi pi-arrow-left"></i> Retour
      </button>
      <h2>Applications pour apprendre les langues</h2>
      <div class="apps-list">
        <a v-for="app in langApps" :key="app.name" :href="app.url" class="app-btn" target="_blank" rel="noopener">
          <img :src="app.logo" :alt="app.name" class="app-logo" />
          <span>{{ app.name }}</span>
        </a>
      </div>
    </div>
    <div v-else class="web-lang-apps">
      <div class="web-apps-grid">
        <a v-for="app in langApps" :key="app.name" :href="app.url" class="web-app-card" target="_blank" rel="noopener">
          <img :src="app.logo" :alt="app.name" class="web-app-logo" />
          <span class="web-app-label">{{ app.name }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';

const router = useRouter();
const isMobile = ref(false);
onMounted(() => {
  isMobile.value = window.innerWidth < 900;
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 900;
  });
});
const goBack = () => {
  router.push('/mobile-outils');
};

const langApps = [
  {
    name: 'Duolingo',
    url: 'https://www.duolingo.com/',
    logo: '/assets/images/app/duolingo.png',
  },
  {
    name: 'Babbel',
    url: 'https://www.babbel.com/',
    logo: '/assets/images/app/babbel.png',
  },
  {
    name: 'Busuu',
    url: 'https://www.busuu.com/',
    logo: '/assets/images/app/busuu.png',
  },
  {
    name: 'HelloTalk',
    url: 'https://www.hellotalk.com/',
    logo: '/assets/images/app/hellotalk.png',
  },
  {
    name: 'Quizlet',
    url: 'https://quizlet.com/en-gb/subjects/languages/german-flashcards-768a1c10-t01',
    logo: '/assets/images/app/quizlet.png',
  },
  {
    name: 'Rosetta Stone',
    url: 'https://www.rosettastone.com/',
    logo: '/assets/images/app/rosetta.png',
  },
  {
    name: 'Tandem',
    url: 'https://www.tandem.net/',
    logo: '/assets/images/app/tandem.png',
  },
];
</script>

<style scoped>
.mobile-lang-apps-root {
  min-height: 100vh;
  background: none !important;
  overflow-y: auto;
  padding-top: 10px;
}
.mobile-lang-apps {
  background: none !important;
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 3.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.mobile-lang-apps::-webkit-scrollbar {
  display: none;
}
.back-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--primary-color, #2a7ff3);
  font-size: 1.1em;
  margin: 1rem 0 0 0.5rem;
  cursor: pointer;
  gap: 6px;
}
h2 {
  text-align: center;
  margin: 1.5rem 0 1rem 0;
  font-size: 1.3em;
}
.apps-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 1.1rem 0.7rem 2.5rem 0.7rem;
}
.app-btn {
  display: flex;
  align-items: center;
  background: var(--surface-card, #fff);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(60,60,60,0.08);
  text-decoration: none;
  color: var(--text-color, #222);
  padding: 14px 14px;
  font-size: 1.08em;
  font-weight: 500;
  gap: 16px;
  transition: box-shadow 0.18s;
}
.app-btn:hover {
  box-shadow: 0 6px 32px rgba(60,60,60,0.13);
}
.app-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}
.web-title {
  font-size: 2rem;
  font-weight: bold;
  margin: 2.5rem 0 2.5rem 0;
  display: flex;
  align-items: center;
  color: var(--text-color, #222);
}
.web-apps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 2.2rem;
  padding: 10rem 2.5rem 2rem;
  max-width: 1100px;
  margin: 0 auto;
}
.web-app-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--surface-card, #fff);
  border-radius: 1.1rem;
  box-shadow: 0 2px 14px rgba(60,60,60,0.10);
  padding: 2rem 1rem 1.2rem 1rem;
  text-decoration: none;
  color: var(--text-color, #222);
  transition: box-shadow 0.16s, transform 0.13s;
  border: 1.5px solid #f3c30022;
}
.web-app-card:hover {
  box-shadow: 0 8px 34px rgba(60,60,60,0.16);
  transform: translateY(-4px) scale(1.04);
}
.web-app-logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 1.1rem;
  box-shadow: 0 2px 8px rgba(212,159,63,0.09);
  background: #fff;
}
.web-app-label {
  font-size: 1.13em;
  font-weight: 600;
  color: var(--text-color, #222);
  text-align: center;
  letter-spacing: 0.01em;
}
@media (max-width: 900px) {
  .web-apps-grid {
    gap: 1rem;
    padding: 0 0.5rem 1.2rem 0.5rem;
  }
  .web-title {
    font-size: 1.3rem;
    margin: 1.1rem 0 1.1rem 0;
  }
}
</style>
