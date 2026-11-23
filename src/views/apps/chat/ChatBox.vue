<!-- src/views/apps/chat/ChatBox.vue -->
<template>
  <!-- En-tête du Chat -->
  <div class="flex flex-column">
    <div class="flex align-items-center border-bottom-1 surface-border p-3 lg:p-6">
        <div v-if="user" class="relative flex align-items-center mr-3">
          <img
            :src="user.PhotoURL || 'https://firebasestorage.googleapis.com/v0/b/pfpheds.appspot.com/o/avatar1.jpg?alt=media&token=4015f4c6-4abe-446d-8cef-9e54b8257522'"
            class="w-4rem h-4rem border-circle shadow-4"
            style="object-fit: cover;"
            :alt="userDisplayName"
          />
          <span class="w-1rem h-1rem border-circle border-2 surface-border absolute bottom-0 right-0" :class="{ 'bg-green-400': user.status === 'active', 'bg-red-400': user.status === 'busy', 'bg-yellow-400': user.status === 'away' }"></span>
        </div>

        <div class="mr-2">
          <h2 class="text-900 font-semibold block">{{ userDisplayName }}</h2>
          <p class="text-700">Dernière activité {{ user.lastSeen }}</p>
        </div>
        <div class="flex align-items-center ml-auto">
          <Button aria-label="Plus d’actions" type="button" icon="pi pi-ellipsis-v" outlined severity="secondary" rounded></Button>
        </div>
    </div>

    <!-- Conteneur des Messages -->
    <div v-if="user" class="user-message-container p-3 md:px-4 lg:px-6 lg:py-4 mt-2 overflow-y-auto no-scrollbar" style="max-height: 53vh" ref="messageContainer">
      <div v-for="message in messages" :key="message.id">
        <!-- Message Reçu -->
        <div v-if="message.ownerId !== defaultUserId" class="grid grid-nogutter mb-4">
          <div class="mr-3 mt-1">
            <img
              :src="user.PhotoURL || 'src/assets/avatar/avatar1.jpg'"
              class="w-3rem h-3rem border-circle shadow-4"
              :alt="userDisplayName"
            />
          </div>
          <div class="col mt-3">
            <p class="text-900 font-semibold mb-3">{{ userDisplayName }}</p>
            <template v-if="message.type === 'story_reply'">
              <div class="story-reply-container story-reply-received flex flex-column mb-2 p-3">
                <div class="story-reply-badge flex align-items-center mb-2">
                  <i class="pi pi-image text-primary-700 mr-2" style="font-size: 1.5rem;"></i>
                  <span class="font-bold text-uppercase text-white story-badge-label">RÉPONSE À UNE STORY</span>
                </div>
                <div v-if="message.storyImage" class="story-image-preview mb-2">
                  <img :src="message.storyImage" alt="Story" class="w-7rem h-7rem border-3 border-primary-600 border-round-lg object-cover shadow-4" />
                </div>
                <span class="text-900 font-semibold story-reply-text">{{ message.text }}</span>
              </div>
            </template>
            <span v-else class="text-700 inline-block font-medium border-1 surface-border p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">{{ message.text }}</span>
            <p class="text-700 mt-3">{{ formatTime(message.createdAt) }} <i class="pi pi-check ml-2 text-green-400"></i></p>
          </div>
        </div>

        <!-- Message Envoyé -->
        <div v-else class="grid grid-nogutter mb-2">
          <div class="col mt-3 text-right">
            <template v-if="message.type === 'story_reply'">
              <div class="story-reply-container story-reply-sent flex flex-column align-items-end mb-2 p-3">
                <div class="story-reply-badge flex align-items-center justify-content-end mb-2">
                  <span class="font-bold text-uppercase text-white story-badge-label mr-2">RÉPONSE À UNE STORY</span>
                  <i class="pi pi-image text-primary-700" style="font-size: 1.5rem;"></i>
                </div>
                <div v-if="message.storyImage" class="story-image-preview mb-2 flex justify-content-end">
                  <img :src="message.storyImage" alt="Story" class="w-7rem h-7rem border-3 border-primary-600 border-round-lg object-cover shadow-4" />
                </div>
                <span class="text-900 font-semibold story-reply-text text-right">{{ message.text }}</span>
              </div>
            </template>
            <span v-else class="inline-block text-left font-medium border-1 surface-border bg-primary-100 text-primary-900 p-3 white-space-normal border-round" style="word-break: break-word; max-width: 80%">{{ message.text }}</span>
            <p class="text-700 mt-3">{{ formatTime(message.createdAt) }} <i class="pi pi-check ml-2 text-green-400"></i></p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center h-32">
      <p>Chargement des messages...</p>
    </div>

    <!-- Zone d'Entrée des Messages et Sélecteur d'Emojis -->
    <div v-if="user && defaultUserId" class="p-3 md:p-4 lg:p-6 flex flex-column sm:flex-row align-items-center mt-auto border-top-1 surface-border gap-3">

      <InputText aria-label="Tapez un message" id="message" type="text" placeholder="Tapez un message..." class="flex-1 w-full sm:w-auto border-round" v-model="textContent" @keydown.enter="sendMessage()" />
      <div class="flex w-full sm:w-auto gap-3">
        <Button class="p-button w-full sm:w-auto justify-content-center text-xl" severity="secondary" @click="(event) => $refs.op.toggle(event)">😀</Button>
        <Button label="Envoyer" icon="pi pi-send" class="w-full sm:w-auto" @click="sendMessage()" :disabled="!textContent.trim() || !defaultUserId"></Button>
      </div>

    </div>

    <div v-else class="flex items-center justify-center p-4 border-t border-gray-300">
      <p>Veuillez vous connecter pour envoyer des messages.</p>
    </div>
  </div>

  <OverlayPanel ref="op" class="w-full sm:w-30rem">
    <Button v-for="emoji in emojis" :key="emoji" @click="addEmoji(emoji)" type="button" :label="emoji" class="p-2 text-2xl" text></Button>
  </OverlayPanel>
