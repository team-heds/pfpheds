<template>
  <div class="outils-root no-bg">
    <Navbar />

    <div v-if="isMobile">
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
    <div v-else>
      <div class="outils-grid">
        <router-link
          v-for="outil in outils"
          :key="outil.to"
          class="outil-tile"
          :to="outil.to"
        >
          <div class="outil-tile-inner prime-card">
            <div class="outil-tile-icon">
              <i :class="outil.icon"></i>
            </div>
            <div class="outil-tile-label">{{ outil.label }}</div>
            <div class="outil-tile-footer">
              <Button label="Accéder" icon="pi pi-arrow-right" class="p-button-text p-button-sm text-primary font-bold" />
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import Navbar from '@/components/Utils/Navbar.vue';
import Button from 'primevue/button';

const allOutils = [
  { to: '/institution', icon: 'pi pi-building', label: 'Institutions' },
  { to: '/map', icon: 'pi pi-map', label: 'Carte' },
  { to: '/documents_pfp', icon: 'pi pi-file', label: 'Documents' },
  { to: '/event-management', icon: 'pi pi-calendar', label: 'Event' },
  { to: '/qr', icon: 'pi pi-qrcode', label: 'QR code' },
  { to: '/votation_lese', icon: 'pi pi-check-square', label: 'Votation' },
  { to: '/game', icon: 'pi pi-star', label: 'Game' },
  { to: '/lang-apps', icon: 'pi pi-globe', label: 'Apps langues' },
  // Ajoute ici d'autres outils si besoin
];

const isMobile = ref(false);
onMounted(() => {
  isMobile.value = window.innerWidth < 900;
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 900;
  });
});

const outils = computed(() => {
  if (isMobile.value) return allOutils;
  // Desktop: ne garder que QR code, Game, Apps Langues
  return allOutils.filter(o => ['QR code', 'Game', 'Apps langues'].includes(o.label));
});

const showVoirPlus = computed(() => outils.value.length >= 12);
</script>

<style scoped>
.outils-root {
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 3.5rem;
}
.outils-root::-webkit-scrollbar {
  display: none;
}
.no-bg {
  background: none !important;
}
.outils-header {
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
  padding-bottom: 1.2rem;
  background: none;
}
.outils-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 4.2rem;
  padding: 10rem 0.7rem 0 0.7rem;
  background: none;
}
.outil-tile {
  text-decoration: none;
  transition: transform 0.13s, box-shadow 0.13s;
  border-radius: 1.1rem;
  background: none;
  display: flex;
  align-items: stretch;
  min-height: 120px;
}
.outil-tile-inner.prime-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background: var(--surface-card, #fff);
  border-radius: 1.1rem;
  box-shadow: 0 2px 10px rgba(60,60,60,0.10);
  padding: 1.1rem 0.6rem 0.6rem 0.6rem;
  transition: box-shadow 0.17s, transform 0.13s;
  position: relative;
  border: 1.2px solid #f3c30018;
}
.outil-tile:hover .prime-card {
  box-shadow: 0 6px 18px rgba(60,60,60,0.13);
  transform: translateY(-2px) scale(1.02);
}
.outil-tile-icon {
  font-size: 1.6em;
  background: linear-gradient(135deg, #f3c300 0%, #D49F3F 100%);
  color: #fff;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
  box-shadow: 0 2px 8px rgba(212,159,63,0.09);
}
.outil-tile-label {
  font-size: 1em;
  font-weight: 700;
  color: var(--text-color, #222);
  text-align: center;
  letter-spacing: 0.01em;
  margin-bottom: 0.3rem;
}
.outil-tile-footer {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 0.3rem;
}
/* Mobile styles (identique à avant) */
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
@media (max-width: 900px) {
  .outil-tile-inner.prime-card {
    padding: 0.7rem 0.3rem 0.4rem 0.3rem;
  }
  .outil-tile-icon {
    font-size: 1.1em;
    width: 28px;
    height: 28px;
  }
  .outils-grid {
    gap: 0.7rem;
    padding: 0.7rem 0.2rem 0 0.2rem;
  }
}
@media (max-width: 600px) {
  .outils-root {
    padding: 0.2rem;
  }
  .outils-header {
    padding-bottom: 0.7rem;
  }
  .outil-tile-inner.prime-card {
    padding: 0.5rem 0.15rem 0.2rem 0.15rem;
  }
  .outil-tile {
    min-height: 70px;
    border-radius: 0.7rem;
    padding: 0.4rem 0.1rem;
  }
  .outils-grid {
    gap: 0.4rem;
    padding: 0.4rem 0.1rem 0 0.1rem;
  }
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
