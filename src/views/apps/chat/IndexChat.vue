<!-- src/views/apps/chat/IndexChat.vue -->
<template>
  <Navbar title="Chat"></Navbar>
  <div class="flex flex-col md:flex-row gap-5 p-4" style="min-height: 81vh">
    <!-- Sidebar avec la liste des utilisateurs -->
    <div class="md:w-80rem card p-0">
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
    <div class="flex-1 card p-0">
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
import { ref, onMounted } from 'vue';
import ChatBox from './ChatBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue';
import { db, auth } from '@/firebase'; // Importer seulement db et auth
import { ref as dbRef, onValue, push } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

// États réactifs
const users = ref([]);
const activeUserId = ref(null);
const activeUser = ref(null);
const currentUser = ref(null); // Définir l'utilisateur actuel

/**
 * Fonction pour récupérer tous les utilisateurs directement dans le composant.
 * @returns {Promise<Array>} - Une promesse qui résout avec un tableau d'utilisateurs.
 */
const fetchAllUsers = () => {
  console.log("fetching");
  return new Promise((resolve, reject) => {
    const usersReference = dbRef(db, 'Users/');
    onValue(usersReference, (snapshot) => {
      const data = snapshot.val();
      console.log("Snapshot data:", data); // Loguer les données brutes
      if (data) {
        const fetchedUsers = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        console.log("Liste des utilisateurs récupérée :", fetchedUsers[0]);
        resolve(fetchedUsers);
      } else {
        console.log("Aucun utilisateur trouvé dans la base de données.");
        resolve([]);
      }
    }, (error) => {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
      reject(error);
    });
  });
};

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

onMounted(() => {
  // Écouter l'état d'authentification
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Définir l'utilisateur actuel
      currentUser.value = getCurrentUser(firebaseUser);
      console.log("Utilisateur authentifié :", currentUser.value);

      try {
        // Récupérer tous les utilisateurs
        const fetchedUsers = await fetchAllUsers();
        users.value = fetchedUsers;
        console.log("Utilisateurs assignés à users.value :", users.value);

        // Définir l'utilisateur actif par défaut si aucun n'est sélectionné
        if (fetchedUsers.length > 0) {
          activeUserId.value = fetchedUsers[0].id;
          activeUser.value = fetchedUsers[0];
          console.log("Utilisateur actif par défaut :", activeUser.value);

          // Écouter les messages de l'utilisateur actif
          listenToUserMessages(activeUser.value.id, (fetchedMessages) => {
            activeUser.value.messages = fetchedMessages;
            console.log("Messages mis à jour pour l'utilisateur actif :", fetchedMessages);
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs :", error);
      }
    } else {
      // Gérer l'utilisateur non authentifié
      currentUser.value = null;
      users.value = [];
      activeUser.value = null;
      console.log("Aucun utilisateur authentifié.");
    }
  });
});

/**
 * Change l'utilisateur actif lorsqu'un utilisateur est sélectionné dans la barre latérale.
 * @param {Object} user - L'utilisateur sélectionné.
 */
const changeActiveUser = (user) => {
  activeUserId.value = user.id;
  activeUser.value = user;
  console.log("Utilisateur actif changé :", user);

  // Écouter les messages de l'utilisateur actif en temps réel
  listenToUserMessages(user.id, (fetchedMessages) => {
    activeUser.value.messages = fetchedMessages;
    console.log("Messages mis à jour pour l'utilisateur actif :", fetchedMessages);
  });
};

/**
 * Fonction appelée lorsqu'un message est envoyé depuis le ChatBox.
 * @param {Object} message - Le message envoyé.
 */
const sendMessage = async (message) => {
  if (activeUser.value) {
    try {
      await addMessageToUser(activeUser.value.id, message);
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
