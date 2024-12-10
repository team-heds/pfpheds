<!-- src/views/apps/chat/ChatSidebar.vue -->
<template>
  <!-- Informations de l'utilisateur actuel -->
  <div class="flex flex-col items-center border-b border-gray-300 p-6">
    <img
      :src="currentUser.PhotoURL || '/demo/images/avatar/default.png'"
      class="w-24 h-24 rounded-full object-cover shadow-md"
      :alt="currentUser.UserName"
    />
    <span class="text-xl font-semibold mt-4 text-gray-800">{{ currentUser.UserName }}</span>
  </div>

  <!-- Barre de recherche -->
  <div class="p-4">
    <div class="relative">
      <input
        type="text"
        placeholder="Rechercher des utilisateurs..."
        v-model="searchedUser"
        @input="filter"
        class="w-full p-2 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
    </div>
  </div>

  <!-- Liste des utilisateurs historiques -->
  <div v-if="HistoryUsers.length" class="p-4">
    <h2 class="text-lg font-semibold mb-2">Historique</h2>
    <div class="overflow-auto" style="max-height: calc(100vh - 200px);">
      <UserCard
        v-for="user in HistoryUsers"
        :key="user.id"
        :user="user"
        :lastReceivedMessageAt="lastReceivedMessageDates[user.id]"
        @click="onChangeActiveUser(user)"
      />
    </div>
  </div>

  <!-- Liste des utilisateurs filtrés et triés -->
  <div class="p-4 overflow-auto" style="max-height: calc(100vh - 200px);">
    <UserCard
      v-for="user in filteredAndSortedUsers"
      :key="user.id"
      :user="user"
      :lastReceivedMessageAt="lastReceivedMessageDates[user.id]"
      @click="onChangeActiveUser(user)"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import UserCard from './UserCard.vue';
import { db } from '@/firebase';
import { ref as dbRef, onValue, off } from 'firebase/database';

/**
 * Fonction utilitaire pour générer un ID de conversation unique
 * @param {string} userId1
 * @param {string} userId2
 * @returns {string}
 */
const generateConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('-');
};

// Définition des propriétés
const props = defineProps({
  users: {
    type: Array,
    default: () => []
  },
  currentUser: {
    type: Object,
    required: true
  }
});

// Événements émis
const emit = defineEmits(['change:active:user']);

// Réactifs
const searchedUser = ref('');
const lastReceivedMessageDates = ref({});
const HistoryUsers = ref([]); // Ajout de HistoryUsers
const unsubscribeFunctions = ref([]);

/**
 * Fonction pour récupérer la date du dernier message reçu d'une conversation.
 * On lit directement la propriété lastReceivedMessageAt dans le nœud de la conversation.
 * @param {string} conversationId
 * @param {string} userId
 */
const fetchLastReceivedMessageDate = (conversationId, userId) => {
  const conversationRef = dbRef(db, 'conversations');

  const listener = onValue(conversationRef, (snapshot) => {
    const data = snapshot.val() || {};
    let found = false;

    for (const convId in data) {
      const conv = data[convId];
      // Vérifier si l'utilisateur fait partie des membres de la conversation
      if ((conv.member1 === userId || conv.member2 === userId) && conv.lastReceivedMessageAt) {
        lastReceivedMessageDates.value[userId] = conv.lastReceivedMessageAt;
        found = true;

        // Ajout à HistoryUsers
        const otherMemberId = conv.member1 === userId ? conv.member2 : conv.member1;
        const otherUser = props.users.find(u => u.id === otherMemberId);
        if (otherUser && !HistoryUsers.value.some(u => u.id === otherUser.id)) {
          HistoryUsers.value.push(otherUser);
        }

        break;
      }
    }

    if (!found) {
      lastReceivedMessageDates.value[userId] = 0;
    }
  }, (error) => {
    console.error(`Erreur lors de la récupération de lastReceivedMessageAt pour ${userId}:`, error);
  });

  // Stocker la fonction de désinscription
  unsubscribeFunctions.value.push(() => off(conversationRef, 'value', listener));
};

/**
 * Initialiser les écouteurs Firebase pour chaque utilisateur.
 */
const initializeLastReceivedMessageListeners = () => {
  props.users.forEach(user => {
    // Ne pas écouter pour l'utilisateur actuel
    if (user.id === props.currentUser.uid) return;

    const conversationId = generateConversationId(props.currentUser.uid, user.id);
    fetchLastReceivedMessageDate(conversationId, user.id);
  });
};

/**
 * Nettoyer tous les écouteurs Firebase
 */
const cleanupListeners = () => {
  unsubscribeFunctions.value.forEach(unsubscribe => unsubscribe());
  unsubscribeFunctions.value = [];
};

/**
 * Lors du montage du composant
 */
onMounted(() => {
  initializeLastReceivedMessageListeners();
});

/**
 * Lors de la destruction du composant
 */
onUnmounted(() => {
  cleanupListeners();
});

/**
 * Surveille les changements dans la liste des utilisateurs
 */
watch(
  () => props.users,
  () => {
    cleanupListeners();
    lastReceivedMessageDates.value = {};
    HistoryUsers.value = []; // Réinitialiser HistoryUsers
    initializeLastReceivedMessageListeners();
  },
  { immediate: true }
);

/**
 * Computed property pour filtrer et trier les utilisateurs par lastReceivedMessageAt
 */
const filteredAndSortedUsers = computed(() => {
  const query = searchedUser.value.trim().toLowerCase();
  let filtered = props.users.filter(user => {
    if (user.id === props.currentUser.uid) return false;
    if (!query) return true;
    const userName = (user.UserName || '').toLowerCase();
    const userMail = (user.Mail || '').toLowerCase();
    return userName.includes(query) || userMail.includes(query);
  });

  // Tri par date du dernier message reçu (desc)
  filtered.sort((a, b) => {
    const dateA = Number(lastReceivedMessageDates.value[a.id]) || 0;
    const dateB = Number(lastReceivedMessageDates.value[b.id]) || 0;
    return dateB - dateA;
  });

  return filtered;
});

/**
 * Fonction pour changer l'utilisateur actif
 */
const onChangeActiveUser = (user) => {
  emit('change:active:user', user);
};

/**
 * Fonction de filtrage (inutile ici, la computed gère déjà le filtrage, mais on la garde pour la liaison @input)
 */
const filter = () => {
  // Rien à faire ici.
};
</script>

<style scoped>
.user-card:hover {
  background-color: #f0f0f0;
}

input::placeholder {
  color: #a1a1aa;
}

input:focus::placeholder {
  color: transparent;
}
</style>