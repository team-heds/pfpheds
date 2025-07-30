<template>
  <div class="profile-admin-right-sidebar">
    <h4>Rechercher un étudiant</h4>
    <div class="field">
      <label for="search-user">Rechercher un étudiant :</label>
      <InputText
        id="search-user"
        v-model="searchTerm"
        placeholder="Entrez le nom ou le prénom"
        class="w-full"
      />
    </div>
    <div class="field">
      <label for="user-select">Sélectionner un étudiant :</label>
      <Dropdown
        id="user-select"
        v-model="selectedUserId"
        :options="filteredUsers"
        optionLabel="prenomNom"
        optionValue="uid"
        placeholder="Sélectionner un étudiant"
        class="w-full"
      />
    </div>
    <div class="field">
      <Button @click="handleUserChange" class="w-full">
        Accéder à l'étudiant
      </Button>
    </div>

    <h4>Rechercher un étudiant par rôle BA</h4>
    <div class="field">
      <label for="ba-role-select">Sélectionner un rôle BA :</label>
      <Dropdown
        id="ba-role-select"
        v-model="selectedRoleBA"
        :options="rolesBA"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner un rôle"
        class="w-full"
      />
    </div>

    <div class="field">
      <label for="role-search">Rechercher dans le rôle :</label>
      <InputText
        id="role-search"
        v-model="roleSearchTerm"
        placeholder="Entrez le nom ou le prénom"
        class="w-full"
      />
    </div>

    <div class="user-list">
      <div v-for="user in paginatedUsersByRole" :key="user.uid" class="user-item">
        <Button @click="handleBAUserChange(user.uid)" class="w-full">
          {{ user.prenom }} {{ user.nom }}
        </Button>
      </div>
    </div>

    <div class="pagination flex justify-between justify-content-center items-center mt-4">
      <Button class="m-2" @click="prevPage" :disabled="currentPage <= 0">Précédent</Button>
      <Button class="m-2" @click="nextPage" :disabled="currentPage >= totalPages - 1">Suivant</Button>
    </div>

    <!-- Boutons de navigation pour les étudiants BA22 -->
    <div class="ba-navigation-modern flex justify-between justify-content-center items-center mt-4">
      <Button class="ba-btn" @click="prevBA22" icon="pi pi-arrow-left" severity="secondary">
        <span class="ba-btn-label">Précédent BA22</span>
      </Button>
      <span class="ba-nav-separator"></span>
      <Button class="ba-btn" @click="nextBA22" icon="pi pi-arrow-right" iconPos="right" severity="primary">
        <span class="ba-btn-label">Suivant BA22</span>
      </Button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

import { ref, computed, onMounted, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { db } from 'root/firebase';
import { ref as firebaseRef, onValue } from 'firebase/database';

const router = useRouter();

// Variables de recherche et de pagination
const searchTerm = ref('');
const selectedUserId = ref(null);
const selectedRoleBA = ref(null);
const roleSearchTerm = ref('');
const currentPage = ref(0);
const itemsPerPage = 15;

// Liste des utilisateurs depuis /Users
const usersList = ref([]);

// Liste des rôles BA disponibles
const rolesBA = ref([
  { label: 'BA22', value: 'BA22' },
  { label: 'BA23', value: 'BA23' },
  { label: 'BA24', value: 'BA24' }
]);

// Récupération des utilisateurs depuis Firebase (/Users)
const fetchUsers = () => {
  const usersRef = firebaseRef(db, 'Users');
  onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      usersList.value = Object.entries(snapshot.val()).map(([uid, user]) => ({
        uid,
        prenom: user.Prenom || 'Inconnu',
        nom: user.Nom || 'Inconnu',
        prenomNom: `${user.Prenom || 'Inconnu'} ${user.Nom || 'Inconnu'}`,
        Roles: user.Roles || {}
      }));
    }
  });
};

onMounted(fetchUsers);

// Trie des utilisateurs par nom
const sortedUsers = computed(() => {
  return usersList.value.slice().sort((a, b) => a.nom.localeCompare(b.nom));
});

