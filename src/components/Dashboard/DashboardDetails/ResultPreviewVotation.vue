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
      </div>
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/Utils/Navbar.vue';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import { ref, onValue } from "firebase/database";
  import { db } from '@/firebase';
  
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
  </style>
  