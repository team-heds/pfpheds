<template>
  <div class="mobile-outils-fb">
    <HeaderIcons />
    <div class="fb-grid">
      <router-link
        v-for="outil in outils"
        :key="outil.to"
        class="fb-card"
        :to="outil.to"
      >
        <span class="fb-icon"><i :class="outil.icon"></i></span>
        <span class="fb-label">{{ outil.label }}</span>
      </router-link>
    </div>
    <button v-if="showVoirPlus" class="fb-more-btn">Voir plus</button>
  </div>
</template>

<script setup>
import HeaderIcons from '@/components/Utils/HeaderIcons.vue';
import { computed } from 'vue';

const outils = [
  { to: '/institution', icon: 'pi pi-building', label: 'Institutions' },
  { to: '/map', icon: 'pi pi-map', label: 'Carte' },
  { to: '/documents_pfp', icon: 'pi pi-file', label: 'Documents' },
  { to: '/event', icon: 'pi pi-calendar', label: 'Event' },
  { to: '/qr', icon: 'pi pi-qrcode', label: 'QR code' },
  { to: '/votation_lese', icon: 'pi pi-check-square', label: 'Votation' },
  { to: '/game', icon: 'pi pi-star', label: 'Game' },
  // Ajoute ici d'autres outils si besoin
];

const showVoirPlus = computed(() => outils.length >= 12);
</script>

<style scoped>
.mobile-outils-fb {
  background: var(--surface-ground, #f6f7fb);
  min-height: 100vh;
  padding-bottom: 2.5rem;
}
.fb-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 1.1rem 0.7rem 0.7rem 0.7rem;
}
.fb-card {
  display: flex;
  align-items: center;
  background: var(--surface-card, #fff);
  border-radius: 22px;
  box-shadow: 0 4px 24px rgba(60,60,60,0.08);
  text-decoration: none;
  color: var(--text-color, #222);
  padding: 16px 15px;
  font-size: 1.08em;
  font-weight: 500;
  gap: 12px;
  transition: box-shadow 0.15s, transform 0.12s;
  border: none;
}
.fb-card:active, .fb-card:hover {
  box-shadow: 0 8px 28px rgba(60,60,60,0.13);
  transform: translateY(-2px) scale(1.03);
}
.fb-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  width: 40px;
  height: 40px;
  border-radius: 32%;
  margin-right: 4px;
  background: linear-gradient(135deg, #f3c300 0%, #D49F3F 100%);
}
.fb-icon i {
  color: #fff !important;
  font-size: 1.3em;
  filter: none;
  opacity: 1;
}
.app-bg-primary {
  background: var(--primary-100, #ede9fe);
}
.app-bg-secondary {
  background: var(--primary-200, #d1c4e9);
}
.app-bg-accent {
  background: var(--primary-300, #b39ddb);
}
.fb-label {
  flex: 1;
  font-size: 1.08em;
  font-weight: 500;
  color: var(--text-color, #222);
  text-align: left;
}
.fb-more-btn {
  display: block;
  width: 92%;
  margin: 28px auto 0 auto;
  padding: 13px 0 12px 0;
  border: none;
  border-radius: 22px;
  background: var(--surface-border, #e5e7eb);
  color: var(--text-color, #222);
  font-size: 1.13em;
  font-weight: 600;
  box-shadow: none;
  transition: background 0.16s;
}
.fb-more-btn:active, .fb-more-btn:hover {
  background: var(--surface-hover, #ececec);
}
@media (max-width: 600px) {
  .fb-grid {
    gap: 12px;
    padding: 0.7rem 0.3rem 0.5rem 0.3rem;
  }
  .fb-card {
    font-size: 0.98em;
    padding: 13px 9px;
    border-radius: 22px;
  }
  .fb-icon {
    width: 34px;
    height: 34px;
    font-size: 1.18em;
    border-radius: 32%;
  }
  .fb-more-btn {
    font-size: 1em;
    border-radius: 15px;
    margin-top: 18px;
  }
}
</style>
