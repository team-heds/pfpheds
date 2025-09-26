<template>
  <div>
    <Navbar />
    <div class="container mt-4">
      <h2 class="text-center mb-4">Gestion des votes - Votation Lese BA22 PFP4</h2>
      <div v-if="votes.length">
        <table class="table table-striped text-center">
          <thead>
            <tr>
              <th>ID Étudiant</th>
              <th>Nom, Prénom</th>
              <th>Institution</th>
              <th>Place ID</th>
              <th>Place Name</th>
              <th>Date du vote</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vote, index) in votes" :key="index">
              <td>{{ vote.studentId }}</td>
              <td>{{ getUserFullName(vote.studentId) }}</td>
              <td>{{ vote.InstitutionName }}</td>
              <td>{{ vote.placeId }}</td>
              <td>{{ vote.placeName }}</td>
              <td>{{ formatTimestamp(vote.timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="text-center">
        <p>Aucun vote enregistré.</p>
      </div>
      <div class="text-center mt-4">
        <button class="btn btn-primary" @click="validateVotes">Valider votation lese</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onValue, get, update, set } from "firebase/database";
import { db } from "../../../../firebase.js";
import Navbar from "@/components/common/utils/Navbar.vue";

export default {
  name: "ManagementVotationLese",
  components: { Navbar },
  data() {
    return {
      votes: [],
      users: {} // Cache pour stocker les données utilisateur
    };
  },
  methods: {
    // Récupère les votes depuis le noeud VotationLeseBA22PFP4
    fetchVotes() {
      const votesRef = ref(db, "VotationLeseBA24PFP2");
      onValue(votesRef, (snapshot) => {
        const votesData = snapshot.val();
        if (votesData) {
          // Transformation de l'objet en tableau
          this.votes = Object.keys(votesData).map(key => votesData[key]);
          // Charger les données utilisateur pour chaque vote
          this.fetchUsersData();
        } else {
          this.votes = [];
        }
      });
    },
    // Récupère les données utilisateur depuis la table Users
    async fetchUsersData() {
      const usersRef = ref(db, "Users");
      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          this.users = snapshot.val();
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error);
      }
    },
    // Retourne le nom complet de l'utilisateur
    getUserFullName(studentId) {
      if (!studentId || !this.users[studentId]) {
        return "Utilisateur inconnu";
      }
      const user = this.users[studentId];
      const nom = user.Nom || "";
      const prenom = user.Prenom || "";
      return `${nom} ${prenom}`.trim() || "Nom non renseigné";
    },
    // Convertit un timestamp en date lisible
    formatTimestamp(timestamp) {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      return date.toLocaleString();
    },
    // Pour chaque vote, met à jour la place correspondante dans "Places"
    async validateVotes() {
      for (const vote of this.votes) {
        const placeKey = vote.placeId; // On suppose que vote.placeId correspond à la clé dans "Places"
        if (!placeKey) continue;
        const placeRef = ref(db, "Places/" + placeKey);
        try {
          const snapshot = await get(placeRef);
          if (snapshot.exists()) {
            const placeData = snapshot.val();
            let updateData = {};
            // Si le champ "selectedEtudiantBA22PFP4-1" est vide, on y inscrit l'ID de l'étudiant
            if (!placeData["selectedEtudiantBA22PFP4-1"] || placeData["selectedEtudiantBA22PFP4-1"] === "") {
              updateData["selectedEtudiantBA22PFP4-1"] = vote.studentId;
            }
            // Sinon, si le champ "selectedEtudiantBA22PFP4-1" est renseigné et "selectedEtudiantBA22PFP4-2" est vide, on y inscrit l'ID
            else if (!placeData["selectedEtudiantBA22PFP4-2"] || placeData["selectedEtudiantBA22PFP4-2"] === "") {
              updateData["selectedEtudiantBA22PFP4-2"] = vote.studentId;
            }
            if (Object.keys(updateData).length > 0) {
              await update(placeRef, updateData);
            }
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la place", placeKey, error);
        }
      }
      // Après avoir mis à jour les places, retire le rôle "lese" de chaque utilisateur étudiant
      await this.removeLeseRole();
      // Redirection vers la page /management_offre
      this.$router.push("/management_offre");
    },
    // Parcourt la table "Users" et supprime le rôle "lese" pour chaque utilisateur
    async removeLeseRole() {
      const usersRef = ref(db, "Users");
      try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          for (const userId in usersData) {
            const user = usersData[userId];
            if (user.Roles && user.Roles.lese) {
              // Pour supprimer un champ dans Firebase Realtime Database, on peut utiliser set avec null
              const roleRef = ref(db, `Users/${userId}/Roles/lese`);
              await set(roleRef, null);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du rôle 'lese' dans Users", error);
      }
    }
  },
  mounted() {
    this.fetchVotes();
  }
};
</script>

<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.container {
  max-width: 1200px;
}
.table {
  margin: 0 auto;
  width: 90%;
}
</style>
