<!-- src/views/apps/community/CommunityManagement.vue -->
<template>
  <div class="community-management">
    <!-- Navbar -->
    <Navbar />

    <!-- Section de création de communauté -->
    <div class="create-community-section card shadow-sm">
      <div class="card-header">
        <h2>Créer une Nouvelle Communauté</h2>
      </div>
      <div class="card-body">
        <form @submit.prevent="createCommunity" class="create-community-form">
          <div class="form-group">
            <label for="communityName">Nom de la Communauté</label>
            <input
              type="text"
              id="communityName"
              v-model="newCommunity.name"
              required
              placeholder="Entrez le nom de la communauté"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label for="communityDescription">Description</label>
            <textarea
              id="communityDescription"
              v-model="newCommunity.description"
              rows="3"
              required
              placeholder="Entrez la description de la communauté"
              class="form-control"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="communityType">Type de Communauté</label>
            <select id="communityType" v-model="newCommunity.type" required class="form-control">
              <option value="" disabled>-- Sélectionnez le type --</option>
              <option value="public">Public</option>
              <option value="closed">Fermé</option>
              <option value="hidden">Caché</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Créer</button>
        </form>
      </div>
    </div>

    <!-- Liste des Communautés -->
    <div class="communities-list-section card shadow-sm mt-4">
      <div class="card-header">
        <h2>Liste des Communautés</h2>
      </div>
      <div class="card-body p-0">
        <table class="communities-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="community in communities" :key="community.id">
              <td>{{ community.name }}</td>
              <td>{{ community.description }}</td>
              <td>{{ capitalize(community.type) }}</td>
              <td>
                <button
                  class="btn btn-success btn-sm"
                  @click="manageCommunity(community.id)"
                >
                  Gérer
                </button>
              </td>
            </tr>
            <tr v-if="communities.length === 0">
              <td colspan="4" class="text-center">Aucune communauté trouvée.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div v-for="(toast, index) in toasts" :key="index" :class="['toast', toast.severity]">
        <strong>{{ toast.summary }}</strong>
        <p>{{ toast.detail }}</p>
        <button @click="removeToast(index)">✖</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import Navbar from '@/components/Utils/Navbar.vue';
import { db, auth } from "@/firebase.js";
import { ref as dbRef, push, set, get, update } from "firebase/database";
import { useRouter } from "vue-router";

export default {
  name: "CommunityManagement",
  components: {
    Navbar
  },
  setup() {
    const router = useRouter();

    // Références réactives
    const communities = ref([]);
    const newCommunity = ref({
      name: "",
      description: "",
      type: ""
    });
    const toasts = ref([]);
    const localCurrentUser = ref(null);

    // Fonctions pour gérer les toasts
    const addToast = (severity, summary, detail) => {
      toasts.value.push({ severity, summary, detail });
      // Supprimer le toast après 3 secondes
      setTimeout(() => {
        removeToast(0);
      }, 3000);
    };

    const removeToast = (index) => {
      toasts.value.splice(index, 1);
    };

    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Fonction pour récupérer l'utilisateur actuel
    const fetchCurrentUser = () => {
      const user = auth.currentUser;
      if (user) {
        localCurrentUser.value = user;
      } else {
        // Gérer l'utilisateur non authentifié
        addToast('error', 'Erreur', 'Utilisateur non authentifié.');
      }
    };

    // Fonction pour créer une nouvelle communauté
    const createCommunity = async () => {
      if (!newCommunity.value.name || !newCommunity.value.description || !newCommunity.value.type) {
        addToast('error', 'Erreur', 'Veuillez remplir tous les champs.');
        return;
      }

      try {
        const communityRef = push(dbRef(db, "Communities"));
        await set(communityRef, {
          name: newCommunity.value.name,
          description: newCommunity.value.description,
          type: newCommunity.value.type, // Ajouter le type de communauté
          createdBy: localCurrentUser.value.uid, // Utiliser l'ID de l'utilisateur actuel
          members: {
            [localCurrentUser.value.uid]: { role: 'manager' } // Ajouter l'utilisateur créateur en tant que membre avec rôle manager
          }
        });
        addToast('success', 'Succès', 'Communauté créée avec succès.');
        newCommunity.value.name = "";
        newCommunity.value.description = "";
        newCommunity.value.type = "";
        fetchCommunities();
      } catch (error) {
        console.error("Erreur lors de la création de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de créer la communauté.');
      }
    };

    // Fonction pour récupérer les communautés
    const fetchCommunities = async () => {
      try {
        const communitiesSnapshot = await get(dbRef(db, "Communities"));
        if (communitiesSnapshot.exists()) {
          const data = communitiesSnapshot.val();
          communities.value = Object.entries(data).map(([key, community]) => ({
            id: key,
            ...community
          }));
        } else {
          communities.value = [];
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des communautés :", error);
        addToast('error', 'Erreur', 'Impossible de récupérer les communautés.');
      }
    };

    // Fonction pour gérer une communauté (naviguer vers ManageOneCommunity.vue)
    const manageCommunity = (communityId) => {
      router.push({ name: 'ManageOneCommunity', params: { id: communityId } });
    };

    onMounted(() => {
      fetchCurrentUser();
      fetchCommunities();
    });

    return {
      communities,
      newCommunity,
      createCommunity,
      fetchCommunities,
      manageCommunity,
      capitalize,
      toasts,
      removeToast
    };
  }
};
</script>

<style scoped>
.community-management {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333; /* Texte sombre pour un bon contraste */
}

/* Sections principales */
.create-community-section,
.communities-list-section {
  margin-bottom: 2rem;
}

/* Card pour les sections */
.card {
  border: 1px solid #dddddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Ombre légère */
}

.card-header {
  padding: 1rem;
  border-bottom: 1px solid #dddddd;
}

.card-body {
  padding: 1.5rem;
}

/* Formulaire de création de communauté */
.create-community-form .form-group label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: block;
}

.create-community-form .form-control {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #cccccc;
  border-radius: 6px;
  width: 100%;
}

.btn-block {
  width: 100%;
}

/* Table des communautés */
.communities-table {
  width: 100%;
  border-collapse: collapse;
}

.communities-table th,
.communities-table td {
  border: 1px solid #dddddd;
  padding: 1rem;
  text-align: left;
}

.communities-table th {
  background-color: #f1f1f1;
  color: #333333;
}

.communities-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.communities-table tr:hover {
  background-color: #f1f1f1;
}

/* Boutons */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: #ffffff;
}

.btn-success:hover {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  margin-right: 0.5rem;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}

.toast {
  background-color: #333333;
  color: #ffffff;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-radius: 6px;
  min-width: 250px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toast.success {
  background-color: #28a745;
}

.toast.error {
  background-color: #dc3545;
}

.toast.warn {
  background-color: #ffc107;
  color: #212529;
}

.toast p {
  margin: 0;
  padding-left: 0.5rem;
}

.toast button {
  background: none;
  border: none;
  color: inherit;
  font-size: 1rem;
  cursor: pointer;
}

/* Responsive Design */
@media (max-width: 768px) {
  .community-management {
    padding: 1rem;
  }

  .create-community-form .form-group,
  .communities-list-section .communities-table th,
  .communities-list-section .communities-table td {
    font-size: 0.9rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .toast {
    min-width: 200px;
    padding: 0.75rem;
  }
}
</style>