</template>

<style scoped>
.story-reply-container {
  background: linear-gradient(90deg, var(--primary-50), #fff 80%);
  border-radius: 1.2rem;
  border-left: 6px solid var(--primary-600);
  box-shadow: 0 4px 24px 0 rgba(80, 120, 200, 0.11);
  transition: box-shadow 0.2s, background 0.2s;
  margin-bottom: 0.5rem;
  position: relative;
}
.story-reply-sent {
  border-left: none;
  border-right: 6px solid var(--primary-600);
  background: linear-gradient(270deg, var(--primary-50), #fff 80%);
}
.story-reply-badge {
  background: linear-gradient(90deg, var(--primary-700), var(--primary-400));
  border-radius: 1.5rem;
  padding: 0.35rem 1.2rem;
  font-size: 1.05rem;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px 0 rgba(80, 120, 200, 0.10);
  border: 2px solid var(--primary-600);
  color: #fff;
  text-shadow: 0 1px 2px rgba(80,120,200,0.12);
  cursor: pointer;
  user-select: none;
  font-weight: 700;
  text-transform: uppercase;
  transition: background 0.2s;
}
.story-badge-label {
  color: #fff;
  text-shadow: 0 1px 2px rgba(80,120,200,0.19);
}
.story-reply-container:hover {
  box-shadow: 0 8px 36px 0 rgba(80, 120, 200, 0.18);
  background: linear-gradient(90deg, var(--primary-100), #fff 80%);
}
.story-reply-sent:hover {
  background: linear-gradient(270deg, var(--primary-100), #fff 80%);
}
.story-image-preview img {
  object-fit: cover;
  box-shadow: 0 4px 24px 0 rgba(80, 120, 200, 0.18);
  border-radius: 1rem;
  border: 3px solid var(--primary-600);
  margin-bottom: 0.2rem;
}
.story-reply-text {
  font-size: 1.08rem;
  color: var(--primary-900);
  margin-top: 0.2rem;
  margin-bottom: 0.1rem;
  word-break: break-word;
  max-width: 90%;
}
</style>


<script setup>
import { ref, watch, computed } from 'vue';
import { ref as dbRef, push, onValue ,update , get } from 'firebase/database';
import { db, auth } from '../../../../firebase'; // Import auth along with db and storage

import { onAuthStateChanged } from 'firebase/auth'; // Import the auth state observer

// Utilitaire pour générer l'ID de conversation unique
const generateConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['send:message']);

// Réactifs
const currentUser = ref(null);

// Observateur d'état d'authentification
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser.value = user;
    console.log('Utilisateur connecté:', user.uid);
  } else {
    currentUser.value = null;
    console.log('Aucun utilisateur connecté.');
  }
});

