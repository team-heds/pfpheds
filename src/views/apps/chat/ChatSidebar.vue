<script setup>
import UserCard from './UserCard.vue';
import { ref, watch, onMounted } from 'vue';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// Firebase Firestore
const db = getFirestore();

// Props
const props = defineProps({
  users: {
    type: Array,
    default: () => []
  }
});

// Références réactives
const filteredUsers = ref([]);
const searchedUser = ref('');
const emit = defineEmits(['change:active:user']);

// Charger les utilisateurs en temps réel depuis Firebase
const loadUsers = async () => {
  const usersCollection = collection(db, 'Users');

  onSnapshot(usersCollection, (snapshot) => {
    const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    filteredUsers.value = usersData;
  });
};

// Filtrer les utilisateurs
const filter = () => {
  if (searchedUser.value.trim() === '') {
    filteredUsers.value = props.users;
    return;
  }

  filteredUsers.value = props.users.filter((user) =>
    user.name.toLowerCase().includes(searchedUser.value.toLowerCase())
  );
};

// Gérer la sélection de l'utilisateur actif
const onChangeActiveUser = (user) => {
  emit('change:active:user', user);
};

// Charger les utilisateurs lors du montage
onMounted(() => {
  loadUsers();
});
</script>

<template>
  <!-- En-tête de l'utilisateur connecté -->
  <div class="flex flex-column align-items-center border-bottom-1 surface-border p-6">
    <img src="/demo/images/avatar/circle/avatar-f-1@2x.png" class="w-6rem h-6rem border-circle shadow-4" alt="Asiya Javayant" />
    <span class="text-900 text-xl font-semibold mt-4">Asiya Javayant</span>
  </div>

  <!-- Zone de recherche et liste des utilisateurs -->
  <div class="w-full flex row-gap-4 flex-column surface-border p-4">
    <!-- Barre de recherche -->
    <IconField iconPosition="left" class="w-full">
      <InputIcon class="pi pi-search" />
      <InputText
        id="search"
        type="text"
        placeholder="Search"
        class="w-full"
        v-model="searchedUser"
        @input="filter"
      />
    </IconField>

    <!-- Liste des utilisateurs -->
    <div class="flex flex-row gap-4 md:flex-column overflow-auto">
      <UserCard
        v-for="user in filteredUsers"
        :key="user.id"
        :user="user"
        @click="onChangeActiveUser(user)"
      />
    </div>
  </div>
</template>
