<template>
  <div class="event-detail-content">
    <h3>{{ event.title }}</h3>
    <!-- Image de l'événement -->
    <div class="event-detail-image event-image-wrapper">
      <img v-if="event.image" :src="event.image" :alt="event.title" class="event-image" />
      <div v-else class="event-image-placeholder">
        <i class="pi pi-calendar"></i>
      </div>
    </div>
    <div class="event-date-type">
      <span class="event-date">
        <i class="pi pi-calendar"></i>
        {{ formatDateTime(event.startDate) }}<span v-if="event.endDate"> – {{ formatDateTime(event.endDate) }}</span>
      </span>
      <div v-if="event.lieu" class="event-location-sober">
        <i class="pi pi-map-marker" style="color:#ffc700;font-size:1.2em;margin-right:8px;"></i>
        <span style="color:#ffc700;font-weight:800">{{ event.lieu }}</span>
      </div>
    </div>
    <div class="event-detail-description">{{ event.description }}</div>
    <div class="event-detail-type">
      <span class="event-type-badge" :class="event.type">{{ event.type === 'private' ? 'Privé' : 'Public' }}</span>
      <span v-if="event.type === 'private' && event.role">| Rôle : {{ event.role }}</span>
    </div>
    <div class="event-detail-participants">
      <b>Participants :</b>
      <div v-if="event && event.registered && event.registered.length > 0" class="participants-list">
        <div v-for="user in participantsInfo" :key="user.uid || user.id" class="participant-item">
          <img :src="user.photoURL" class="participant-avatar" :alt="user.fullName" />
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
  </div>
</template>

<script setup>
import Button from 'primevue/button';
import { ref, watch, onMounted, computed, defineEmits, defineProps } from 'vue';
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

onMounted(() => {
  fetchParticipantsInfo((props.event && props.event.registered) || []);
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

function getUserAvatar(uid) {
  // À brancher plus tard (photo réelle)
  return 'https://ui-avatars.com/api/?name=' + uid;
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

async function fixEventAdmin() {
  // Attribuer automatiquement la propriété et ouvrir l'édition
  emit('fixAdmin', props.event);
  // Émettre aussi l'événement d'édition
  emit('edit', props.event);
}
</script>

<style scoped>
.event-detail-content {
  max-width: 600px;
  min-width: 400px;
  width: 100%;
  margin: 0 auto;
  border-radius: 1.2rem;
  box-shadow: 0 4px 18px 0 #232b4a18;
  padding: 2.2rem 1.5rem 2.2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.event-detail-image.event-image-wrapper {
  position: relative;
  width: 100%;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
  max-width: 100%;
}
.event-image {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  border-radius: 0.8rem 0.8rem 0 0;
  box-shadow: 0 2px 12px #232b4a22;
  max-width: 100%;
  display: block;
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
  max-width: 100%;
}
.event-date-type {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0.6em;
}
.event-date {
  color: #ffc700;
  font-weight: 600;
  font-size: 1.5em;
}
.event-location-sober {
  color: #ffc700;
  font-size: 1.5em;
  font-weight: 800;
  margin: 0.2em 0 0.7em 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.event-location-sober .pi-map-marker {
  font-size: 1em;
  color: #ffc700;
}
.event-detail-description {
  margin-bottom: 1.2em;
  color: #fff;
}
.event-detail-type {
  margin-bottom: 1em;
}
.event-type-badge {
  display: inline-block;
  padding: 0.1em 0.8em;
  border-radius: 1em;
  font-size: 0.93em;
  font-weight: 600;
  background: #ffc700;
  color: #232b4a;
}
.event-type-badge.private {
  background: #ff5577;
  color: #fff;
}
.event-type-badge.public {
  background: #ffc700;
  color: #232b4a;
}
.event-detail-participants {
  margin: 1.2em 0;
}
.participants-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7em;
  margin-top: 0.6em;
}
.participant-item {
  display: flex;
  align-items: center;
}
.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffc700;
  margin-right: 0.4em;
}
.participant-name {
  font-size: 0.8em;
  color: #fff;
}
.event-detail-actions {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-top: 1.8em;
}
.admin-actions {
  display: flex;
  align-items: center;
  gap: 0.5em;
}
</style>
