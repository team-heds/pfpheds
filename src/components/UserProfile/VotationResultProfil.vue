<template>
  <div class="pfp-en-cours">
    <!-- Section Résultats de Votation -->
    <br>
    <h5 class="mb-4">Résultats de Votation</h5>

    <!-- Section Affectations PFP -->
    <br>
    <div v-if="assignments.length">
      <div class="grid m-2">
        <div v-for="(assignment, index) in assignments" :key="assignment._key" class="vote-card card p-3">
          <p><strong>Institution :</strong> {{ assignment.institutionName }}</p>
          <p><strong>Nom de la Place :</strong> {{ assignment.NomPlace }}</p>
          <p><strong>Nom :</strong> {{ assignment.nom }}</p>
          <p><strong>Prénom :</strong> {{ assignment.prenom }}</p>
          <p><strong>Répondant HES :</strong> {{ assignment.repondantHES }}</p>
          <p><strong>Vote Rank :</strong> {{ assignment.voteRank }}</p>
          <p><strong>Catégorie :</strong> {{ assignment.category }}</p>
          <p><strong>Canton :</strong> {{ assignment.canton }}</p>
          <p><strong>Localité :</strong> {{ assignment.locality }}</p>
          <p><strong>Critères :</strong> {{ assignment.validCriteria }}</p>
          <p><strong>URL PDF :</strong> {{ assignment.seat }}</p>
          <p><strong>Praticien Prénom :</strong> {{ assignment.praticienPrenom }}</p>
          <p><strong>Praticien Nom :</strong> {{ assignment.praticienNom }}</p>
          <p><strong>Praticien Mail :</strong> {{ assignment.praticienMail }}</p>
        </div>
      </div>

    </div>
    <div v-else>
      <p>Aucune affectation PFP disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ref as firebaseRef, onValue, get } from 'firebase/database';
import Button from 'primevue/button';
import { db } from 'root/firebase';

const props = defineProps({
  userId: { type: String, required: true }
});

