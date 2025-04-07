<template>
  <div>
    <Navbar />

    <!-- Titre de la page -->
    <div class="page-title">
      <h1>Résultats Votation BA22 - PFP4</h1>
    </div>

    <div class="container">
      <!-- Tableau récapitulatif des votes -->
      <DataTable :value="votesArray" responsiveLayout="scroll" class="p-datatable-sm">
        <!-- Colonne Étudiant -->
        <Column header="Étudiant">
          <template #body="slotProps">
            <div>
              <div>{{ slotProps.data.studentPrenom }} {{ slotProps.data.studentName }}</div>
            </div>
          </template>
        </Column>

        <!-- Colonne Choix 1 -->
        <Column header="Choix 1">
          <template #body="slotProps">
            <div v-if="slotProps.data.votes && slotProps.data.votes[0]">
              {{ formatVote(slotProps.data.votes[0]) }}
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <!-- Colonne Choix 2 -->
        <Column header="Choix 2">
          <template #body="slotProps">
            <div v-if="slotProps.data.votes && slotProps.data.votes[1]">
              {{ formatVote(slotProps.data.votes[1]) }}
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <!-- Colonne Choix 3 -->
        <Column header="Choix 3">
          <template #body="slotProps">
            <div v-if="slotProps.data.votes && slotProps.data.votes[2]">
              {{ formatVote(slotProps.data.votes[2]) }}
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <!-- Colonne Choix 4 -->
        <Column header="Choix 4">
          <template #body="slotProps">
            <div v-if="slotProps.data.votes && slotProps.data.votes[3]">
              {{ formatVote(slotProps.data.votes[3]) }}
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <!-- Colonne Choix 5 -->
        <Column header="Choix 5">
          <template #body="slotProps">
            <div v-if="slotProps.data.votes && slotProps.data.votes[4]">
              {{ formatVote(slotProps.data.votes[4]) }}
            </div>
            <div v-else>-</div>
          </template>
        </Column>

        <!-- Colonne Date du vote -->
        <Column header="Date de Vote">
          <template #body="slotProps">
            <div>{{ formatDate(slotProps.data.timestamp) }}</div>
          </template>
        </Column>
      </DataTable>

      <!-- Section Statistiques -->
      <div class="stats">
        <h2>Statistiques</h2>
        <p><strong>Nombre d'étudiants ayant voté :</strong> {{ votesArray.length }}</p>
        <p><strong>Nombre total de places votées :</strong> {{ placesRanking.length }}</p>

        <h3>Classement des places</h3>
        <table class="ranking-table">
          <thead>
            <tr>
              <th>Place (Institution)</th>
              <th>Nombre de votes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in placesRanking" :key="index">
              <td>{{ item.place }}</td>
              <td>{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref, onValue } from "firebase/database";
import { db } from 'root/firebase';

export default {
  name: 'ResultPreviewVotation',
  components: {
    Navbar,
    DataTable,
    Column
  },
  data() {
    return {
      // Stocke les votes récupérés depuis Firebase
      votes: {},
      // Stocke les informations des utilisateurs récupérées depuis la table /Users
      users: {}
    }
  },
  computed: {
    // Transformation de l'objet votes en tableau, trié par date décroissante, et enrichi avec les infos de /Users
    votesArray() {
      const voteList = Object.values(this.votes).sort((a, b) => b.timestamp - a.timestamp);
      return voteList.map(vote => {
        if (this.users && this.users[vote.studentId]) {
          const userData = this.users[vote.studentId];
          vote.studentName = userData.Nom || vote.studentName;
          vote.studentPrenom = userData.Prenom || vote.studentPrenom;
        }
        return vote;
      });
    },
    // Nombre total d'étudiants depuis la table /Users
    totalStudents() {
      return Object.keys(this.users).length;
    },
    // Classement des places basé sur le nombre de votes pour chaque place
    placesRanking() {
      const counts = {};
      this.votesArray.forEach(vote => {
        if (vote.votes && Array.isArray(vote.votes)) {
          vote.votes.forEach(choice => {
            if (choice && choice.placeName) {
              const key = `${choice.InstitutionName} - ${choice.placeName}`;
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }
      });
      const rankingArray = Object.keys(counts).map(key => ({ place: key, count: counts[key] }));
      rankingArray.sort((a, b) => b.count - a.count);
      return rankingArray;
    }
  },
  methods: {
    // Récupère les votes depuis le noeud "VotationBA22PFP4"
    fetchVotes() {
      const votesRef = ref(db, 'VotationBA22PFP4');
      onValue(votesRef, (snapshot) => {
        this.votes = snapshot.val() || {};
      });
    },
    // Récupère les informations des utilisateurs depuis la table "/Users"
    fetchUsers() {
      const usersRef = ref(db, '/Users');
      onValue(usersRef, (snapshot) => {
        this.users = snapshot.val() || {};
      });
    },
    // Formate un vote pour afficher "Nom de la place (Nom de l'institution)"
    formatVote(vote) {
      return `${vote.placeName} (${vote.InstitutionName})`;
    },
    // Convertit un timestamp en date lisible
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    }
  },
  mounted() {
    this.fetchVotes();
    this.fetchUsers();
  }
}
</script>

<style scoped>
.page-title {
  text-align: center;
  margin: 20px 0;
}

.container {
  padding: 20px;
}

.p-datatable-sm {
  margin-top: 20px;
}

.stats {
  margin-top: 40px;
  padding: 20px;
}

.stats h2, .stats h3 {
  margin-bottom: 10px;
}

.ranking-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.ranking-table th,
.ranking-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

.ranking-table th {
  text-align: left;
}
</style>
