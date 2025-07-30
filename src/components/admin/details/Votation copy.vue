<template>
  <Navbar />
  <div class="container">
    <div class="text-center mb-4">
      <p v-if="studentData" class="fst-italic">Nom de l'étudiant: {{ studentData.Nom + " " + studentData.Prenom }}</p>
    </div>
    <div v-if="studentData" class="mb-3">
      <div>
        <div>
          <div>
            <h3 class="mb-0">Informations de l'étudiant</h3>
          </div>
          <div class="">
            <div class="row g-3">
              <div class="col-md-4">
                <div class="p-3">
                  <p class="mb-2 fw-bold">Nom: <span class="text-secondary">{{ studentData.Nom }}</span></p>
                  <p class="mb-2 fw-bold">Prénom: <span class="text-secondary">{{ studentData.Prenom }}</span></p>
                  <p class="mb-2 fw-bold">AIGU: <span class="text-secondary">{{ studentData.AIGU }}</span></p>
                  <p class="mb-2 fw-bold">CABINET: <span class="text-secondary">{{ studentData.AMBU }}</span></p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <p class="mb-2 fw-bold">MSQ: <span class="text-secondary">{{ studentData.MSQ }}</span></p>
                  <p class="mb-2 fw-bold">NEURO-GER: <span class="text-secondary">{{ studentData.NEUROGER }}</span></p>
                  <p class="mb-2 fw-bold">Rehab: <span class="text-secondary">{{ studentData.REA }}</span></p>
                  <p class="mb-2 fw-bold">Sysint: <span class="text-secondary">{{ studentData.SYSINT }}</span></p>
                </div>
              </div>
              <div class="col-md-4">
                <div class="p-3">
                  <p class="mb-2 fw-bold">FR: <span class="text-secondary">{{ studentData.FR }}</span></p>
                  <p class="mb-2 fw-bold">All: <span class="text-secondary">{{ studentData.ALL }}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex flex-column md:flex-row md:align-items-start md:justify-content-between mb-3">
        <div class="text-900 text-xl font-semibold mb-3 md:mb-0">Liste des places de PFP</div>
      </div>
      <DataTable :value="stages" responsiveLayout="scroll" :class="{'table-secondary': stageHasUnmetCriteria(stage), 'table-danger': !stageHasUnmetCriteria(stage)}">
        <Column field="Name" header="Institution" />
        <Column field="Canton" header="Canton" />
        <Column field="Lieu" header="Lieu" />
        <Column field="NomPlace" header="Secteur" />
        <Column field="Langue.FR" header="FR">
          <template #body="slotProps">
            <span v-if="slotProps.data.FR">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Langue.ALL" header="DE">
          <template #body="slotProps">
            <span v-if="slotProps.data.ALL">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.AIGU" header="AIGU">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.AIGU">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.REA" header="REA">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.REA">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.MSQ" header="MSQ">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.MSQ">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.SYSINT" header="SYSINT">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.SYSINT">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.NEUROGER" header="NEUROGER">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.NEUROGER">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column field="Secteur.AMBU" header="AMBU">
          <template #body="slotProps">
            <span v-if="slotProps.data.Secteur.AMBU">&#9989;</span>
            <span v-else>&#10060;</span>
          </template>
        </Column>
        <Column header="Choix1">
          <template #body="slotProps">
            <input type="checkbox" :disabled="!stageHasUnmetCriteria(slotProps.data)" :checked="choixUtilisateur[`${slotProps.rowIndex}-1`]" @change="gererChoix(slotProps.rowIndex, 1)">
          </template>
        </Column>
        <Column header="Choix2">
          <template #body="slotProps">
            <input type="checkbox" :disabled="!stageHasUnmetCriteria(slotProps.data)" :checked="choixUtilisateur[`${slotProps.rowIndex}-2`]" @change="gererChoix(slotProps.rowIndex, 2)">
          </template>
        </Column>
        <Column header="Choix3">
          <template #body="slotProps">
            <input type="checkbox" :disabled="!stageHasUnmetCriteria(slotProps.data)" :checked="choixUtilisateur[`${slotProps.rowIndex}-3`]" @change="gererChoix(slotProps.rowIndex, 3)">
          </template>
        </Column>
        <Column header="Choix4">
          <template #body="slotProps">
            <input type="checkbox" :disabled="!stageHasUnmetCriteria(slotProps.data)" :checked="choixUtilisateur[`${slotProps.rowIndex}-4`]" @change="gererChoix(slotProps.rowIndex, 4)">
          </template>
        </Column>
        <Column header="Choix5">
          <template #body="slotProps">
            <input type="checkbox" :disabled="!stageHasUnmetCriteria(slotProps.data)" :checked="choixUtilisateur[`${slotProps.rowIndex}-5`]" @change="gererChoix(slotProps.rowIndex, 5)">
          </template>
        </Column>
        <Column header="Nbre d'inscrits">
          <template #body="slotProps">
            {{ totalChoixParStage[slotProps.data.id] || '0' }}
          </template>
        </Column>
      </DataTable>
    </div>

    <div class="d-flex justify-content-center mt-4 text-center">
      <Button @click="choice" label="Choisir ses choix pour la PFP" class="me-2 mr-3" />
      <Button @click="retourAccueil" label="Retour à l'accueil" class="p-button-primary" />
    </div>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { ref as vueRef, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  name: 'Votation',
  components: {
    DataTable,
    Column,
    Button,
    Navbar
  },
  setup() {
    const stages = vueRef([]);
    const user = vueRef(null);
    const studentData = vueRef(null);
    const choixUtilisateur = vueRef({});
    const totalChoixParStage = vueRef({});
    const maxChoix = vueRef(5);

    const fetchUserChoices = () => {
      if (!user.value) {
        return;
      }

      const db = getDatabase();
      const userId = user.value.uid;
      const userChoicesRef = ref(db, `/choicePFP4/${userId}/choix`);

      get(userChoicesRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userChoices = snapshot.val();
          const choicesLog = [];

          Object.entries(userChoices).forEach(([choiceNumber, choiceValue]) => {
            choicesLog.push(`Choice ${choiceNumber}: ${choiceValue}`);
          });

          console.log(`The choices are: ${choicesLog.join(', ')};`);
          console.log(choicesLog);
        } else {
          console.log("There are no choices.");
        }
      }).catch((error) => {
        console.error("Error fetching user choices:", error);
      });
    };

    const choice = () => {
      const db = getDatabase();
      const userId = user.value.uid;
      const choixPath = `/choicePFP4/${userId}/choix`;
      const choixUtilisateurValue = choixUtilisateur.value;

      let choixAEnvoyer = {};
      for (const [cle, estChoisi] of Object.entries(choixUtilisateurValue)) {
        if (estChoisi) {
          const [idStage, numeroChoix] = cle.split('-');
          if (!choixAEnvoyer[numeroChoix]) {
            choixAEnvoyer[numeroChoix] = idStage;
          }
        }
      }

      set(ref(db, choixPath), choixAEnvoyer)
        .then(() => {
          console.log("Choix enregistrés avec succès");
          alert("Merci pour votre votation. Vous pouvez maintenant retourner à l'accueil.");
        })
        .catch((error) => {
          console.error("Erreur lors de l'enregistrement des choix", error);
        });
    };

    const calculerTotalChoix = () => {
      const db = getDatabase();
      const choixRef = ref(db, '/choicePFP4');
      get(choixRef).then((snapshot) => {
        if (snapshot.exists()) {
          const choixTousEtudiants = snapshot.val();
          let totalChoixParStageValue = {};

          Object.values(choixTousEtudiants).forEach(choixEtudiant => {
            Object.values(choixEtudiant.choix).forEach(idStage => {
              if (totalChoixParStageValue[idStage]) {
                totalChoixParStageValue[idStage]++;
              } else {
                totalChoixParStageValue[idStage] = 1;
              }
            });
          });
          totalChoixParStage.value = totalChoixParStageValue;
          Object.keys(totalChoixParStageValue).forEach(idStage => {
            console.log(`Total ${idStage}: ${totalChoixParStageValue[idStage]}`);
          });
        } else {
          console.log("No choices found.");
        }
      }).catch((error) => {
        console.error("Error retrieving choices", error);
      });
    };

    const retourAccueil = () => {
      this.$router.push('/');
    };

    const stageHasUnmetCriteria = (stage) => {
      if (!stage || !stage.Secteur) {
        console.error('Stage or stage.Secteur is undefined', stage);
        return false;
      }
      const unmetCriteria = getCriteresObligatoires();
      console.log(unmetCriteria);
      return unmetCriteria.some(critere => stage.Secteur[critere] === true);
    };

    const fetchStagesData = () => {
      const db = getDatabase();
      const stagesRef = ref(db, '/PFP3');
      get(stagesRef).then((snapshot) => {
        if (snapshot.exists()) {
          stages.value = Object.values(snapshot.val());
          console.log(stages.value);
        } else {
          console.log("No stages data available");
        }
      }).catch((error) => {
        console.error(error);
      });
    };

    const getCriteresObligatoires = () => {
      const criteres = [];
      let hasZeroValue = false;

      if (studentData.value) {
        if (studentData.value.FR === "0") {
          criteres.push("FR");
          return criteres;
        } else if (studentData.value.ALL === "0") {
          criteres.push("ALL");
          return criteres;
        }

        Object.entries(studentData.value).forEach(([key, value]) => {
          if (value === "0") {
            criteres.push(key);
            hasZeroValue = true;
          }
        });

        if (!hasZeroValue) {
          Object.keys(studentData.value).forEach(key => {
            criteres.push(key);
          });
        }
      }
      return criteres;
    };

    const fetchStudentData = (userId) => {
      const db = getDatabase();
      const studentRef = ref(db, `/students/ba21/${userId}`);
      get(studentRef).then((snapshot) => {
        if (snapshot.exists()) {
          studentData.value = snapshot.val();
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
      });
    };

    const gererChoix = (stageIndex, choixIndex) => {
      console.log(`Gestion du choix pour stage ${stageIndex}, choix ${choixIndex}`);

      const cleChoix = `${stageIndex}-${choixIndex}`;
      const etatActuel = choixUtilisateur.value[cleChoix] || false;

      if (etatActuel) {
        choixUtilisateur.value[cleChoix] = false;
      } else {
        const totalChoix = Object.values(choixUtilisateur.value).filter(val => val).length;
        if (totalChoix >= maxChoix.value) {
          alert(`Vous ne pouvez sélectionner que ${maxChoix.value} choix au total.`);
          return;
        }

        Object.keys(choixUtilisateur.value).forEach(cle => {
          const [index, choix] = cle.split('-');
          if (index == stageIndex || choix == choixIndex) {
            choixUtilisateur.value[cle] = false;
          }
        });

        choixUtilisateur.value[cleChoix] = true;
      }
    };

    onMounted(() => {
      calculerTotalChoix();
      const auth = getAuth();
      onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          user.value = currentUser;
          fetchStudentData(currentUser.uid);
          fetchStagesData();
          fetchUserChoices();
        } else {
          user.value = null;
        }
      });
    });

    return {
      stages,
      user,
      studentData,
      choixUtilisateur,
      totalChoixParStage,
      fetchUserChoices,
      choice,
      calculerTotalChoix,
      retourAccueil,
      stageHasUnmetCriteria,
      fetchStagesData,
      getCriteresObligatoires,
      fetchStudentData,
      gererChoix
    };
  }
};
</script>

<style scoped>
body {
  background-color: #f4f4f8;
  color: #333;
  font-family: 'Segoe UI', Arial, sans-serif;
}

.container {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.bg-danger, .bg-secondary {
  background-color: #fff !important;
}

.bg-danger {
  border-left: 4px solid #ffcccc;
}

.bg-secondary {
  background-color: #fafafa !important;
}

.check-icon {
  color: #4CAF50;
}

.non-check-icon {
  color: #f44336;
}

h1 {
  color: #333;
  margin-bottom: 16px;
  font-size: 24px;
}

p {
  line-height: 1.6;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  h1 {
    font-size: 20px;
  }

  button {
    padding: 8px 10px;
    font-size: 14px;
  }
}
</style>