/* ---------------------------
   Chargement des données de votation
------------------------------ */
const votationData = ref({});
const fetchVotationData = async () => {
  try {
    const votationRef = firebaseRef(db, 'VotationResult');
    const snapshot = await get(votationRef);
    if (snapshot.exists()) {
      votationData.value = snapshot.val();
    } else {
      console.error("Aucune donnée de votation disponible.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données de votation :", error);
  }
};
onMounted(() => {
  fetchVotationData();
});
const filteredVotationData = computed(() => {
  const result = {};
  const uid = props.userId;
  if (!votationData.value) return result;
  for (const groupKey in votationData.value) {
    const group = votationData.value[groupKey];
    const newGroup = {};
    for (const subKey in group) {
      const filteredArray = group[subKey].filter(item => item.studentId === uid);
      if (filteredArray.length > 0) {
        newGroup[subKey] = filteredArray;
      }
    }
    if (Object.keys(newGroup).length > 0) {
      result[groupKey] = newGroup;
    }
  }
  return result;
});
const hasVotationData = computed(() => Object.keys(filteredVotationData.value).length > 0);

/* ---------------------------
   Chargement des affectations PFP
   (Les données précédemment liées aux signatures et remarques ont été retirées)
------------------------------ */
const assignmentsData = ref({});
const placesData = ref({});
const institutions = ref({});
const users = ref({});
const students = ref({});
const praticienFormateurs = ref({});

// Récupération des affectations
const fetchAssignmentsData = () => {
  const assignRef = firebaseRef(db, 'signatureAssignments');
  onValue(assignRef, snapshot => {
    assignmentsData.value = snapshot.val() || {};
  });
};
const fetchInstitutions = () => {
  const instRef = firebaseRef(db, 'Institutions');
  onValue(instRef, snapshot => {
    institutions.value = snapshot.val() || {};
  });
};
const fetchPlaces = () => {
  const placesRef = firebaseRef(db, 'Places');
  onValue(placesRef, snapshot => {
    placesData.value = snapshot.val() || {};
  });
};
const fetchUsers = () => {
  const usersRef = firebaseRef(db, 'Users');
  onValue(usersRef, snapshot => {
    users.value = snapshot.val() || {};
  });
};
const fetchStudents = () => {
  const studentsRef = firebaseRef(db, 'Students');
  onValue(studentsRef, snapshot => {
    students.value = snapshot.val() || {};
  });
};
const fetchPraticienFormateurs = () => {
  const practRef = firebaseRef(db, 'PraticienFormateurs');
  onValue(practRef, snapshot => {
    praticienFormateurs.value = snapshot.val() || {};
  });
};

// Construction des affectations filtrées par l'utilisateur connecté
const assignments = computed(() => {
  const data = assignmentsData.value || {};
  const result = [];
  Object.keys(data).forEach(key => {
    const record = data[key];
    if (record.idEtudiant === props.userId) {
      const place = placesData.value[record.idPlace] || {};
      const institution = (place.IDPlace && institutions.value[place.IDPlace])
        ? institutions.value[place.IDPlace]
        : {};
      const student = students.value[record.idEtudiant] || {};
      const userObj = users.value[record.idEtudiant] || {};
      const criteriaKeys = ["AIGU", "AMBU", "DE", "FR", "REHAB", "MSQ", "NEUROGER"];
      const validCriteria = criteriaKeys.filter(k => {
        const val = place[k];
        return val === true || (typeof val === "string" && val.toLowerCase() === "true");
      });
      const voteRank = record.voteRank || "non voté";
      const seat = record.seat || "";
      let praticienFormateurKey = "";
      if (Array.isArray(place.praticiensFormateurs)) {
        praticienFormateurKey = place.praticiensFormateurs[0] || "";
      }
      const pract = praticienFormateurs.value[praticienFormateurKey] || {};
      result.push({
        _key: key,
        idPlace: record.idPlace,
        NomPlace: place.NomPlace || "",
        idInstitution:place.IDPlace || place.InstitutionId || "",
        institutionName: institution.Name || "non défini",
        idEtudiant: record.idEtudiant,
        nom: userObj.Nom || student.Nom || "",
        prenom: userObj.Prenom || student.Prenom || "",
        repondantHES: student.RepondantHES || "",
        voteRank,
        category: institution.Category || "non défini",
        canton: institution.Canton || "non défini",
        locality: institution.Locality || "non défini",
        validCriteria: validCriteria.join(", "),
        seat,
        praticienPrenom: pract.Prenom || "",
        praticienNom: pract.Nom || "",
        praticienMail: pract.Mail || ""
      });
    }
  });
  return result;
});

// Export CSV des affectations affichées
const exportCSV = () => {
  const data = assignments.value.map(assignment => {
    return {
      idPlace: assignment.idPlace,
      NomPlace: assignment.NomPlace,
      idInstitution: assignment.idInstitution,
      idEtudiant: assignment.idEtudiant,
      nom: assignment.nom,
      prenom: assignment.prenom,
      repondantHES: assignment.repondantHES,
      voteRank: assignment.voteRank,
      category: assignment.category,
      canton: assignment.canton,
      locality: assignment.locality,
      institutionName: assignment.institutionName,
      seat: assignment.seat,
      praticienPrenom: assignment.praticienPrenom,
      praticienNom: assignment.praticienNom,
      praticienMail: assignment.praticienMail,
      validCriteria: assignment.validCriteria
    };
  });
  if (!data.length) {
    alert("Aucune donnée à exporter.");
    return;
  }
  const headers = [
    "idPlace",
    "NomPlace",
    "idInstitution",
    "idEtudiant",
    "nom",
    "prenom",
    "repondantHES",
    "voteRank",
    "category",
    "canton",
    "locality",
    "institutionName",
    "seat",
    "praticienPrenom",
    "praticienNom",
    "praticienMail",
    "validCriteria"
  ];
  const csvRows = [];
  csvRows.push(headers.join(','));
  data.forEach(item => {
    const row = headers.map(header => {
      let val = item[header] !== undefined ? item[header] : "";
      if (typeof val === "string") {
        val = val.replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
      }
      return val;
    });
    csvRows.push(row.join(','));
  });
  const csvString = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "pfp_assignments.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchInstitutions();
  fetchPlaces();
  fetchUsers();
  fetchStudents();
  fetchPraticienFormateurs();
  fetchAssignmentsData();
});
</script>

<style scoped>
.pfp-en-cours {
  padding: 1rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
.vote-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: var(--surface-card, #fff);
}
.votation-group {
  margin-bottom: 1rem;
}
.votation-subgroup {
  margin-bottom: 0.75rem;
}
.subgroup-title {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}
</style>
