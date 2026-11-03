<template>
  <article class="event-detail-content">
    <header class="event-detail-header">
      <span class="event-type-badge" :class="event.type">{{ eventTypeLabel }}</span>
      <h2>{{ event.title }}</h2>
    </header>
    <!-- Image de l'événement -->
    <div class="event-detail-image event-image-wrapper">
      <img v-if="event.image" :src="event.image" :alt="event.title" class="event-image" />
      <div v-else class="event-image-placeholder">
        <i class="pi pi-calendar" aria-hidden="true"></i>
      </div>
    </div>
    <div class="event-date-type">
      <span class="event-date">
        <i class="pi pi-calendar" aria-hidden="true"></i>
        <span class="event-date-values">
          <span>{{ formatDateTime(event.startDate) }}</span>
          <i v-if="event.endDate" class="pi pi-arrow-right" aria-hidden="true"></i>
          <span v-if="event.endDate">{{ formatDateTime(event.endDate) }}</span>
        </span>
      </span>
      <div v-if="event.lieu" class="event-location-sober">
        <i class="pi pi-map-marker" aria-hidden="true"></i>
        <span>{{ event.lieu }}</span>
      </div>
    </div>
    <div class="event-detail-description">{{ event.description }}</div>
    <div v-if="event.type === 'private' && event.role" class="event-detail-type">
      <span v-if="event.type === 'private' && event.role">Réservé au rôle : {{ event.role }}</span>
    </div>
    <div class="event-detail-participants">
      <strong>Participants</strong>
      <div v-if="event && event.registered && event.registered.length > 0" class="participants-list">
        <div v-for="user in participantsInfo" :key="user.uid || user.id" class="participant-item">
          <img :src="user.photoURL" class="participant-avatar" :alt="`Portrait de ${user.fullName}`" />
          <span class="participant-name">{{ user.prenom }} {{ user.nom }}</span>
        </div>
      </div>
      <div v-else>Aucun inscrit.</div>
    </div>
    <div class="event-detail-actions">
      <Button icon="pi pi-user-plus"
        :label="isUserRegistered ? 'Inscrit !' : 'S\'inscrire'"
        class="p-button-rounded p-button-primary"
        :severity="isUserRegistered ? 'success' : 'primary'"
        @click="$emit('register', event)" />
      <Button v-if="canManageEvent" icon="pi pi-pencil" label="Modifier" class="p-button-rounded p-button-warning mr-2" @click="$emit('edit', event)" />
      <Button v-if="canManageEvent" icon="pi pi-trash" label="Supprimer" class="p-button-rounded p-button-danger mr-2" @click="confirmDelete" />
      <Button icon="pi pi-share-alt" label="Partager" class="p-button-rounded p-button-info" @click="confirmShare" />
    </div>
  </article>
</template>

<script setup>
import Button from 'primevue/button';
import { ref, watch, computed, defineEmits, defineProps } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import { useNewsFeedStore } from '@/stores/newsFeedStore';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
  event: { type: Object, required: true },
  userId: { type: String, required: true },
  userProfile: { type: Object, required: false }
});

const emit = defineEmits(['register', 'like', 'close', 'edit', 'delete', 'fixAdmin']);

const defaultAvatar = 'https://ui-avatars.com/api/?name=Utilisateur';

const participantsInfo = ref([]);

// Computed pour vérifier si l'utilisateur est inscrit
const isUserRegistered = computed(() => {
  if (!props.event?.registered || !props.userId) return false;
  // Vérifier dans les UIDs simples (ancien format)
  if (props.event.registered.includes(props.userId)) return true;
  // Vérifier dans les objets utilisateur (nouveau format)
  return props.event.registered.some(item =>
    typeof item === 'object' && item.uid === props.userId
  );
});

const canManageEvent = computed(() => {
  // L'utilisateur peut gérer l'événement s'il en est le créateur
  return props.event && props.userId && props.event.admin === props.userId;
});

// Label du type d'événement
const eventTypeLabel = computed(() => {
  switch (props.event?.type) {
    case 'private':
      return 'Privé';
    case 'alpinphysio':
      return "Alp'in Physio";
    case 'public':
    default:
      return 'Public';
  }
});

const newsFeedStore = useNewsFeedStore();
const toast = useToast();
const confirm = useConfirm();