// Vérification de l'ID utilisateur dans props.user
const otherUserId = computed(() => {
// Supposons que l'ID de l'utilisateur passé en prop est 'uid'
  const uid = props.user.uid || props.user.id;
  if (!uid) {
    console.warn('L\'ID de l\'utilisateur cible n\'est pas défini dans les props.');
  }
  return uid;
});

const defaultUserId = computed(() => currentUser.value ? currentUser.value.uid : null);
const conversationId = computed(() => {
  if (defaultUserId.value && otherUserId.value) {
    const id = generateConversationId(defaultUserId.value, otherUserId.value);
    console.log('Conversation ID généré:', id);
    return id;
  }
  console.warn('Impossible de générer l\'ID de conversation: defaultUserId ou otherUserId est manquant.');
  return null;
});

const messages = ref([]);
const textContent = ref('');
const showEmojiPicker = ref(false);

// Liste des emojis
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😇', '😉',
  '😊', '🙂', '🙃', '😋', '😌', '😍', '🥰', '😘', '😗', '😙',
  '😚', '🤪', '😜', '😝', '😛', '🤑', '😎', '🤓', '🧐', '🤠',
  '🥳', '🤗', '🤡', '😏', '😶', '😐', '😑', '😒', '🙄', '🤨',
  '🤔', '🤫', '🤭', '🤥', '😳', '😞', '😟', '😠', '😡', '🤬',
  '😔', '😕', '🙁', '😬', '🥺', '😣', '😖', '😫', '😩', '🥱',
  '😤', '😮', '😱', '😨', '😰', '😯', '😦', '😧', '😢', '😥',
  '😪', '🤤'
];

// Computed property pour afficher le nom de l'utilisateur
const userDisplayName = computed(() => {
  return `${props.user.UserName || 'Utilisateur'}`;
});

/**
 * Formate l'horodatage en une chaîne de temps lisible.
 * @param {number} timestamp - L'horodatage en millisecondes.
 * @returns {string} - Heure et minute formatées.
 */
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Fonction pour ajouter un message à une conversation spécifique dans Firebase Realtime Database.
 * @param {string} conversationId - L'ID unique de la conversation.
 * @param {Object} message - Le message à ajouter.
 * @returns {Promise<void>}
 */
const addMessageToConversation = async (conversationId, message) => {
  const conversationRef = dbRef(db, `conversations/${conversationId}`);
  const messagesRef = dbRef(db, `conversations/${conversationId}/messages`);

  try {
    // Vérifie si la conversation existe déjà
    const conversationSnapshot = await get(conversationRef);

    if (!conversationSnapshot.exists()) {
      console.log(`Création d'une nouvelle conversation avec ID : ${conversationId}`);
      const newConversation = {
        member1: defaultUserId.value,
        member2: otherUserId.value,
        lastReceivedMessageAt: message.createdAt,
      };
      await update(conversationRef, newConversation);
      console.log("Nouvelle conversation créée :", newConversation);
    }

    // Ajoute le message à la conversation
    await push(messagesRef, message);
    console.log(`Message ajouté à la conversation ${conversationId} :`, message);

    // Mettre à jour lastReceivedMessageAt
    await update(conversationRef, { lastReceivedMessageAt: message.createdAt });
    console.log(`lastReceivedMessageAt mis à jour pour la conversation ${conversationId}.`);
  } catch (error) {
    console.error("Erreur lors de l'ajout du message à Firebase :", error);
    throw error;
  }
};

