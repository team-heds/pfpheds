<!-- src/views/apps/community/ManageOneCommunity.vue -->
<template class="container">
  <div class="manage-community p-p-4">
    <!-- Navbar -->
    <Navbar />

    <!-- Section des Détails de la Communauté -->
    <div v-if="community && localCurrentUser" class="community-details-section p-mt-4">
      <Card class="card">
        <template #title>
          <h2>Détails de la Communauté</h2>
        </template>
        <template #content>
          <div class="p-d-flex p-flex-column p-gap-2">
            <h3>{{ community.name }}</h3>
            <p><strong>Description:</strong> {{ community.description }}</p>
            <p><strong>Type:</strong> {{ capitalize(community.type) }}</p>
            <p><strong>Créée par:</strong> {{ creatorName }}</p>
          </div>
        </template>
      </Card>

      <br>

      <!-- Boutons pour Modifier le Nom, la Description et le Type (Visible uniquement pour les Managers) -->
      <div v-if="isManager" class="edit-community-buttons p-mt-3 p-d-flex p-gap-2 mb-2">
        <Button
          label="Modifier le Nom"
          icon="pi pi-pencil"
          class="p-button-primary m-2"
          @click="toggleEditName"
        />
        <Button
          label="Modifier la Description"
          icon="pi pi-pencil"
          class="p-button-primary m-2"
          @click="toggleEditDescription"
        />
        <Button
          label="Modifier le Type"
          icon="pi pi-pencil"
          class="p-button-primary m-2"
          @click="toggleEditType"
        />
      </div>

      <!-- Formulaire pour Modifier le Nom de la Communauté -->
      <Dialog header="Modifier le Nom" v-model:visible="editName" modal>
        <form @submit.prevent="updateCommunityName" class="p-fluid">
          <div class="p-field">
            <label for="newCommunityName">Nouveau Nom de Communauté</label>
            <InputText id="newCommunityName" v-model="newCommunityName" required />
          </div>
          <div class="p-d-flex p-jc-end p-gap-2 mt-2">
            <Button label="Mettre à Jour" type="submit" class="p-button-primary w-4 m-2" />
            <Button label="Annuler" type="button" class="p-button-secondary w-4 m-2" @click="toggleEditName" />
          </div>
        </form>
      </Dialog>

      <!-- Formulaire pour Modifier la Description de la Communauté -->
      <Dialog header="Modifier la Description" v-model:visible="editDescription" modal>
        <form @submit.prevent="updateCommunityDescription" class="p-fluid">
          <div class="p-field">
            <label for="newCommunityDescription">Nouvelle Description de Communauté</label>
            <InputText
              id="newCommunityDescription"
              v-model="newCommunityDescription"
              rows="5"
              required
            />
          </div>
          <div class="p-d-flex p-jc-end p-gap-2 mt-2">
            <Button label="Mettre à Jour" type="submit" class="p-button-primary w-4 m-2" />
            <Button label="Annuler" type="button" class="p-button-secondary w-4 m-2" @click="toggleEditDescription" />
          </div>
        </form>
      </Dialog>

      <!-- Formulaire pour Modifier le Type de la Communauté -->
      <Dialog header="Modifier le Type" v-model:visible="editType" modal class="w-3">
        <form @submit.prevent="updateCommunityType" class="p-fluid">
          <div class="p-field">
            <label for="newCommunityType">Nouveau Type de Communauté</label>
            <Dropdown
              id="newCommunityType"
              v-model="newCommunityType"
              :options="communityTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="-- Sélectionnez le type --"
              required
            />
          </div>
          <div class="p-d-flex p-jc-end p-gap-2 mt-2">
            <Button label="Mettre à Jour" type="submit" class="p-button-primary w-4 m-2" />
            <Button label="Annuler" type="button" class="p-button-secondary w-4 m-2" @click="toggleEditType" />
          </div>
        </form>
      </Dialog>
    </div>

    <!-- Section de Gestion des Membres -->
    <div v-if="community && localCurrentUser" class="members-management-section p-mt-4">
      <Card class="card">
        <template #title>
          <h2>Membres de la Communauté</h2>
        </template>
        <template #content>
          <!-- Formulaire pour Ajouter un Membre -->
          <Card class="p-p-3 p-mb-4 card">
            <template #title>
              <h3>Ajouter Utilisateur</h3>
            </template>
            <form @submit.prevent="addMember" class="p-fluid">
              <div class="p-d-flex p-flex-column p-gap-3">
                <div class="p-field p-grid">
                  <label for="selectedUser" class="p-col-12 p-md-2">Utilisateur</label>
                  <div class="p-col-12 p-md-10">
                    <Dropdown
                      id="selectedUser"
                      v-model="selectedUserId"
                      :options="filteredUsers"
                      optionLabel="displayName"
                      optionValue="id"
                      placeholder="-- Sélectionnez --"
                      filter
                      filterBy="displayName,email"
                      required
                    />
                  </div>
                </div>
                <div class="p-field p-grid">
                  <label for="userRole" class="p-col-12 p-md-2">Rôle</label>
                  <div class="p-col-12 p-md-10">
                    <Dropdown
                      id="userRole"
                      v-model="selectedUserRole"
                      :options="roleOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="-- Sélectionnez --"
                      required
                      class="card"
                    />
                  </div>
                </div>
                <Button label="Ajouter Membre" type="submit" icon="pi pi-plus" class="p-button-primary" />
              </div>
            </form>
          </Card>

          <!-- Liste des Membres -->
          <DataTable
            :value="communityMembers"
            class="p-datatable-striped p-datatable-responsive card"
            :emptyMessage="'Aucun membre trouvé.'"
          >
            <Column field="displayName" header="Nom" sortable></Column>
            <Column field="email" header="Email" sortable></Column>
            <Column field="role" header="Rôle">
              <template #body="slotProps">
                <Tag :value="capitalize(slotProps.data.role)" :severity="roleSeverity(slotProps.data.role)" />
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  class="p-button-danger p-button-sm"
                  @click="removeMember(slotProps.data.id)"
                  :disabled="slotProps.data.id === localCurrentUser?.uid"
                  tooltip="Supprimer le membre"
                  tooltipOptions="{position: 'top'}"
                />
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>

    <!-- Toast Notifications -->
    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import Navbar from '@/components/Utils/Navbar.vue';
