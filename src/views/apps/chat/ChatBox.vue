<!-- src/views/apps/chat/ChatBox.vue -->
<template>
  <!-- En-tête du Chat -->
  <div v-if="user" class="flex items-center border-b border-gray-300 p-4">
    <img 
      :src="user.PhotoURL || '/demo/images/avatar/default.png'" 
      style="width: 105px; height:105px;"
      :alt="userDisplayName"
    />
    <div>
      <h2 class="text-xl font-semibold text-gray-800">{{ userDisplayName }}</h2>
      <p class="text-gray-600">Dernière activité {{ user.lastSeen }}</p>
    </div>
    <div class="ml-auto">
      <button class="p-button p-button-text p-button-icon-only">
        <i class="pi pi-ellipsis-v"></i>
      </button>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-32">
    <p>Chargement du chat...</p>
  </div>

  <!-- Conteneur des Messages -->
  <div v-if="user" class="flex-1 p-4 overflow-y-auto user-message-container" ref="messageContainer">
    <div v-for="message in messages" :key="message.id" class="mb-4">
      <!-- Message Reçu -->
      <div v-if="message.ownerId !== defaultUserId" class="flex items-start">
        <img 
          :src="user.PhotoURL || '/demo/images/avatar/default.png'" 
          style="width: 25px; height:25px;"
          :alt="userDisplayName"
        />
        <div>
          <p class="font-semibold text-gray-800">{{ userDisplayName }}</p>
          <span class="inline-block bg-gray-200 p-2 rounded-lg max-w-xs break-words">{{ message.text }}</span>
          <p class="text-gray-500 text-sm">{{ formatTime(message.createdAt) }} <i class="pi pi-check text-green-500 ml-2"></i></p>
        </div>
      </div>

      <!-- Message Envoyé -->
      <div v-else class="flex justify-end">
        <div class="text-right">
          <span class="inline-block bg-blue-200 text-blue-800 p-2 rounded-lg max-w-xs break-words">{{ message.text }}</span>
          <p class="text-gray-500 text-sm">{{ formatTime(message.createdAt) }} <i class="pi pi-check text-green-500 ml-2"></i></p>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center h-32">
    <p>Chargement des messages...</p>
  </div>

  <!-- Zone d'Entrée des Messages et Sélecteur d'Emojis -->
  <div v-if="user && defaultUserId" class="relative flex items-center p-4 border-t border-gray-300">
    <button 
      class="p-button p-button-text p-button-icon-only mr-3" 
      @click="toggleEmojiPicker"
      title="Ajouter un emoji"
    >
      😀
    </button>
    <input
      type="text"
      v-model="textContent"
      @keydown.enter="sendMessage"
      placeholder="Tapez un message..."
      class="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button 
      class="p-button p-button-primary ml-3" 
      @click="sendMessage"
      :disabled="!textContent.trim() || !defaultUserId"
    >
      Envoyer
    </button>

    <!-- Sélecteur d'Emojis -->
    <div v-if="showEmojiPicker" class="absolute bottom-full mb-2 right-0 bg-white border rounded-lg p-2 shadow-lg z-10 flex flex-wrap w-48">
      <button
        v-for="emoji in emojis"
        :key="emoji"
        @click="addEmoji(emoji)"
        class="text-xl m-1 focus:outline-none"
        title="Ajouter cet emoji"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
  <div v-else class="flex items-center justify-center p-4 border-t border-gray-300">
    <p>Veuillez vous connecter pour envoyer des messages.</p>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { db, auth } from '@/firebase'; // Import auth along with db and storage
import { ref as dbRef, push, onValue } from 'firebase/database';
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
const addMessageToConversation = (conversationId, message) => {
return new Promise((resolve, reject) => {
  const messagesRef = dbRef(db, `conversations/${conversationId}/messages`);
  push(messagesRef, message)
    .then(() => {
      console.log(`Message ajouté à la conversation ${conversationId} :`, message);
      resolve();
    })
    .catch((error) => {
      console.error("Erreur lors de l'ajout du message à Firebase :", error);
      reject(error);
    });
});
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
</style>
