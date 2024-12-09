<!-- src/views/apps/chat/ChatSidebar.vue -->
<template>
    <!-- Informations de l'utilisateur actuel -->
    <div class="flex flex-col items-center border-b border-gray-300 p-6">
      <img 
        :src="currentUser.PhotoURL || '/demo/images/avatar/default.png'" 
        class="w-24 h-24 rounded-full object-cover shadow-md"
        :alt="userDisplayName"
      />
      <span class="text-xl font-semibold mt-4 text-gray-800">{{ userDisplayName }}</span>
    </div>

    <!-- Barre de recherche -->
    <div class="p-12">
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

    <!-- Liste des utilisateurs -->
    <div class="p-4 overflow-auto" style="max-height: calc(100vh - 200px);">
      <UserCard
        v-for="user in filteredUsers"
        :key="user.id"
        :user="user"
        @click="onChangeActiveUser(user)"
      />
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import UserCard from './UserCard.vue';

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

const emit = defineEmits(['change:active:user']);

const filteredUsers = ref([]);
const searchedUser = ref('');

// Computed property pour afficher le nom de l'utilisateur actuel
const userDisplayName = computed(() => {
  return `${props.currentUser.UserName || 'Utilisateur'}`;
});

// Watcher pour initialiser et mettre à jour la liste des utilisateurs
watch(
  () => props.users,
  (newUsers) => {
    filteredUsers.value = newUsers;
    console.log("Liste des utilisateurs mis à jour :", newUsers);
  },
  { immediate: true }
);

// Fonction pour changer l'utilisateur actif et logger l'utilisateur sélectionné
const onChangeActiveUser = (user) => {
  emit('change:active:user', user);
  console.log("Utilisateur sélectionné :", user);
};

// Fonction de filtrage et logger les résultats filtrés
const filter = () => {
  const query = searchedUser.value.trim().toLowerCase();

  if (!query) {
    filteredUsers.value = props.users;
    console.log("Recherche réinitialisée. Liste complète des utilisateurs :", props.users);
    return;
  }

  // Filtrer les utilisateurs en fonction de UserName ou Mail
  filteredUsers.value = props.users.filter((user) =>
    (user.UserName && user.UserName.toLowerCase().includes(query)) ||
    (user.Mail && user.Mail.toLowerCase().includes(query))
  );

  // Extraire les UserName des utilisateurs filtrés
  const userNames = filteredUsers.value.map(user => user.UserName || 'Utilisateur');
  console.log(`Résultat de la recherche pour "${query}" :`, userNames);
};
</script>

<style scoped>
/* Ajoutez des styles supplémentaires si nécessaire */

.user-card:hover {
  background-color: #f0f0f0;
}
</style>