/**
 * Fonction pour écouter les messages d'une conversation spécifique en temps réel dans Firebase Realtime Database.
 * @param {string} conversationId - L'ID unique de la conversation.
 * @param {Function} callback - Fonction à appeler avec les messages mis à jour.
 */
const listenToConversationMessages = (conversationId, callback) => {
  const messagesRef = dbRef(db, `conversations/${conversationId}/messages`);
  onValue(messagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const fetchedMessages = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      // Trier les messages par date croissante
      fetchedMessages.sort((a, b) => a.createdAt - b.createdAt);
      callback(fetchedMessages);
      console.log(`Messages mis à jour pour la conversation ${conversationId} :`, fetchedMessages);
    } else {
      callback([]);
      console.log(`Aucun message trouvé pour la conversation ${conversationId}.`);
    }
  }, (error) => {
    console.error("Erreur lors de l'écoute des messages :", error);
  });
};

/**
 * Envoie un message.
 */
const sendMessage = async () => {
  if (!defaultUserId.value) {
    console.error("Utilisateur non authentifié. Impossible d'envoyer le message.");
    return;
  }

  if (!conversationId.value) {
    console.error("ID de conversation invalide.");
    return;
  }

  const trimmedText = textContent.value.trim();
  if (!trimmedText) return;

  const message = {
    text: trimmedText,
    ownerId: defaultUserId.value,
    createdAt: Date.now()
  };

  console.log('Envoi du message:', message);

// Émettre le message au parent
  emit('send:message', message);

// Ajouter le message à Firebase
  try {
    await addMessageToConversation(conversationId.value, message);
    console.log("Message envoyé et sauvegardé dans Firebase :", message);
    // Mettre à jour lastReceivedMessageAt uniquement si le message est reçu par l'autre utilisateur
    const conversationRef = dbRef(db, `conversations/${conversationId.value}`);
    await update(conversationRef, { lastReceivedMessageAt: message.createdAt });
    console.log(`lastReceivedMessageAt mis à jour pour la conversation ${conversationId.value}.`);
  } catch (error) {
    console.error("Erreur lors de l'envoi du message à Firebase :", error);
  }
  textContent.value = '';
  showEmojiPicker.value = false;
};

/**
 * Ajoute un emoji au contenu du message.
 * @param {string} emoji - L'emoji à ajouter.
 */
const addEmoji = (emoji) => {
  textContent.value += emoji;
  showEmojiPicker.value = false;
};

/**
 * Affiche ou cache le sélecteur d'emojis.
 */
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

/**
 * Écoute les messages de la conversation active en temps réel.
 */
watch(conversationId, (newId) => {
  if (newId) {
    console.log('Écoute des messages pour la conversation:', newId);
    listenToConversationMessages(newId, (fetchedMessages) => {
      messages.value = fetchedMessages;
      scrollToLastMessage();
    });
  } else {
    console.warn('Conversation ID non défini.');
  }
});

/**
 * Fonction pour défiler jusqu'au dernier message.
 */
const scrollToLastMessage = () => {
  const container = document.querySelector('.user-message-container');
  if (container) {
    container.scrollTop = container.scrollHeight;
    console.log('Défilement jusqu\'au dernier message.');
  } else {
    console.warn('Conteneur de messages introuvable.');
  }
};

/**
 * Défilement automatique lorsque les messages changent.
 */
watch(messages, () => {
  scrollToLastMessage();
});
</script>

<style scoped>
.user-message-container {
  /* Ajoute un défilement fluide */
  scroll-behavior: smooth;
}

/* Styles pour les messages */
.message-received img {
  width: 40px;
  height: 40px;
}

.message-sent span {
  background-color: #dcf8c6;
  color: #000;
}

.no-scrollbar {
  /* Masquer la scrollbar pour Firefox */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

/* Masquer la scrollbar pour les navigateurs basés sur Webkit (Chrome, Safari, Opera) */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
