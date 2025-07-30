<template>
  <div class="event-card-wrapper">
    <Card class="event-card surface-card" @mouseover="hover = true" @mouseleave="hover = false">
      <template #header>
        <div class="event-card-header">
          <div class="event-image-wrapper">
            <img v-if="event.image" :src="event.image" alt="event image" class="event-image" />
            <div v-else class="event-image-placeholder">
              <i class="pi pi-calendar"></i>
            </div>
            <Tag class="event-type-badge" :severity="event.type === 'private' ? 'danger' : 'warning'">
              {{ event.type === 'private' ? 'Privé' : 'Public' }}
            </Tag>
          </div>
        </div>
      </template>
      <template #title>
        <p class="event-title">{{ event.title }}</p>
      </template>
      <template #subtitle>
        <div class="event-subtitle">
          <span class="event-date">
            <i class="pi pi-calendar"></i>
            {{ formatDateTime(event.startDate) }}
          </span>
          <div v-if="event.lieu" class="event-location-sober">
            <i class="pi pi-map-marker" style="color:#ffc700;font-size:1.1em;margin-right:6px;"></i>
            <span style="color:#ffc700;font-weight:800">{{ event.lieu }}</span>
          </div>
        </div>
      </template>
      <template #content>
        <div class="event-description">
          {{ truncateText(event.description, 100) }}
        </div>
        <div class="event-card-actions">
          <Button icon="pi pi-user-plus"
            :label="isUserRegistered ? 'Inscrit !' : 'S\'inscrire'"
            class="p-button-rounded event-register-btn event-register-btn-small"
            :severity="isUserRegistered ? 'success' : 'primary'"
            @click="$emit('register', event)" />
          <Button icon="pi pi-info-circle"
            class=" details-btn"
            @click="$emit('show-details', event)"
            v-tooltip.top="'Voir le détail'"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
const props = defineProps({
  event: { type: Object, required: true },
  userId: { type: String, required: false }
});
const hover = ref(false);
const isUserRegistered = computed(() => {
  if (props.event.registered && props.event.registered.includes(props.userId)) return true;
  if (props.event.registered && props.event.registered.find(user => user.uid === props.userId)) return true;
  return false;
});
function formatDateTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
function truncateText(text, length) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
</script>

<style scoped>
.event-card-wrapper {
  display: flex;
  justify-content: center;
  height: 100%;
}
.event-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100%;
  width: 20rem;
  min-height: 340px;
  box-shadow: 0 4px 18px 0 #232b4a18;
  border-radius: 1.1rem;
  transition: box-shadow 0.22s, transform 0.18s;
  border: 1.5px solid #ffc70033;
  position: relative;
}
.event-card:hover {
  box-shadow: 0 10px 32px 0 #ffc70044;
  transform: translateY(-4px) scale(1.022);
  border-color: #ffc70088;
  z-index: 2;
}
.event-card-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0.2rem;
}
.event-image-wrapper {
  position: relative;
  width: 100%;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.event-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: 0.8rem 0.8rem 0 0;
  box-shadow: 0 2px 12px #232b4a22;
}
.event-image-placeholder {
  width: 100%;
  height: 12rem;
  background: linear-gradient(135deg, #ffc70033 60%, #232b4a11 100%);
  border-radius: 0.8rem 0.8rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: #ffc700;
}
.event-type-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  font-size: 0.98em;
  font-weight: 700;
  box-shadow: 0 2px 8px #232b4a22;
}
.event-title {
  text-align: center;
  font-size: 1.17rem;
  font-weight: 700;
  margin: 0.7rem 0 0.15rem 0;
  color: #fff;
  letter-spacing: 0.01em;
}
.event-subtitle {
  text-align: center;
  margin-bottom: 0.3rem;
}
.event-date {
  color: #ffc700;
  font-size: 1em;
  font-weight: 600;
}
.event-location-sober {
  color: #ffc700;
  font-size: 0.98em;
  font-weight: 800;
  margin: 0.15em 0 0.5em 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.event-location-sober .pi-map-marker {
  font-size: 1em;
  color: #ffc700;
}
.event-description {
  text-align: center;
  color: #fff;
  margin: 0.2rem 0 0.8rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: calc(3 * 1.5em);
  font-size: 1.04em;
}
.event-card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4em;
  margin: 0.6em 0 0.1em 0;
  padding: 0 0.7em;
}
.like-btn-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 48px;
}
.like-centered .p-button-icon-left {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-centered .pi-heart {
  font-size: 1.35em;
  display: flex;
  align-items: center;
  justify-content: center;
}
.like-count {
  color: #ffc700;
  font-weight: 700;
  font-size: 1em;
  margin-top: 0.1em;
  text-align: center;
}

.event-register-btn {
  min-width: 110px;
  font-weight: 600;
  font-size: 1.01em;
  background: linear-gradient(90deg, #ffc700 70%, #ffe066 100%);
  color: #232b4a;
  border-radius: 1.2em;
  border: none;
  box-shadow: 0 1px 6px #ffc70022;
}
.event-register-btn.p-button-success {
  background: linear-gradient(90deg, #26c281 70%, #7be495 100%);
  color: #fff;
}
.event-register-btn-small {
  min-width: 85px;
  font-size: 0.97em;
  padding: 0.45em 0.7em;
}
@media (max-width: 900px) {
  .event-register-btn {
    min-width: 70px;
    font-size: 0.96em;
    padding: 0.35em 0.5em;
  }
}
.details-btn {
  color: #ffc700;
  font-weight: 700;
  font-size: 1.3em;
  margin-left: 0.7em;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  transition: color 0.18s, transform 0.12s;
}
.details-btn:focus,
.details-btn:active {
  box-shadow: none !important;
  border: none !important;
  outline: none !important;
  background: transparent !important;
}
.details-btn:hover {
  color: #fff;
  transform: scale(1.07);
}
@media (max-width: 900px) {
  .event-card {
    width: 100%;
    min-width: 0;
  }
  .event-card-wrapper {
    width: 100%;
    min-width: 0;
  }
  .event-card-actions {
    flex-direction: column;
    gap: 0.7em;
    padding: 0 0.2em;
  }
  .like-btn-group {
    flex-direction: row;
    min-width: unset;
    margin-bottom: 0.2em;
  }
  .like-count {
    margin-top: 0;
    margin-left: 0.4em;
  }
  .details-btn {
    width: 40px;
    height: 40px;
    font-size: 1.1em;
    margin-left: 0;
  }
}
</style>
