<!-- src/views/apps/chat/IndexChat.vue -->
<template>
  <Navbar title="Chat"></Navbar>
  <div class="flex flex-column md:flex-row gap-5" style="min-height: 53vh">
    <!-- Sidebar avec la liste des utilisateurs -->
    <div class="md:w-25rem card h-full p-0">
      <ChatSidebar
        v-if="currentUser"
        @change:active:user="changeActiveUser"
        :users="users"
        :currentUser="currentUser"
      />
      <div v-else class="flex items-center justify-center h-full">
        <p>Veuillez vous connecter pour accéder au chat.</p>
      </div>
    </div>
    <!-- Zone de chat avec l'utilisateur actif -->
    <div class="flex-1 card h-full p-0">
      <ChatBox
        v-if="activeUser"
        @send:message="sendMessage"
        :user="activeUser"
      />
      <div v-else class="flex items-center justify-center h-full">
        <p>Sélectionnez un utilisateur pour commencer la conversation.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import ChatBox from './ChatBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import { db, auth } from '../../../../firebase'; // Importer seulement db et auth
import { ref as dbRef, onValue, push } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

// États réactifs
const users = ref([]);
const activeUserId = ref(null);
const activeUser = ref(null);
const currentUser = ref(null); // Définir l'utilisateur actuel
const route = useRoute();

/**
 * Fonction pour récupérer tous les utilisateurs directement dans le composant.
 * @returns {Promise<Array>} - Une promesse qui résout avec un tableau d'utilisateurs.
 */
const fetchAllUsers = () => {
  return new Promise((resolve, reject) => {
    const usersReference = dbRef(db, 'Users/');
    onValue(usersReference, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedUsers = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        users.value = fetchedUsers;
        resolve(fetchedUsers);
      } else {
        users.value = [];
        resolve([]);
      }
    }, reject);
  });
};

function selectUserFromRoute() {
  const userIdFromUrl = route.query.user;
  if (userIdFromUrl && users.value.length > 0) {
    const match = users.value.find(u => String(u.id) === String(userIdFromUrl));
    if (match) {
      activeUserId.value = match.id;
      activeUser.value = match;
      return;
    }
  }
  // Si pas trouvé, sélectionne le premier utilisateur par défaut
  activeUserId.value = users.value[0]?.id || null;
  activeUser.value = users.value[0] || null;
}

onMounted(() => {
  // Écouter l'état d'authentification
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Définir l'utilisateur actuel
      currentUser.value = firebaseUser;
      await fetchAllUsers();
      selectUserFromRoute();
    } else {
      // Gérer l'utilisateur non authentifié
      currentUser.value = null;
      users.value = [];
      activeUser.value = null;
      activeUserId.value = null;
    }
  });
});

watch(() => route.query.user, () => {
  selectUserFromRoute();
});

watch(users, () => {
  selectUserFromRoute();
});

/**
 * Change l'utilisateur actif lorsqu'un utilisateur est sélectionné dans la barre latérale.
 * @param {Object} user - L'utilisateur sélectionné.
 */
function changeActiveUser(user) {
  activeUserId.value = user.id;
  activeUser.value = user;
  // Met à jour l'URL pour garder la synchro
  if (route.query.user !== String(user.id)) {
    window.history.replaceState(null, '', `?user=${encodeURIComponent(user.id)}`);
  }
}

/**
 * Fonction pour ajouter un message à un utilisateur spécifique dans Firebase Realtime Database.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {Object} message - Le message à ajouter.
 * @returns {Promise<void>}
 */
const addMessageToUser = (userId, message) => {
  return new Promise((resolve, reject) => {
    const messagesRef = dbRef(db, `Users/${userId}/messages`);
    push(messagesRef, message)
      .then(() => resolve())
      .catch((error) => reject(error));
  });
};

/**
 * Fonction pour écouter les messages d'un utilisateur spécifique en temps réel dans Firebase Realtime Database.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {Function} callback - Fonction à appeler avec les messages mis à jour.
 */
const listenToUserMessages = (userId, callback) => {
  const messagesRef = dbRef(db, `Users/${userId}/messages`);
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
    } else {
      callback([]);
    }
  }, (error) => {
    console.error("Erreur lors de l'écoute des messages :", error);
  });
};

/**
 * Fonction pour obtenir l'utilisateur actuel via Firebase Authentication.
 */
const getCurrentUser = (firebaseUser) => {
  if (!firebaseUser) return null;
  const [prenom, ...nomParts] = firebaseUser.displayName ? firebaseUser.displayName.split(' ') : [''];
  return {
    id: firebaseUser.uid,
    Prenom: prenom || 'Prénom',
    Nom: nomParts.join(' ') || 'Nom',
    Mail: firebaseUser.email,
    PhotoURL: firebaseUser.photoURL || '',
    UserName: firebaseUser.displayName || 'Utilisateur', // Utilisation de UserName
    Roles: {
      BA24: true, // Adapté selon votre logique
      physio: true,
      siteLoeche: true,
      student: true
    },
    status: "active",
    lastSeen: "Maintenant",
    messages: []
  };
};

/**
 * Fonction appelée lorsqu'un message est envoyé depuis le ChatBox.
 * @param {Object} message - Le message envoyé.
 */
function sendMessage(message) {
  if (activeUser.value) {
    try {
      addMessageToUser(activeUser.value.id, message);
      console.log("Message envoyé et sauvegardé dans Firebase :", message);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message à Firebase :", error);
    }
  } else {
    console.warn("Aucun utilisateur actif pour envoyer le message.");
  }
};
</script>

<style scoped>
/* Styles supplémentaires si nécessaire */
</style>