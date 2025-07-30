<!-- src/components/CreateNewCommunity.vue -->
<template>
  <div class="create-community-section card">
    <div>
      <h2>Créer une Nouvelle Communauté</h2>
    </div>
    <div class="">
      <form @submit.prevent="createCommunity">
        <div class="container">
          <label for="communityName" class="text-white">Nom de la Communauté</label>
          <InputText type="text" id="communityName" v-model="newCommunity.name" required
                     placeholder="Entrez le nom de la communauté" class="w-full mt-2" />
        </div>
        <br>
        <div class="form-group">
          <label class="text-white" for="communityDescription">Description</label>
          <Textarea id="communityDescription" v-model="newCommunity.description" rows="3" required
                    placeholder="Entrez la description de la communauté" class="w-full mt-2"></Textarea>
        </div>
        <br>
        <div class="form-group">
          <label class="text-white" for="communityType">Type de Communauté</label>
          <Dropdown id="communityType" optionLabel="name" :options="types" optionValue="code"
                    placeholder="Sélectionnez le type" v-model="newCommunity.type" required class="w-full mb-4 mt-2">
            <option value="" disabled></option>
          </Dropdown>
        </div>
        <Button type="submit" class="btn btn-primary text-center align-items-center">Créer</Button>
      </form>
    </div>
  </div>
</template>


<script>
import { ref } from "vue";
import { db, auth } from "../../../../firebase.js";
import { ref as dbRef, update, set } from "firebase/database";
import InputText from 'primevue/inputtext';


export default {
  components: {
    InputText
  },
  data() {
    return {
      types: [
        { code: "public", name: "Public" },
        { code: "ferme", name: "Fermé" },
        { code: "cache", name: "Caché" }
      ]
    };
  },
  name: "CreateNewCommunity",
  emits: ["communityCreated", "showToast"], // Ajout de l'émission de 'showToast'
  setup(props, { emit }) {
    const newCommunity = ref({
      name: "",
      description: "",
      type: ""
    });

    const capitalize = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Fonction utilitaire pour générer un identifiant aléatoire de 15 caractères
    const generateId = (length = 15) => {
      const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    const createCommunity = async () => {
      if (
        !newCommunity.value.name ||
        !newCommunity.value.description ||
        !newCommunity.value.type
      ) {
        emit('showToast', {
          severity: 'error',
          summary: 'Erreur',
          detail: 'Veuillez remplir tous les champs.'
        });
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          emit('showToast', {
            severity: 'error',
            summary: 'Erreur',
            detail: 'Utilisateur non authentifié.'
          });
          return;
        }

        // Générer un identifiant personnalisé de 15 caractères
        const communityId = generateId(15);
        // Créer une référence avec cet identifiant
        const communityRef = dbRef(db, "Communities/" + communityId);

        await set(communityRef, {
          name: newCommunity.value.name,
          description: newCommunity.value.description,
          type: newCommunity.value.type,
          createdBy: currentUser.uid,
          creatorName : currentUser.uid,
          createAd : "20-01-2025",
          members: {
            [currentUser.uid]: true,
          },
          managers: {
            [currentUser.uid]: true,
          }
        });


        const updates = {};
        updates[`Users/${currentUser.uid}/communities/${communityId}`] = true;

        // Mettre à jour les deux tables de manière atomique
        await update(dbRef(db), updates);

        emit('showToast', {
          severity: 'success',
          summary: 'Succès',
          detail: 'Communauté créée avec succès.'
        });
        emit('communityCreated'); // Émettre l'événement au parent

        // Réinitialiser le formulaire
        newCommunity.value.name = "";
        newCommunity.value.description = "";
        newCommunity.value.type = "";
      } catch (error) {
        console.error("Erreur lors de la création de la communauté :", error);
        emit('showToast', {
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de créer la communauté.'
        });
      }
    };


    return {
      newCommunity,
      createCommunity,
      capitalize
    };
  }
};
</script>

<style scoped></style>