<!-- src/components/ProfileAdminRightSidebar.vue -->
<template>
    <div class="profile-admin-right-sidebar card p-4">
      <!-- Section 1 : Recherche globale -->
      <h4 class="sidebar-title">Rechercher un étudiant</h4>
      <!-- Recherche par nom/prénom -->
      <div class="mb-4">
        <label for="search-user" class="block text-sm font-medium text-gray-700">
          Rechercher un étudiant :
        </label>
        <input
          id="search-user"
          type="text"
          v-model="searchTerm"
          placeholder="Entrez le nom ou le prénom"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <!-- Sélection d'un étudiant dans la liste filtrée -->
      <div class="mb-6">
        <label for="user-select" class="block text-sm font-medium text-gray-700">
          Sélectionner un étudiant :
        </label>
        <select
          id="user-select"
          v-model="selectedUserId"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          <option
            v-for="user in filteredUsers"
            :key="user.uid"
            :value="user.uid"
          >
            {{ user.prenom }} {{ user.nom }}
          </option>
        </select>
      </div>
      <!-- Bouton pour accéder au profil de l'étudiant sélectionné -->
      <div class="mb-6">
        <button
          @click="handleUserChange"
          class="mt-1 block w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Accéder à l'étudiant
        </button>
      </div>
  
      <hr class="my-4" />
  
      <!-- Section 2 : Recherche par rôle BA avec pagination et boutons -->
      <h4 class="sidebar-title">Rechercher un étudiant par rôle BA</h4>
      <!-- Sélection du rôle BA -->
      <div class="mb-4">
        <label for="ba-role-select" class="block text-sm font-medium text-gray-700">
          Sélectionner un rôle BA :
        </label>
        <select
          id="ba-role-select"
          v-model="selectedRoleBA"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          @change="currentPage = 1"  
        >
          <option value="BA22">BA22</option>
          <option value="BA23">BA23</option>
          <option value="BA24">BA24</option>
        </select>
      </div>
      <!-- Recherche dans la liste des étudiants du rôle sélectionné -->
      <div class="mb-4">
        <label for="role-search" class="block text-sm font-medium text-gray-700">
          Rechercher dans le rôle :
        </label>
        <input
          id="role-search"
          type="text"
          v-model="roleSearchTerm"
          placeholder="Entrez le nom ou le prénom"
          class="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          @input="currentPage = 1"  
        />
      </div>
      <!-- Affichage de la liste paginée des étudiants sous forme de boutons -->
      <div class="mb-6">
        <div
          v-for="user in paginatedUsersByRole"
          :key="user.uid"
          class="mb-2"
        >
          <button
            @click="handleBAUserChange(user.uid)"
            class="block w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            {{ user.prenom }} {{ user.nom }}
          </button>
        </div>
      </div>
      <!-- Contrôles de pagination -->
      <div class="pagination flex justify-between items-center">
        <button
          @click="prevPage"
          :disabled="currentPage <= 1"
          class="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Précédent
        </button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Suivant
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, watch } from 'vue';
  import { getDatabase, ref as dbRef, get } from 'firebase/database';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'ProfileAdminRightSidebar',
    setup() {
      const router = useRouter();
  
      // --------------------- Section 1 : Recherche globale ---------------------
      const searchTerm = ref('');
      const usersList = ref([]);
      const selectedUserId = ref(null);
      const isLoading = ref(false);
  
      // Enregistrer et restaurer le paramètre de recherche global
      const loadGlobalSearchParam = () => {
        const stored = localStorage.getItem('ProfileAdminRightSidebar_searchTerm');
        if (stored !== null) {
          searchTerm.value = stored;
        }
      };
      watch(searchTerm, (newVal) => {
        localStorage.setItem('ProfileAdminRightSidebar_searchTerm', newVal);
      });
  
      // Filtrer les utilisateurs selon le terme de recherche global
      const filteredUsers = computed(() => {
        if (!searchTerm.value) return usersList.value;
        return usersList.value.filter(user => {
          const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
          return fullName.includes(searchTerm.value.toLowerCase());
        });
      });
  
      // ----------------- Section 2 : Recherche par rôle BA -----------------
      const selectedRoleBA = ref('BA22');
      const roleSearchTerm = ref('');
      const currentPage = ref(1);
      const itemsPerPage = 15;
  
      // Enregistrer et restaurer les paramètres spécifiques au rôle BA
      const loadBASearchParams = () => {
        const storedRole = localStorage.getItem('ProfileAdminRightSidebar_selectedRoleBA');
        if (storedRole !== null) {
          selectedRoleBA.value = storedRole;
        }
        const storedRoleSearch = localStorage.getItem('ProfileAdminRightSidebar_roleSearchTerm');
        if (storedRoleSearch !== null) {
          roleSearchTerm.value = storedRoleSearch;
        }
        const storedPage = localStorage.getItem('ProfileAdminRightSidebar_currentPage');
        if (storedPage !== null) {
          currentPage.value = parseInt(storedPage, 10);
        }
      };
  
      watch(selectedRoleBA, (newVal) => {
        localStorage.setItem('ProfileAdminRightSidebar_selectedRoleBA', newVal);
      });
      watch(roleSearchTerm, (newVal) => {
        localStorage.setItem('ProfileAdminRightSidebar_roleSearchTerm', newVal);
      });
      watch(currentPage, (newVal) => {
        localStorage.setItem('ProfileAdminRightSidebar_currentPage', newVal);
      });
  
      // Filtrer les utilisateurs qui possèdent le rôle BA sélectionné,
      // exclure ceux dont le prénom ET le nom sont vides, appliquer la recherche
      // et trier par ordre alphabétique sur le nom.
      const filteredUsersByRole = computed(() => {
        let users = usersList.value.filter(user => {
          return user.Roles && user.Roles[selectedRoleBA.value];
        });
        // Exclure les utilisateurs sans prénom ET sans nom
        users = users.filter(user => {
          const prenom = user.prenom ? user.prenom.trim() : '';
          const nom = user.nom ? user.nom.trim() : '';
          return prenom !== '' || nom !== '';
        });
        if (roleSearchTerm.value) {
          users = users.filter(user => {
            const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
            return fullName.includes(roleSearchTerm.value.toLowerCase());
          });
        }
        return users.sort((a, b) => a.nom.localeCompare(b.nom));
      });
  
      // Pagination : calcul du nombre total de pages et découpage des utilisateurs
      const totalPages = computed(() =>
        Math.ceil(filteredUsersByRole.value.length / itemsPerPage)
      );
      const paginatedUsersByRole = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage;
        return filteredUsersByRole.value.slice(start, start + itemsPerPage);
      });
  
      const nextPage = () => {
        if (currentPage.value < totalPages.value) {
          currentPage.value++;
        }
      };
  
      const prevPage = () => {
        if (currentPage.value > 1) {
          currentPage.value--;
        }
      };
  
      // ----------------------- Récupération des utilisateurs -----------------------
      const fetchAllUsers = async () => {
        try {
          const db = getDatabase();
          const usersRef = dbRef(db, 'Users');
          const snapshot = await get(usersRef);
          if (snapshot.exists()) {
            const usersData = snapshot.val();
            const allUsers = Object.keys(usersData).map(uid => {
              const uData = usersData[uid];
              return {
                uid,
                prenom: uData.Prenom || '',
                nom: uData.Nom || '',
                email: uData.Mail || '',
                Roles: uData.Roles || {}
              };
            });
            usersList.value = allUsers;
            // Pour la recherche globale, sélection par défaut du premier utilisateur
            if (allUsers.length > 0 && !selectedUserId.value) {
              selectedUserId.value = allUsers[0].uid;
            }
          } else {
            console.error("Aucun utilisateur trouvé.");
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des utilisateurs :", error);
        }
      };
  
      // ----------------------- Navigation vers le profil -----------------------
      const handleUserChange = () => {
        if (selectedUserId.value) {
          router.push({ name: 'ProfileAdmin', params: { id: selectedUserId.value } });
        }
      };
  
      const handleBAUserChange = (userId) => {
        if (userId) {
          router.push({ name: 'ProfileAdmin', params: { id: userId } });
        }
      };
  
      // Au montage, on charge les paramètres enregistrés puis on récupère la liste des utilisateurs
      onMounted(() => {
        loadGlobalSearchParam();
        loadBASearchParams();
        fetchAllUsers();
      });
  
      return {
        // Section globale
        searchTerm,
        selectedUserId,
        filteredUsers,
        isLoading,
        handleUserChange,
        // Section BA et pagination
        selectedRoleBA,
        roleSearchTerm,
        filteredUsersByRole,
        paginatedUsersByRole,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        handleBAUserChange
      };
    }
  };
  </script>
  
  <style scoped>
  .profile-admin-right-sidebar {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .sidebar-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #333333;
  }
  
  .mb-4 {
    margin-bottom: 1rem;
  }
  
  .mb-6 {
    margin-bottom: 1.5rem;
  }
  
  hr {
    border-top: 1px solid #e5e7eb;
    margin: 1.5rem 0;
  }
  
  .pagination button {
    cursor: pointer;
  }
  
  .pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  </style>
  