<template>
  <Navbar />
  <div class="newsfeed-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>
    <!-- Zone centrale événement -->
    <div class="main-feed">
      <div class="event-management-page">
        <h2>Gestion des événements</h2>
        <Card class="event-form-card">
          <template #content>
            <form class="event-form" @submit.prevent="addEvent">
              <div class="form-group">
                <label>Titre</label>
                <InputText v-model="newEvent.title" required placeholder="Titre de l'événement" class="w-full" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <Textarea v-model="newEvent.description" required placeholder="Description" class="w-full" autoResize rows="3" />
              </div>
              <div class="form-group">
                <label>Date</label>
                <Calendar v-model="newEvent.date" dateFormat="dd/mm/yy" class="w-full" showIcon />
              </div>
              <Button type="submit" label="Créer" class="p-button-primary w-full mt-2" icon="pi pi-plus-circle" />
            </form>
          </template>
        </Card>
        <div class="event-list-scrollable">
          <h3>Événements à venir</h3>
          <div v-if="events.length === 0" class="empty">Aucun événement pour l'instant.</div>
          <div v-for="event in events" :key="event.id" class="event-card-beautiful">
            <div class="event-card-header">
              <span class="event-date-pill"><i class="pi pi-calendar"></i> {{ formatDate(event.date) }}</span>
              <Button icon="pi pi-heart" :label="event.likes.toString()" class="p-button-rounded p-button-text p-button-danger event-like-btn" :severity="event.liked ? 'danger' : undefined" @click="likeEvent(event)" />
            </div>
            <div class="event-title-main">{{ event.title }}</div>
            <div class="event-description-main">{{ event.description }}</div>
            <div class="event-card-footer">
              <Button icon="pi pi-user-plus" :label="event.registered ? 'Inscrit !' : 'S\'inscrire'" class="p-button-rounded p-button-primary event-register-btn" :severity="event.registered ? 'success' : 'primary'" @click="registerEvent(event)" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
  <MobileBottomNav />
</template>

<script setup>
import { ref, onMounted, getCurrentInstance } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Card from 'primevue/card';
import Calendar from 'primevue/calendar';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue';
import MobileBottomNav from '@/components/Utils/MobileBottomNav.vue';

const events = ref([]);
const newEvent = ref({ title: '', description: '', date: '' });

function addEvent() {
  if (!newEvent.value.title || !newEvent.value.description || !newEvent.value.date) return;
  events.value.unshift({
    id: Date.now(),
    title: newEvent.value.title,
    description: newEvent.value.description,
    date: newEvent.value.date,
    likes: 0,
    liked: false,
    registered: false,
  });
  newEvent.value = { title: '', description: '', date: '' };
}

function likeEvent(event) {
  if (!event.liked) {
    event.likes++;
    event.liked = true;
  } else {
    event.likes--;
    event.liked = false;
  }
}

function registerEvent(event) {
  event.registered = !event.registered;
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return new Date(date).toLocaleDateString('fr-CH', { year: 'numeric', month: 'long', day: 'numeric' });
  return date.toLocaleDateString('fr-CH', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Provide events to LeftSidebar via event bus ($root)
onMounted(() => {
  const instance = getCurrentInstance();
  if (instance && instance.proxy && instance.proxy.$root && instance.proxy.$root.$on) {
    instance.proxy.$root.$on('request-events', (cb) => {
      if (typeof cb === 'function') {
        cb(events.value);
      }
    });
  }
});
</script>

<style scoped>
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}
.sidebar-left {
  overflow-y: auto;
}
.sidebar-right {
  overflow-y: auto;
}
.main-feed {
  height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}
.main-feed::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.main-feed {
  scrollbar-width: none;
}
.event-management-page {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding: 1.3em 0.7em 2em 0.7em;
  min-width: 0;
  min-height: 100vh;
  position: relative;
}
h2 {
  margin-bottom: 1.2em;
  color: #ffc700;
  font-size: 1.4em;
}
.event-form-card {
  margin-bottom: 1.2em;
}
.event-list-scrollable {
  flex: 1 1 auto;
  overflow-y: auto;
  max-height: 60vh;
  padding-bottom: 1.5em;
}
.event-list-scrollable h3 {
  color: #ffc700;
  margin-bottom: 0.7em;
}
.empty {
  color: #888;
  margin: 1.5em 0;
  text-align: center;
}
.event-card-beautiful {
  background: linear-gradient(135deg, #232b4a 70%, #ffc700 120%);
  border-radius: 22px;
  box-shadow: 0 4px 24px 0 rgba(34,34,60,0.11);
  margin-bottom: 1.1em;
  padding: 1.1em 1.2em 1em 1.2em;
  color: #fff;
  font-size: 1.05em;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 2px solid #ffc70022;
  transition: box-shadow 0.18s;
}
.event-card-beautiful:hover {
  box-shadow: 0 8px 32px 0 #ffc70077;
}
.event-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5em;
}
.event-date-pill {
  background: #ffc700;
  color: #232b4a;
  border-radius: 18px;
  padding: 0.18em 1em 0.18em 0.8em;
  font-size: 0.98em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4em;
  box-shadow: 0 1px 5px 0 #232b4a22;
}
.event-date-pill i {
  color: #232b4a;
}
.event-title-main {
  font-size: 1.18em;
  font-weight: 700;
  margin-bottom: 0.3em;
  color: #fff;
  text-shadow: 0 2px 8px #232b4a44;
}
.event-description-main {
  color: #fff;
  margin-bottom: 1.1em;
  opacity: 0.95;
}
.event-card-footer {
  display: flex;
  justify-content: flex-end;
}
.event-like-btn {
  font-size: 1.05em;
}
.event-register-btn {
  font-size: 1.05em;
  min-width: 120px;
}
</style>