import { db, auth } from "../../../firebase.js";
import { ref as dbRef, get, update } from "firebase/database";
import { useRoute } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import Toast from "primevue/toast";
import Card from "primevue/card";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Dropdown from "primevue/dropdown";
import InputText from "primevue/inputtext";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";

export default {
  name: "ManageOneCommunity",
  components: {
    Toast,
    Navbar,
    Card,
    Dropdown,
    InputText,
    DataTable,
    Column,
    Tag
  },
  setup() {
    const route = useRoute();
    const toast = ref(null); // Référence pour le Toast

    // Références réactives
    const community = ref({});
    const allUsers = ref([]);
    const filteredUsers = ref([]);
    const selectedUserId = ref("");
    const selectedUserRole = ref("");
    const localCurrentUser = ref(null);
    const creatorName = ref("");
    const editType = ref(false);
    const newCommunityType = ref("");
    const editName = ref(false);
    const newCommunityName = ref("");
    const editDescription = ref(false);
    const newCommunityDescription = ref("");

    // Options pour le type de communauté
    const communityTypeOptions = [
      { label: "Public", value: "public" },
      { label: "Fermé", value: "closed" },
      { label: "Caché", value: "hidden" }
    ];

    // Options pour les rôles des membres
    const roleOptions = [
      { label: "Manager", value: "manager" },
      { label: "Membre", value: "member" }
    ];

    // Fonction pour déterminer si l'utilisateur est un manager
    const isManager = computed(() => {
      if (!community.value.members || !localCurrentUser.value) return false;
      const member = community.value.members[localCurrentUser.value.uid];
      return member && member.role === 'manager';
    });

    // Fonction pour capitaliser la première lettre
    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Fonction pour définir la sévérité des tags en fonction du rôle
    const roleSeverity = (role) => {
      switch(role) {
        case 'manager':
          return 'primary';
        case 'member':
          return 'secondary';
        default:
          return 'info';
      }
    };

    // Fonction pour récupérer l'utilisateur actuel avec un listener
    const fetchCurrentUser = () => {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            localCurrentUser.value = user;
          } else {
            // Gérer l'utilisateur non authentifié
            showToast('error', 'Erreur', 'Utilisateur non authentifié.');
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
          showToast('error', 'Erreur', 'Communauté non trouvée.');
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de la communauté :", error);
        showToast('error', 'Erreur', 'Impossible de récupérer la communauté.');
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
        showToast('error', 'Erreur', 'Impossible de récupérer les utilisateurs.');
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

    // Fonction pour ajouter un membre
    const addMember = async () => {
      if (!selectedUserId.value || !selectedUserRole.value) {
        showToast('error', 'Erreur', 'Veuillez sélectionner un utilisateur et un rôle.');
        return;
      }

      // Vérifier si l'utilisateur est déjà membre
      if (community.value.members && community.value.members[selectedUserId.value]) {
        showToast('warn', 'Attention', 'Cet utilisateur est déjà membre de la communauté.');
        return;
      }

      // Si le rôle est 'manager', vérifier qu'il n'y en a pas déjà un
      if (selectedUserRole.value === 'manager') {
        const currentManagers = communityMembers.value.filter(member => member.role === 'manager');
        if (currentManagers.length >= 1) {
          showToast('error', 'Erreur', 'Il y a déjà un manager dans cette communauté.');
          return;
        }
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/members/${selectedUserId.value}`] = { role: selectedUserRole.value };
        updates[`Users/${selectedUserId.value}/communities/${community.value.id}`] = true;

        // Mettre à jour les deux tables de manière atomique
        await update(dbRef(db), updates);

        showToast('success', 'Succès', 'Membre ajouté avec succès.');
        // Réinitialiser les champs
        selectedUserId.value = "";
        selectedUserRole.value = "";
        // Rafraîchir les données
        await fetchCommunity();
        await fetchAllUsers();
      } catch (error) {
        console.error("Erreur lors de l'ajout du membre :", error);
        showToast('error', 'Erreur', 'Impossible d\'ajouter le membre.');
      }
    };

    // Fonction pour supprimer un membre
    const removeMember = async (memberId) => {
      if (!memberId) {
        showToast('error', 'Erreur', 'Aucun membre sélectionné.');
        return;
      }

      // Empêcher de supprimer soi-même (le manager)
      if (memberId === localCurrentUser.value?.uid) {
        showToast('error', 'Erreur', 'Vous ne pouvez pas vous supprimer vous-même.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/members/${memberId}`] = null;
        updates[`Users/${memberId}/communities/${community.value.id}`] = null;

        // Supprimer les deux entrées de manière atomique
        await update(dbRef(db), updates);

        showToast('success', 'Succès', 'Membre supprimé avec succès.');
        await fetchCommunity();
        await fetchAllUsers();
      } catch (error) {
        console.error("Erreur lors de la suppression du membre :", error);
        showToast('error', 'Erreur', 'Impossible de supprimer le membre.');
      }
    };

    // Fonctions pour basculer l'affichage des formulaires d'édition
    const toggleEditType = () => {
      editType.value = !editType.value;
      if (!editType.value) {
        newCommunityType.value = "";
      } else {
        newCommunityType.value = community.value.type;
      }
    };

    const toggleEditName = () => {
      editName.value = !editName.value;
      if (!editName.value) {
        newCommunityName.value = "";
      } else {
        newCommunityName.value = community.value.name;
      }
    };

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
        showToast('error', 'Erreur', 'Veuillez sélectionner un type de communauté.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/type`] = newCommunityType.value;

        await update(dbRef(db), updates);
        showToast('success', 'Succès', 'Type de communauté mis à jour avec succès.');
        editType.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du type de la communauté :", error);
        showToast('error', 'Erreur', 'Impossible de mettre à jour le type de la communauté.');
      }
    };

    // Fonction pour mettre à jour le nom de la communauté
    const updateCommunityName = async () => {
      if (!newCommunityName.value.trim()) {
        showToast('error', 'Erreur', 'Le nom de la communauté ne peut pas être vide.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/name`] = newCommunityName.value.trim();

        await update(dbRef(db), updates);
        showToast('success', 'Succès', 'Nom de la communauté mis à jour avec succès.');
        editName.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour du nom de la communauté :", error);
        showToast('error', 'Erreur', 'Impossible de mettre à jour le nom de la communauté.');
      }
    };

    // Fonction pour mettre à jour la description de la communauté
    const updateCommunityDescription = async () => {
      if (!newCommunityDescription.value.trim()) {
        showToast('error', 'Erreur', 'La description de la communauté ne peut pas être vide.');
        return;
      }

      try {
        const updates = {};
        updates[`Communities/${community.value.id}/description`] = newCommunityDescription.value.trim();

        await update(dbRef(db), updates);
        showToast('success', 'Succès', 'Description de la communauté mise à jour avec succès.');
        editDescription.value = false;
        await fetchCommunity();
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la description de la communauté :", error);
        showToast('error', 'Erreur', 'Impossible de mettre à jour la description de la communauté.');
      }
    };

    // Fonction pour afficher les toasts
    const showToast = (severity, summary, detail) => {
      if (toast.value) {
        toast.value.add({ severity, summary, detail });
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
      selectedUserId,
      selectedUserRole,
      addMember,
      removeMember,
      communityMembers,
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
      communityTypeOptions,
      roleOptions,
      roleSeverity,
      showToast
    };
  }
};
</script>

<style scoped>
.manage-community {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333333; /* Texte sombre pour une meilleure lisibilité */
}

/* Ajustements mineurs si nécessaire */
</style>
