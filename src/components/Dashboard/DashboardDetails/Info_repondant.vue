<template>
  <div>
    <Navbar />
    <h1>Informations Répondant HES</h1>
    <div v-if="isAdmin">
      <label for="enseignant-select">Choisir un enseignant :</label>
      <select v-model="selectedEnseignantKey" id="enseignant-select">
        <option v-for="(ens, key) in enseignants" :key="key" :value="key">
          {{ ens.Forname }} {{ ens.Name }}
        </option>
      </select>
    </div>
    <div class="repondant-row">
      <div class="repondant-col">
        <InfoRepondantEtudiants :etudiants="etudiantsAssignes" />
      </div>
      <div class="repondant-col">
        <InfoRepondantSignature
          :enseignant="enseignant"
          :signatureAssignments="signatureAssignments"
          :users="users"
          :places="places"
          :institutions="institutions"
          :praticienFormateurs="praticienFormateurs"
          :students="students"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ref as firebaseRef, onValue } from "firebase/database";
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '@/components/Utils/Navbar.vue';
import { db, auth } from 'root/firebase';

import InfoRepondantEtudiants from './InfoRepondantEtudiants.vue';
import InfoRepondantSignature from './InfoRepondantSignature.vue';

export default {
  name: 'InfoRepondant',
  components: { Navbar, InfoRepondantEtudiants, InfoRepondantSignature },
  setup() {
    const user = ref(null);
    const enseignants = ref({});
    const students = ref({});
    const users = ref({});
    const selectedEnseignantKey = ref('');

    onMounted(() => {
      onAuthStateChanged(auth, authUser => {
        if (authUser && authUser.uid) {
          const userRef = firebaseRef(db, `Users/${authUser.uid}`);
          onValue(userRef, snap => {
            if (snap.exists()) {
              user.value = { ...snap.val(), key: authUser.uid };
            }
          });
        }
      });
      fetchEnseignants();
      fetchStudents();
      fetchUsers();
    });

    const fetchEnseignants = () => {
      const refE = firebaseRef(db, 'Enseignants');
      onValue(refE, snap => {
        enseignants.value = snap.val() || {};
        if (!selectedEnseignantKey.value && user.value && user.value.Roles && user.value.Roles.enseignant) {
          selectedEnseignantKey.value = user.value?.enseignantKey || '';
        }
      });
    };
    const fetchStudents = () => {
      const refS = firebaseRef(db, 'Students');
      onValue(refS, snap => {
        students.value = snap.val() || {};
      });
    };
    const fetchUsers = () => {
      const refU = firebaseRef(db, 'Users');
      onValue(refU, snap => {
        users.value = snap.val() || {};
      });
    };

    const isAdmin = computed(() => user.value && user.value.Roles && user.value.Roles.admin === true);

    const enseignant = computed(() => {
      if (isAdmin.value && selectedEnseignantKey.value) {
        return enseignants.value[selectedEnseignantKey.value]
          ? { key: selectedEnseignantKey.value, ...enseignants.value[selectedEnseignantKey.value] }
          : null;
      }
      return null;
    });

    const signatureAssignments = ref({});
    const places = ref({});
    const praticienFormateurs = ref({});
    const institutions = ref({});

 

    const fetchSignatureAssignments = () => {
      const refSig = firebaseRef(db, 'signatureAssignments');
      onValue(refSig, snap => {
        signatureAssignments.value = snap.val() || {};
      });
    };
    const fetchPlaces = () => {
      const refP = firebaseRef(db, 'Places');
      onValue(refP, snap => {
        places.value = snap.val() || {};
      });
    };
    const fetchPraticienFormateurs = () => {
      const refPF = firebaseRef(db, 'PraticienFormateurs');
      onValue(refPF, snap => {
        praticienFormateurs.value = snap.val() || {};
      });
    };
    const fetchInstitutions = () => {
      const refI = firebaseRef(db, 'Institutions');
      onValue(refI, snap => {
        institutions.value = snap.val() || {};
      });
    };
    onMounted(() => {
      fetchSignatureAssignments();
      fetchPlaces();
      fetchPraticienFormateurs();
      fetchInstitutions();
      fetchStudents();
    });

    const etudiantsAssignes = computed(() => {
      if (!selectedEnseignantKey.value) return [];
      return Object.entries(students.value)
        .filter(([id, e]) => {
          return (
            e.repondHESID === selectedEnseignantKey.value ||
            e.RepondantHES === enseignants.value[selectedEnseignantKey.value]?.Name ||
            (e.RepondantHES && enseignants.value[selectedEnseignantKey.value]?.Name && e.RepondantHES.toLowerCase() === enseignants.value[selectedEnseignantKey.value].Name.toLowerCase()) ||
            (e.RepondantHES && enseignants.value[selectedEnseignantKey.value]?.Forname && e.RepondantHES.toLowerCase() === enseignants.value[selectedEnseignantKey.value].Forname.toLowerCase())
          );
        })
        .map(([id, e]) => {
          const userObj = users.value[id] || {};
          // Cherche l'affectation de signature pour cet étudiant
          const sigAssign = Object.values(signatureAssignments.value).find(a => a.idEtudiant === id);
          let placeDomaine = '', institutionName = '', praticienFormateur = null, lieuSignature = '';
          if (sigAssign) {
            const place = places.value[sigAssign.idPlace] || {};
            placeDomaine = place.Domaine || '';
            const instId = place.InstitutionId || place.IDPlace;
            institutionName = (instId && institutions.value[instId]) ? (institutions.value[instId].Nom || institutions.value[instId].Name || '') : '';
            if (sigAssign.praticienFormateurKey && praticienFormateurs.value[sigAssign.praticienFormateurKey]) {
              praticienFormateur = praticienFormateurs.value[sigAssign.praticienFormateurKey];
            } else if (sigAssign.praticienFormateur) {
              praticienFormateur = typeof sigAssign.praticienFormateur === 'object' ? sigAssign.praticienFormateur : null;
            }
            lieuSignature = sigAssign.lieuSignature || '';
          }
          return {
            key: id,
            Class: e.Class,
            Nom: userObj.Nom || '',
            Prenom: userObj.Prenom || '',
            placeDomaine,
            institutionName,
            praticienFormateur,
            lieuSignature
          };
        });
    });

    return {
      isAdmin,
      enseignants,
      enseignant,
      signatureAssignments,
      users,
      places,
      institutions,
      praticienFormateurs,
      students,
      selectedEnseignantKey,
      etudiantsAssignes
    };
  }
};
</script>

<style scoped>
.repondant-row {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
}
.repondant-col {
  flex: 1 1 0;
  min-width: 0;
  box-sizing: border-box;
}
h1 {
  margin-bottom: 2rem;
}
</style>
