<!-- src/components/CreateNewCommunity.vue -->
<template>
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
  </template>
  
  <script>
  import { ref } from "vue";
  import { db, auth } from "@/firebase.js";
  import { ref as dbRef, push, set } from "firebase/database";
  
  export default {
    name: "CreateNewCommunity",
    emits: ["communityCreated"],
    setup(props, { emit }) {
      const newCommunity = ref({
        name: "",
        description: "",
        type: ""
      });
  
      const toasts = ref([]);
  
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
  
      const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
  
      const createCommunity = async () => {
        if (!newCommunity.value.name || !newCommunity.value.description || !newCommunity.value.type) {
          addToast('error', 'Erreur', 'Veuillez remplir tous les champs.');
          return;
        }
  
        try {
          const currentUser = auth.currentUser;
          if (!currentUser) {
            addToast('error', 'Erreur', 'Utilisateur non authentifié.');
            return;
          }
  
          const communityRef = push(dbRef(db, "Communities"));
          await set(communityRef, {
            name: newCommunity.value.name,
            description: newCommunity.value.description,
            type: newCommunity.value.type,
            createdBy: currentUser.uid,
            members: {
              [currentUser.uid]: { role: 'manager' }
            }
          });
          addToast('success', 'Succès', 'Communauté créée avec succès.');
          emit('communityCreated'); // Émettre l'événement au parent
          // Réinitialiser le formulaire
          newCommunity.value.name = "";
          newCommunity.value.description = "";
          newCommunity.value.type = "";
        } catch (error) {
          console.error("Erreur lors de la création de la communauté :", error);
          addToast('error', 'Erreur', 'Impossible de créer la communauté.');
        }
      };
  
      return {
        newCommunity,
        createCommunity,
        addToast,
        removeToast,
        toasts,
        capitalize
      };
    }
  };
  </script>
  
  <style scoped>
  .create-community-section {
    margin-bottom: 2rem;
  }
  
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
    .create-community-section {
      margin-bottom: 1rem;
    }
  
    .create-community-form .form-control {
      font-size: 0.9rem;
      padding: 0.5rem;
    }
  
    .btn-block {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
    }
  
    .toast {
      min-width: 200px;
      padding: 0.75rem;
    }
  }
  </style>
  