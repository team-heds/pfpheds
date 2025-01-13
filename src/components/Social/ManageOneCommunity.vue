<!-- src/views/apps/community/ManageOneCommunity.vue -->
<template>
  <div class="manage-community">
    <!-- Navbar -->
    <Navbar />

    <!-- Section des Détails de la Communauté -->
    <div class="community-details-section" v-if="community && localCurrentUser">
      <h2>Détails de la Communauté</h2>
      <div class="community-details card shadow-sm">
        <div class="card-body">
          <h5 class="card-title">
            <i class="fas fa-users mr-2"></i>{{ community.name }}
          </h5>
          <p class="card-text">
            <strong>Description:</strong> {{ community.description }}
          </p>
          <p class="card-text">
            <strong>Type:</strong> {{ capitalize(community.type) }}
          </p>
          <p class="card-text">
            <strong>Créée par:</strong> {{ creatorName }}
          </p>
        </div>
      </div>

      <!-- Boutons pour Modifier le Nom, la Description et le Type (Visible uniquement pour les Managers) -->
      <div v-if="isManager" class="edit-community-buttons mt-3">
        <Button @click="toggleEditName" class="btn btn-secondary mr-2">
          <i class="fas fa-edit mr-2"></i>Modifier le Nom
        </Button>
        <Button @click="toggleEditDescription" class="btn btn-secondary mr-2">
          <i class="fas fa-edit mr-2"></i>Modifier la Description
        </Button>
        <Button @click="toggleEditType" class="btn btn-secondary">
          <i class="fas fa-edit mr-2"></i>Modifier le Type de la Communauté
        </Button>
      </div>

      <!-- Formulaire pour Modifier le Nom de la Communauté -->
      <div v-if="editName" class="edit-community-name-form card mt-3">
        <div class="card-body">
          <form @submit.prevent="updateCommunityName">
            <div class="form-group">
              <label for="newCommunityName"><i class="fas fa-heading mr-2"></i>Nouveau Nom de Communauté</label>
              <input
                type="text"
                id="newCommunityName"
                v-model="newCommunityName"
                class="form-control"
                required
              />
            </div>
            <Button type="submit" class="btn btn-primary mr-2">
              <i class="fas fa-check mr-1"></i>Mettre à Jour
            </Button>
            <Button type="button" @click="toggleEditName" class="btn btn-secondary">
              <i class="fas fa-times mr-1"></i>Annuler
            </Button>
          </form>
        </div>
      </div>

      <!-- Formulaire pour Modifier la Description de la Communauté -->
      <div v-if="editDescription" class="edit-community-description-form card mt-3">
        <div class="card-body">
          <form @submit.prevent="updateCommunityDescription">
            <div class="form-group">
              <label for="newCommunityDescription"><i class="fas fa-align-left mr-2"></i>Nouvelle Description de Communauté</label>
              <textarea
                id="newCommunityDescription"
                v-model="newCommunityDescription"
                class="form-control"
                rows="3"
                required
              ></textarea>
            </div>
            <Button type="submit" class="btn btn-primary mr-2">
              <i class="fas fa-check mr-1"></i>Mettre à Jour
            </Button>
            <Button type="button" @click="toggleEditDescription" class="btn btn-secondary">
              <i class="fas fa-times mr-1"></i>Annuler
            </Button>
          </form>
        </div>
      </div>

      <!-- Formulaire pour Modifier le Type de la Communauté -->
      <div v-if="editType" class="edit-community-type-form card mt-3">
        <div class="card-body">
          <form @submit.prevent="updateCommunityType">
            <div class="form-group">
              <label for="newCommunityType"><i class="fas fa-cogs mr-2"></i>Nouveau Type de Communauté</label>
              <select id="newCommunityType" v-model="newCommunityType" class="form-control" required>
                <option value="" disabled>-- Sélectionnez le type --</option>
                <option value="public">Public</option>
                <option value="closed">Fermé</option>
                <option value="hidden">Caché</option>
              </select>
            </div>
            <button type="submit" class="btn btn-primary mr-2">
              <i class="fas fa-check mr-1"></i>Mettre à Jour
            </button>
            <button type="button" @click="toggleEditType" class="btn btn-secondary">
              <i class="fas fa-times mr-1"></i>Annuler
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Section de Gestion des Membres -->
    <div class="members-management-section" v-if="community && localCurrentUser">
      <h2>Membres de la Communauté</h2>

      <!-- Formulaire pour Ajouter un Membre -->
      <form @submit.prevent="addMember" class="add-member-form card shadow-sm mb-4">
        <div class="card-body">
          <div class="form-row">
            <h2>Ajouter Utilisateur</h2>
            <div class="form-group col-md-3">
              <label for="selectedUser"><i class="fas fa-user-plus mr-2"></i>Utilisateur</label>
              <select id="selectedUser" v-model="selectedUserId" class="form-control" required>
                <option value="" disabled>-- Sélectionnez --</option>
                <option
                  v-for="user in filteredUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.displayName || user.email }}
                </option>
              </select>
            </div>
            <div class="form-group col-md-3">
              <label for="userRole"><i class="fas fa-user-tag mr-2"></i>Rôle</label>
              <select id="userRole" v-model="selectedUserRole" class="form-control" required>
                <option value="" disabled>-- Sélectionnez --</option>
                <option value="manager">Manager</option>
                <option value="member">Membre</option>
              </select>
            </div>
          </div>
          <Button type="submit" class="btn btn-primary">
            <i class="fas fa-plus mr-2"></i>Ajouter Membre
          </Button>
        </div>
      </form>

      <!-- Liste des Membres -->
      <div class="members-table card shadow-sm">
        <div class="card-body p-0">
          <table class="table mb-0">
            <thead class="thead-light">
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Email</th>
                <th scope="col">Rôle</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in communityMembers" :key="member.id">
                <td>{{ member.displayName || 'Inconnu' }}</td>
                <td>{{ member.email || 'Inconnu' }}</td>
                <td>
                  <span :class="badgeClasses[member.role] || badgeClasses.default">
                    {{ capitalize(member.role) }}
                  </span>
                </td>
                <td>
                  <Button
                    class="btn btn-danger btn-sm"
                    @click="removeMember(member.id)"
                    :disabled="member.id === localCurrentUser?.uid"
                    title="Supprimer le membre"
                  >
                    <i class="fas fa-trash-alt"></i>
                  </Button>
                </td>
              </tr>
              <tr v-if="communityMembers.length === 0">
                <td colspan="4" class="text-center">Aucun membre trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <div v-for="(toast, index) in toasts" :key="index" :class="['toast', toast.severity]">
        <strong>{{ toast.summary }}</strong>
        <p>{{ toast.detail }}</p>
        <Button @click="removeToast(index)">✖</Button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import Navbar from '@/components/Utils/Navbar.vue';