async function fetchParticipantsInfo(registeredData) {
  if (!registeredData || registeredData.length === 0) {
    participantsInfo.value = [];
    return;
  }

  const db = getDatabase();
  const fetches = registeredData.map(async (item) => {
    try {
      // Si l'item est déjà un objet avec les infos complètes (nouveau format)
      if (typeof item === 'object' && item.uid) {
        return {
          uid: item.uid,
          nom: item.nom || '',
          prenom: item.prenom || '',
          fullName: `${item.prenom} ${item.nom}`.trim() || 'Utilisateur inconnu',
          photoURL: item.photoURL || defaultAvatar
        };
      }

      // Sinon, c'est un UID simple (ancien format) - récupérer depuis Firebase
      const uid = typeof item === 'string' ? item : item.uid;
      const userRef = dbRef(db, `Users/${uid}`);
      const snap = await get(userRef);
      if (snap.exists()) {
        const u = snap.val();
        console.log('User fetched for uid', uid, u);
        const prenom = u.Prenom || '';
        const nom = u.Nom || '';
        return {
          uid,
          nom: nom,
          prenom: prenom,
          fullName: `${prenom} ${nom}`.trim() || 'Utilisateur inconnu',
          photoURL: u.PhotoURL || u.photoURL || u.avatar || defaultAvatar
        };
      } else {
        return { uid, nom: '', prenom: '', fullName: 'Utilisateur inconnu', photoURL: defaultAvatar };
      }
    } catch (e) {
      const uid = typeof item === 'string' ? item : (item.uid || 'unknown');
      return { uid, nom: '', prenom: '', fullName: 'Utilisateur inconnu', photoURL: defaultAvatar };
    }
  });
  participantsInfo.value = await Promise.all(fetches);
}

watch(() => props.event && props.event.registered, (val) => {
  fetchParticipantsInfo(val || []);
}, { immediate: true });

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

function confirmDelete() {
  confirm.require({
    message: "Supprimer définitivement cet événement ?",
    header: "Confirmation de suppression",
    icon: "pi pi-exclamation-triangle",
    accept: () => emit('delete', props.event.id),
  });
}

async function shareEvent() {
  try {
    console.log('shareEvent called', props.event, props.userId, props.userProfile);
    const user = {
      uid: props.userId,
      nom: props.userProfile?.nom || '',
      prenom: props.userProfile?.prenom || '',
      photoURL: props.userProfile?.photoURL || ''
    };
    await newsFeedStore.shareEvent(props.event, user);
    toast.add({ severity: 'success', summary: 'Partagé', detail: "Événement partagé dans le fil d'actualité !", life: 3500 });
  } catch (e) {
    console.error('Erreur partage:', e);
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Échec du partage.', life: 3500 });
  }
}

function confirmShare() {
  confirm.require({
    message: 'Partager cet événement dans le fil d\'actualité ?',
    header: 'Partager',
    icon: 'pi pi-share-alt',
    accept: shareEvent
  });
}

</script>

<style scoped>
.event-detail-content {
  max-width: 44rem;
  width: 100%;
  margin: 0 auto;
  border-radius: 1rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  box-shadow: 0 12px 32px rgba(2, 12, 27, 0.16);
  padding: clamp(1rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--text-color);
}
.event-detail-header {
  display: grid;
  justify-items: start;
  gap: .65rem;
}
.event-detail-header h2 {
  margin: 0;
  max-width: 28ch;
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.2;
  letter-spacing: -.02em;
}
.event-detail-image.event-image-wrapper {
  position: relative;
  width: 100%;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  overflow: hidden;
  border-radius: .875rem;
}
.event-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: .875rem;
  max-width: 100%;
  display: block;
}
.event-image-placeholder {
  width: 100%;
  height: 12rem;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-ground));
  border-radius: .875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: var(--primary-color);
  max-width: 100%;
}
.event-date-type {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .65rem;
}
.event-date {
  display: flex;
  align-items: flex-start;
  gap: .6rem;
  color: var(--text-color);
  font-weight: 600;
  line-height: 1.5;
}
.event-date-values {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .45rem;
}
.event-date-values > i {
  color: var(--text-color-secondary);
  font-size: .75rem;
}
.event-location-sober {
  color: var(--primary-color);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: .6rem;
}
.event-location-sober .pi-map-marker {
  color: var(--primary-color);
}
.event-detail-description {
  max-width: 68ch;
  color: var(--text-color-secondary);
  line-height: 1.65;
}
.event-detail-type {
  color: var(--text-color-secondary);
}
.event-type-badge {
  display: inline-block;
  padding: .35rem .75rem;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--primary-color) 18%, var(--surface-card));
  color: var(--primary-color);
}
.event-type-badge.private {
  background: color-mix(in srgb, #f43f5e 18%, var(--surface-card));
  color: #fb7185;
}
.event-type-badge.public {
  background: color-mix(in srgb, var(--primary-color) 18%, var(--surface-card));
  color: var(--primary-color);
}
.event-type-badge.alpinphysio {
  background: color-mix(in srgb, #38bdf8 18%, var(--surface-card));
  color: #38bdf8;
}
.event-detail-participants {
  display: grid;
  gap: .75rem;
}
.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7em;
}
.participant-item {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .4rem .65rem .4rem .4rem;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--surface-ground);
}
.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-color);
}
.participant-name {
  font-size: .82rem;
  color: var(--text-color);
}
.event-detail-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--surface-border);
}
.admin-actions {
  display: flex;
  align-items: center;
  gap: 0.5em;
}

@media (max-width: 36rem) {
  .event-detail-content { border-radius: .875rem; }
  .event-detail-image.event-image-wrapper,
  .event-image,
  .event-image-placeholder { height: 10rem; }
  .event-detail-actions :deep(.p-button) { flex: 1 1 calc(50% - .75rem); justify-content: center; }
  .event-date-values { align-items: flex-start; flex-direction: column; }
  .event-date-values > i { transform: rotate(90deg); }
}
</style>
