<template>
        <Navbar />

    <div class="places-list">
        <h2>Liste des Places</h2>

        <!-- Filtres : cases à cocher pour PFP1A, PFP1B, PFP2, PFP3, PFP4 -->
        <div class="filters">
            <label v-for="filter in filterOptions" :key="filter" class="filter-label">
                <input type="checkbox" :value="filter" v-model="selectedFilters" />
                {{ filter }}
            </label>
        </div>

        <!-- Tableau d'affichage -->
        <table>
            <thead>
                <tr>
                    <th>NomPlace</th>
                    <th>Institution</th>
                    <th>Praticiens Formateurs</th>
                    <th>Nom Etudiant</th>
                    <th>Repondant HES</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="place in filteredPlaces" :key="place.id + (place.duplicateIndex || '')">
                    <td>{{ place.NomPlace }}</td>
                    <td>{{ getInstitutionName(place.InstitutionId || place.IDPlace) }}</td>
                    <td>
                        <span v-if="place.praticiensFormateurs && place.praticiensFormateurs.length">
                            {{ getPractitionerNameForPlace(place) }}
                        </span>
                    </td>
                    <td>
                        <span v-if="getStudentNameForPlace(place)">
                            {{ getStudentNameForPlace(place) }}
                        </span>
                    </td>

                    <td>
                        <span v-if="getStudentRepondantForPlace(place)">
                            {{ getStudentRepondantForPlace(place) }}
                        </span>
                    </td>

                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getDatabase, ref as dbRef, get } from 'firebase/database';
import Navbar from '@/components/common/utils/Navbar.vue';

// Références pour stocker les données
const places = ref([]);
const selectedFilters = ref(['PFP1A']);
const filterOptions = ['PFP1A'];
const praticiensMapping = ref({});
const votationResults = ref([]);
const usersMapping = ref({});
const institutionsMapping = ref({});
const studentsMapping = ref({});

const getStudentNameForPlace = (place) => {
    const studentIds = votationResults.value
        .filter(result => result.placeKey === place.id)
        .map(result => result.studentId);
    if (!studentIds.length) return "";
    const index = typeof place.duplicateIndex !== "undefined" ? place.duplicateIndex : 0;
    const studentId = studentIds[index] || studentIds[0];
    return getStudentName(studentId);
};


const getStudentRepondantForPlace = (place) => {
    const studentIds = votationResults.value
        .filter(result => result.placeKey === place.id)
        .map(result => result.studentId);
    if (!studentIds.length) return "";
    const index = typeof place.duplicateIndex !== "undefined" ? place.duplicateIndex : 0;
    const studentId = studentIds[index] || studentIds[0];

    return getStudentRepondant(studentId);
};
// Récupère les places depuis "/Places" et effectue la duplication selon PFP1A
const fetchPlaces = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/Places'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            places.value = Object.keys(data).flatMap(key => {
                const place = { id: key, ...data[key] };
                const duplication = parseInt(place.PFP1A, 10) || 0;
                const copies = duplication < 1 ? 1 : duplication;
                return Array.from({ length: copies }, (_, index) => ({
                    ...place,
                    duplicateIndex: index
                }));
            });
        } else {
            console.error("Aucune donnée trouvée dans /Places");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des places :", error);
    }
};

// Récupère les praticiens formateurs depuis "/PraticienFormateurs"
const fetchPraticiensMapping = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/PraticienFormateurs'));
        if (snapshot.exists()) {
            praticiensMapping.value = snapshot.val();
        } else {
            console.error("Aucune donnée trouvée dans /PraticienFormateurs");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des praticiens :", error);
    }
};

// Récupère les résultats de votation pour PFP1A depuis "/VotationResult/BA24/PFP1A"
const fetchVotationResults = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/VotationResult/BA24/PFP1A'));
        if (snapshot.exists()) {
            const data = snapshot.val();
            let results = [];
            Object.values(data).forEach(item => {
                if (item.PFP1A && Array.isArray(item.PFP1A)) {
                    results = results.concat(item.PFP1A);
                }
            });
            // On s'attend à un tableau d'objets { placeKey, studentId }
            votationResults.value = data;
        } else {
            console.error("Aucune donnée trouvée dans /VotationResult/BA24/PFP1A");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des votation results :", error);
    }
};

// Récupère les utilisateurs (étudiants) depuis "/Users"
const fetchUsers = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/Users'));
        if (snapshot.exists()) {
            usersMapping.value = snapshot.val();
        } else {
            console.error("Aucune donnée trouvée dans /Users");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des utilisateurs :", error);
    }
};

const fetchStudents = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/Students'));
        if (snapshot.exists()) {
            studentsMapping.value = snapshot.val();
        } else {
            console.error("Aucune donnée trouvée dans /Users");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des utilisateurs :", error);
    }
};

// Récupère les institutions depuis "/institutions"
const fetchInstitutions = async () => {
    try {
        const db = getDatabase();
        const snapshot = await get(dbRef(db, '/institutions'));
        if (snapshot.exists()) {
            institutionsMapping.value = snapshot.val();
        } else {
            console.error("Aucune donnée trouvée dans /institutions");
        }
    } catch (error) {
        console.error("Erreur lors du fetch des institutions :", error);
    }
};

onMounted(() => {
    fetchPlaces();
    fetchPraticiensMapping();
    fetchVotationResults();
    fetchUsers();
    fetchInstitutions();
    fetchStudents();
});

// Filtrage des places selon les filtres sélectionnés
const filteredPlaces = computed(() => {
    if (selectedFilters.value.length === 0) {
        return places.value;
    }
    return places.value.filter(place => {
        return selectedFilters.value.some(filterKey => {
            const value = place[filterKey];
            return value && value !== "0" && value !== false && value !== "false";
        });
    });
});

// Fonction pour récupérer le nom complet d'un praticien formateur
const getPractitionerName = (id) => {
    const practitioner = praticiensMapping.value[id];
    return practitioner ? `${practitioner.Prenom} ${practitioner.Nom}` : id;
};

// Pour chaque place, on affiche UN praticien formateur en se basant sur duplicateIndex
const getPractitionerNameForPlace = (place) => {
    if (place.praticiensFormateurs && place.praticiensFormateurs.length) {
        const index = typeof place.duplicateIndex !== "undefined" ? place.duplicateIndex : 0;
        const practitionerId = place.praticiensFormateurs[index] || place.praticiensFormateurs[0];
        return getPractitionerName(practitionerId);
    }
    return "";
};



// Fonction pour récupérer le nom complet d'un étudiant (inchangée)
const getStudentName = (id) => {
    const user = usersMapping.value[id];
    return user && user.Prenom && user.Nom ? `${user.Prenom} ${user.Nom}` : id;
};

const getStudentRepondant = (id) => {
    return studentsMapping.value[id]?.RepondantHES ?? "-";
};

// Fonction pour récupérer le nom d'une institution à partir de son ID (inchangée)
const getInstitutionName = (institutionId) => {
    const institution = institutionsMapping.value[institutionId];
    return institution ? institution.Name : institutionId;
};
</script>

<style scoped>
.places-list {
    padding: 1rem;
}

.filters {
    margin-bottom: 1rem;
}

.filter-label {
    margin-right: 1rem;
    font-weight: normal;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th,
td {
    border: 1px solid #ccc;
    padding: 0.5rem;
    text-align: left;
}
</style>
