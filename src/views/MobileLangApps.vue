<template>
  <div class="mobile-lang-apps">
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
</template>

<script setup>
import HeaderIcons from '@/components/Utils/HeaderIcons.vue';
import { useRouter } from 'vue-router';

const router = useRouter();
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
.mobile-lang-apps {
  background: var(--surface-ground, #f6f7fb);
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 3.5rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.mobile-lang-apps::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
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
</style>