import { db, auth } from "../../../firebase.js";
import { ref as dbRef, get, update } from "firebase/database";
import { useRoute } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "ManageOneCommunity",
  components: {
    Navbar
  },
  setup() {
    const route = useRoute();

    // Références réactives
    const community = ref({});
    const allUsers = ref([]);
    const filteredUsers = ref([]);
    const searchQuery = ref("");
    const selectedUserId = ref("");
    const selectedUserRole = ref("");
    const toasts = ref([]);
    const localCurrentUser = ref(null);
    const creatorName = ref("");
    const editType = ref(false);
    const newCommunityType = ref("");
    const editName = ref(false);
    const newCommunityName = ref("");
    const editDescription = ref(false);
    const newCommunityDescription = ref("");

    // Fonction pour déterminer si l'utilisateur est un manager
    const isManager = computed(() => {
      if (!community.value.members || !localCurrentUser.value) return false;
      const member = community.value.members[localCurrentUser.value.uid];
      return member && member.role === 'manager';
    });

    // Fonctions pour gérer les toasts
    const addToast = (severity, summary, detail) => {
      const toast = { severity, summary, detail };
      toasts.value.push(toast);
      // Supprimer le toast après 3 secondes
      setTimeout(() => {
        const index = toasts.value.indexOf(toast);
        if (index !== -1) {
          removeToast(index);
        }
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

    // Fonction pour définir la classe des badges en fonction du rôle
    const badgeClasses = {
      manager: 'badge badge-primary',
      member: 'badge badge-secondary',
      default: 'badge badge-light'
    };

    // Fonction pour récupérer l'utilisateur actuel avec un listener
    const fetchCurrentUser = () => {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            localCurrentUser.value = user;
          } else {
            // Gérer l'utilisateur non authentifié
            addToast('error', 'Erreur', 'Utilisateur non authentifié.');
          }
          resolve();
        });
      });
    };

    // Fonction pour récupérer les détails de la communauté
    const fetchCommunity = async () => {
      const communityId = route.params.id;
      try {
        const communitySnapshot = await get(dbRef(db, `Communities/${communityId}`));
        if (communitySnapshot.exists()) {
          community.value = { id: communityId, ...communitySnapshot.val() };
          // Récupérer le nom du créateur
          const creatorId = community.value.createdBy;
          const creatorSnapshot = await get(dbRef(db, `Users/${creatorId}`));
          if (creatorSnapshot.exists()) {
            const creatorData = creatorSnapshot.val();
            if (creatorData.displayName) {
              creatorName.value = creatorData.displayName;
            } else if (creatorData.email) {
              creatorName.value = creatorData.email.split("@")[0];
            } else {
              creatorName.value = "Inconnu";
            }
          } else {
            creatorName.value = "Inconnu";
          }
        } else {
          addToast('error', 'Erreur', 'Communauté non trouvée.');
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de récupérer la communauté.');
      }
    };

    // Fonction pour récupérer tous les utilisateurs
    const fetchAllUsers = async () => {
      try {
        const usersSnapshot = await get(dbRef(db, "Users"));
        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val();
          allUsers.value = Object.entries(usersData).map(([key, user]) => ({
            id: key,
            displayName: user.displayName || user.UserName || "",
            email: user.email || user.Mail || ""
          }));
          filteredUsers.value = allUsers.value;
        } else {
          allUsers.value = [];
          filteredUsers.value = [];
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
        addToast('error', 'Erreur', 'Impossible de récupérer les utilisateurs.');
      }
    };

    // Computed: Membres de la communauté avec détails
    const communityMembers = computed(() => {
      if (!community.value.members) return [];
      return Object.entries(community.value.members).map(([userId, memberData]) => {
        const user = allUsers.value.find(u => u.id === userId);
        return user
          ? { ...user, role: memberData.role }
          : { id: userId, displayName: "Unknown", email: "Unknown", role: memberData.role };
      });
    });

    // Fonction pour filtrer les utilisateurs basés sur la recherche
    const filterUsers = () => {
      const queryStr = searchQuery.value ? searchQuery.value.toLowerCase() : "";
      if (!queryStr) {
        filteredUsers.value = allUsers.value;
        return;
      }
      filteredUsers.value = allUsers.value.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(queryStr)) ||
        (user.email && user.email.toLowerCase().includes(queryStr))
      );
    };

    // Fonction pour ajouter un membre
    const addMember = async () => {
      if (!selectedUserId.value || !selectedUserRole.value) {
        addToast('error', 'Erreur', 'Veuillez sélectionner un utilisateur et un rôle.');
        return;
      }

      // Vérifier si l'utilisateur est déjà membre
      if (community.value.members && community.value.members[selectedUserId.value]) {
        addToast('warn', 'Attention', 'Cet utilisateur est déjà membre de la communauté.');
        return;
      }

      // Si le rôle est 'manager', vérifier qu'il n'y en a pas déjà un
      if (selectedUserRole.value === 'manager') {
        const currentManagers = communityMembers.value.filter(member => member.role === 'manager');
        if (currentManagers.length >= 1) {
          addToast('error', 'Erreur', 'Il y a déjà un manager dans cette communauté.');
          return;
        }
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/members/${selectedUserId.value}`] = { role: selectedUserRole.value };
        updates[`Users/${selectedUserId.value}/communities/${community.value.id}`] = true;

        // Mettre à jour les deux tables de manière atomique
        await update(dbRef(db), updates);

        addToast('success', 'Succès', 'Membre ajouté avec succès.');
        // Réinitialiser les champs
        searchQuery.value = "";
        selectedUserId.value = "";
        selectedUserRole.value = "";
        // Rafraîchir les données
        await fetchCommunity();
        await fetchAllUsers();
      } catch (error) {
        console.error("Erreur lors de l'ajout du membre :", error);
        addToast('error', 'Erreur', 'Impossible d\'ajouter le membre.');
      }
    };

    // Fonction pour supprimer un membre
    const removeMember = async (memberId) => {
      if (!memberId) {
        addToast('error', 'Erreur', 'Aucun membre sélectionné.');
        return;
      }

      // Empêcher de supprimer soi-même (le manager)
      if (memberId === localCurrentUser.value?.uid) {
        addToast('error', 'Erreur', 'Vous ne pouvez pas vous supprimer vous-même.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/members/${memberId}`] = null;
        updates[`Users/${memberId}/communities/${community.value.id}`] = null;

        // Supprimer les deux entrées de manière atomique
        await update(dbRef(db), updates);

        addToast('success', 'Succès', 'Membre supprimé avec succès.');
        await fetchCommunity();
        await fetchAllUsers();
      } catch (error) {
        console.error("Erreur lors de la suppression du membre :", error);
        addToast('error', 'Erreur', 'Impossible de supprimer le membre.');
      }
    };

    // Fonction pour basculer l'affichage du formulaire de modification du type de la communauté
    const toggleEditType = () => {
      editType.value = !editType.value;
      if (!editType.value) {
        newCommunityType.value = "";
      } else {
        newCommunityType.value = community.value.type;
      }
    };

    // Fonction pour basculer l'affichage du formulaire de modification du nom de la communauté
    const toggleEditName = () => {
      editName.value = !editName.value;
      if (!editName.value) {
        newCommunityName.value = "";
      } else {
        newCommunityName.value = community.value.name;
      }
    };

    // Fonction pour basculer l'affichage du formulaire de modification de la description de la communauté
    const toggleEditDescription = () => {
      editDescription.value = !editDescription.value;
      if (!editDescription.value) {
        newCommunityDescription.value = "";
      } else {
        newCommunityDescription.value = community.value.description;
      }
    };

    // Fonction pour mettre à jour le type de la communauté
    const updateCommunityType = async () => {
      if (!newCommunityType.value) {
        addToast('error', 'Erreur', 'Veuillez sélectionner un type de communauté.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/type`] = newCommunityType.value;

        await update(dbRef(db), updates);
        addToast('success', 'Succès', 'Type de communauté mis à jour avec succès.');
        editType.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du type de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de mettre à jour le type de la communauté.');
      }
    };

    // Fonction pour mettre à jour le nom de la communauté
    const updateCommunityName = async () => {
      if (!newCommunityName.value.trim()) {
        addToast('error', 'Erreur', 'Le nom de la communauté ne peut pas être vide.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/name`] = newCommunityName.value.trim();

        await update(dbRef(db), updates);
        addToast('success', 'Succès', 'Nom de la communauté mis à jour avec succès.');
        editName.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du nom de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de mettre à jour le nom de la communauté.');
      }
    };

    // Fonction pour mettre à jour la description de la communauté
    const updateCommunityDescription = async () => {
      if (!newCommunityDescription.value.trim()) {
        addToast('error', 'Erreur', 'La description de la communauté ne peut pas être vide.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/description`] = newCommunityDescription.value.trim();

        await update(dbRef(db), updates);
        addToast('success', 'Succès', 'Description de la communauté mise à jour avec succès.');
        editDescription.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la description de la communauté :", error);
        addToast('error', 'Erreur', 'Impossible de mettre à jour la description de la communauté.');
      }
    };

    onMounted(async () => {
      await fetchCurrentUser();
      await fetchCommunity();
      await fetchAllUsers();
    });

    return {
      community,
      capitalize,
      allUsers,
      filteredUsers,
      searchQuery,
      selectedUserId,
      selectedUserRole,
      filterUsers,
      addMember,
      removeMember,
      communityMembers,
      toasts,
      removeToast,
      creatorName,
      localCurrentUser,
      isManager,
      editType,
      toggleEditType,
      newCommunityType,
      updateCommunityType,
      editName,
      toggleEditName,
      newCommunityName,
      updateCommunityName,
      editDescription,
      toggleEditDescription,
      newCommunityDescription,
      updateCommunityDescription,
      badgeClasses // Utilisation de l'objet de mapping
    };
  }
};
</script>

<style scoped>
.manage-community {
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  color: #333333; /* Texte sombre pour une meilleure lisibilité */
}

/* Sections principales */
.community-details-section,
.members-management-section {
  margin-bottom: 2rem;
}

/* Card pour les détails de la communauté */
.community-details {

  padding: 1.5rem;

  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Ombre légère pour la profondeur */
}

/* Boutons pour modifier le nom, la description et le type */
.edit-community-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Formulaire de modification du type */
.edit-community-type-form,
.edit-community-name-form,
.edit-community-description-form {
  margin-top: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
}

/* Formulaire d'ajout de membre */
.add-member-form {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  display: block;
}

.form-group input,
.form-group textarea,
.form-group select {
  padding: 0.75rem;
  font-size: 1rem;
  width: 100%;
}

/* Styles des boutons */
.btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  transition: background-color 0.3s ease;
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

/* Table des membres */
.members-table {
  width: 100%;
  border-collapse: collapse;
}

.members-table th,
.members-table td {
  border: 1px solid #dddddd;
  padding: 1rem;
  text-align: left;
}

.members-table th {
  background-color: #f1f1f1;
  color: #333333;
}

.members-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.members-table tr:hover {
  background-color: #f1f1f1;
}

/* Badges pour les rôles */
.badge {
  padding: 0.4rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
}

.badge-primary {
  background-color: #007bff;
  color: #ffffff;
}

.badge-secondary {
  background-color: #6c757d;
  color: #ffffff;
}

.badge-light {
  background-color: #f8f9fa;
  color: #333333;
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
  .manage-community {
    padding: 1rem;
  }

  .form-row {
    flex-direction: column;
  }

  .form-group.col-md-3,
  .form-group.col-md-6 {
    width: 100%;
  }
}
</style>
