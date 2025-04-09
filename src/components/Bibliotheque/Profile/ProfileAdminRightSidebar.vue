<template>
  <div class="profile-admin-right-sidebar card">
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
      <div
        v-for="user in paginatedUsersByRole"
        :key="user.uid"
        class="user-item"
      >
        <Button @click="handleBAUserChange(user.uid)" class="w-full">
          {{ user.prenom }} {{ user.nom }}
        </Button>
      </div>
    </div>

    <div
      class="pagination flex justify-between justify-content-center items-center mt-4"
    >
      <Button class="m-2" @click="prevPage" :disabled="currentPage <= 0">
        Précédent
      </Button>
      <Button class="m-2" @click="nextPage" :disabled="currentPage >= totalPages - 1">
        Suivant
      </Button>
    </div>

    <!-- Nouveaux boutons de navigation pour les étudiants BA22 -->
    <div class="ba-navigation flex justify-center items-center mt-4">
      <Button class="m-4" @click="prevBA22" icon="pi pi-arrow-left">
        BA22 <<< 
      </Button>
      <Button class="m-4" @click="nextBA22" icon="pi pi-arrow-right">
        >>> BA22
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { db } from 'root/firebase';
import { ref as firebaseRef, onValue } from 'firebase/database';

const router = useRouter();

const searchTerm = ref('');
const selectedUserId = ref(null);
const selectedRoleBA = ref(null);
const roleSearchTerm = ref('');
const currentPage = ref(0);
const itemsPerPage = 15;
const usersList = ref([]);
// Nouvelle variable pour la liste des étudiants depuis /Students
const studentsList = ref([]);

// Liste des rôles BA
const rolesBA = ref([
  { label: 'BA22', value: 'BA22' },
  { label: 'BA23', value: 'BA23' },
  { label: 'BA24', value: 'BA24' }
]);

// Récupération des utilisateurs depuis Firebase (noeud Users)
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

// Récupération des étudiants depuis Firebase (noeud Students)
// On suppose que chaque étudiant possède le champ "Classe" ou "Class"
const fetchStudents = () => {
  const studentsRef = firebaseRef(db, 'Students');
  onValue(studentsRef, (snapshot) => {
    if (snapshot.exists()) {
      studentsList.value = Object.entries(snapshot.val()).map(([uid, student]) => ({
        uid,
        prenom: student.Prenom || 'Inconnu',
        nom: student.Nom || 'Inconnu',
        prenomNom: `${student.Prenom || 'Inconnu'} ${student.Nom || 'Inconnu'}`,
        classe: student.Classe || student.Class || ''
      }));
    }
  });
};

onMounted(() => {
  fetchUsers();
  fetchStudents();
});

// Tri des utilisateurs par nom de famille (pour le dropdown de recherche)
const sortedUsers = computed(() => {
  return usersList.value.slice().sort((a, b) => a.nom.localeCompare(b.nom));
});

// Filtrage des étudiants par nom/prénom dans le dropdown Users
const filteredUsers = computed(() => {
  if (!searchTerm.value) return sortedUsers.value;
  return sortedUsers.value.filter(user =>
    `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Filtrage des étudiants par rôle BA (pour la recherche par rôle)
// Ici, on continue d'utiliser le filtre sur le noeud Users pour ce dropdown
const filteredUsersByRole = computed(() => {
  if (!selectedRoleBA.value) return [];
  let users = sortedUsers.value.filter(user => user.Roles?.[selectedRoleBA.value]);
  if (roleSearchTerm.value) {
    const search = roleSearchTerm.value.toLowerCase();
    users = users.filter(user =>
      `${user.prenom} ${user.nom}`.toLowerCase().includes(search)
    );
  }
  return users;
});

// Pagination des résultats filtrés par rôle BA
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
const handleBAUserChange = (userId) => {
  if (userId)
    router.push({ name: 'ProfileAdmin', params: { id: userId } });
};

// ----------------- Boutons de navigation BA22 -----------------
// Ici, nous filtrons la liste des étudiants à partir de la liste récupérée depuis /Students
// pour ne retenir que ceux dont la propriété "classe" est "BA22".
const ba22Users = computed(() => {
  return studentsList.value.filter(student => student.Classe === 'BA22');
});

// Variable réactive pour conserver l'index de navigation dans la liste BA22
const currentBA22Index = ref(0);

const nextBA22 = () => {
  if (ba22Users.value.length === 0) return;
  if (currentBA22Index.value < ba22Users.value.length - 1) {
    currentBA22Index.value++;
  } else {
    currentBA22Index.value = 0; // Retour au premier étudiant
  }
  router.push({ name: 'ProfileAdmin', params: { id: ba22Users.value[currentBA22Index.value].uid } });
};

const prevBA22 = () => {
  if (ba22Users.value.length === 0) return;
  if (currentBA22Index.value > 0) {
    currentBA22Index.value--;
  } else {
    currentBA22Index.value = ba22Users.value.length - 1; // Aller au dernier étudiant
  }
  router.push({ name: 'ProfileAdmin', params: { id: ba22Users.value[currentBA22Index.value].uid } });
};
// -----------------------------------------------------------------

</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
.user-item {
  margin-bottom: 0.5rem;
}
</style>
