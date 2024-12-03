<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { getFirestore, collection, doc, getDocs, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import ChatBox from './ChatBox.vue';
import ChatSidebar from './ChatSidebar.vue';
import Navbar from '@/components/Utils/Navbar.vue'

const db = getFirestore();

// Références réactives
const activeUserId = ref(null);
const users = ref([]);
const messages = ref([]);

// Charger les utilisateurs depuis Firebase
const loadUsers = async () => {
  const usersCollection = collection(db, 'Users');
  const snapshot = await getDocs(usersCollection);
  users.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Charger les messages pour l'utilisateur actif
const loadMessages = async () => {
  if (!activeUserId.value) return;

  const messagesCollection = collection(db, 'Messages');
  const q = query(messagesCollection, where('userId', '==', activeUserId.value));
  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    scrollToLastMessage();
  });
};

// Changer l'utilisateur actif
const changeActiveUser = (user) => {
  activeUserId.value = user.id;
  loadMessages();
};

// Envoyer un message et le sauvegarder dans Firebase
const sendMessage = async (message) => {
  if (!activeUserId.value) return;

  const messagesCollection = collection(db, 'Messages');
  await addDoc(messagesCollection, {
    userId: activeUserId.value,
    text: message,
    timestamp: new Date().toISOString(),
  });

  scrollToLastMessage();
};

// Scroller jusqu'au dernier message
const scrollToLastMessage = async () => {
  const element = document.querySelector('.user-message-container');
  if (element) {
    await nextTick(() => {
      element.scroll({ top: element.scrollHeight });
    });
  }
};

// Charger les données initiales
onMounted(async () => {
  await loadUsers();
});
</script>

<template>
  <Navbar title="Chat" />
  <div class="flex flex-column md:flex-row gap-5" style="min-height: 81vh">
    <!-- Sidebar avec les utilisateurs -->
    <div class="md:w-25rem card p-0">
      <ChatSidebar @change:active:user="changeActiveUser" :users="users"></ChatSidebar>
    </div>

    <!-- ChatBox avec les messages -->
    <div class="flex-1 card p-0">
      <ChatBox :user="users" @send:message="sendMessage" :messages="messages"></ChatBox>
    </div>
  </div>
</template>