// Filtrage pour le dropdown de recherche
const filteredUsers = computed(() => {
  if (!searchTerm.value) return sortedUsers.value;
  return sortedUsers.value.filter(user =>
    `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Filtrage par rôle BA pour la recherche dans le dropdown
const filteredUsersByRole = computed(() => {
  if (!selectedRoleBA.value) return [];
  let filtered = sortedUsers.value.filter(user => {
    const role = user.Roles?.[selectedRoleBA.value];
    return role === true || (typeof role === 'string' && role.toLowerCase() === 'true');
  });
  if (roleSearchTerm.value) {
    const search = roleSearchTerm.value.toLowerCase();
    filtered = filtered.filter(user =>
      `${user.prenom} ${user.nom}`.toLowerCase().includes(search)
    );
  }
  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredUsersByRole.value.length / itemsPerPage));
const paginatedUsersByRole = computed(() => {
  const start = currentPage.value * itemsPerPage;
  return filteredUsersByRole.value.slice(start, start + itemsPerPage);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 0) currentPage.value--;
};

const handleUserChange = () => {
  if (selectedUserId.value)
    router.push({ name: 'ProfileAdmin', params: { id: selectedUserId.value } });
};

const handleBAUserChange = (uid) => {
  if (uid)
    router.push({ name: 'ProfileAdmin', params: { id: uid } });
};

// ------------------- Navigation BA22 -------------------
// Création d'une liste d'ID pour les utilisateurs BA22
// en filtrant la liste triée sur Users via Roles.BA22 (booléen ou "true").
const ba22UserIDs = computed(() => {
  return sortedUsers.value
    .filter(user => {
      const role = user.Roles?.BA22;
      return role === true || (typeof role === 'string' && role.toLowerCase() === 'true');
    })
    .map(user => user.uid);
});

// Pour vérifier la liste dans la console
watch(ba22UserIDs, (newIDs) => {
  console.log("Liste des IDs BA22 :", newIDs);
}, { immediate: true });

// Gestion de l'indice courant avec persistance via sessionStorage
const STORAGE_KEY = 'currentBA22Index';
const initialIndex = parseInt(sessionStorage.getItem(STORAGE_KEY)) || 0;
const currentBA22Index = ref(initialIndex);

// Watcher pour sauvegarder l'indice dans sessionStorage à chaque mise à jour
watch(currentBA22Index, (newIndex) => {
  sessionStorage.setItem(STORAGE_KEY, newIndex);
});

// Fonctions de navigation entre utilisateurs BA22
const nextBA22 = () => {
  if (ba22UserIDs.value.length === 0) return;
  currentBA22Index.value = (currentBA22Index.value + 1) % ba22UserIDs.value.length;
  const nextId = ba22UserIDs.value[currentBA22Index.value];
  console.log("Étudiant BA22 suivant, ID :", nextId);
  router.push({ name: 'ProfileAdmin', params: { id: nextId } });
};

const prevBA22 = () => {
  if (ba22UserIDs.value.length === 0) return;
  currentBA22Index.value = (currentBA22Index.value - 1 + ba22UserIDs.value.length) % ba22UserIDs.value.length;
  const prevId = ba22UserIDs.value[currentBA22Index.value];
  console.log("Étudiant BA22 précédent, ID :", prevId);
  router.push({ name: 'ProfileAdmin', params: { id: prevId } });
};
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
.user-item {
  margin-bottom: 0.5rem;
}
.profile-admin-right-sidebar {
  padding: 2rem;
  background-color: var(--surface-card);
  border-radius: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-right: 4rem;
}
.ba-navigation-modern {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 0.5rem;
}
.ba-btn {
  min-width: 90px;
  font-weight: 600;
  border-radius: 1.2rem;
  font-size: 1.05rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: background 0.2s, color 0.2s;
}
.ba-btn-label {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
.ba-nav-separator {
  width: 2.5rem;
  height: 2px;
  background: var(--primary-color, #ffb703);
  border-radius: 2px;
  opacity: 0.7;
}
</style>