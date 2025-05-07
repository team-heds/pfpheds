<template>
    <div>
        <Navbar />
        <h1>Liste des Répondants HES</h1>
        <div style="margin-bottom: 1rem; font-weight: bold;">
            Nombre total d'étudiants assignés : {{ totalEtudiantsAssignes }}
        </div>
        <DataTable :value="enseignantsAvecEtudiants" responsiveLayout="scroll" v-if="enseignantsAvecEtudiants.length">
            <Column header="#" style="width: 3rem;">
                <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column header="Nom" field="Name" />
            <Column header="Prénom" field="Forname" />
            <Column header="Email" field="Mail" />
            <Column header="Nb étudiants assignés">
                <template #body="{ data }">
                    {{ data.students.length }}
                </template>
            </Column>
            <Column header="Étudiants assignés">
                <template #body="{ data }">
                    <ul v-if="data.students.length">
                        <li v-for="etudiant in data.students" :key="etudiant.key">
                            {{ etudiant.Class }} — {{ etudiant.Nom }} {{ etudiant.Prenom }}
                        </li>
                    </ul>
                    <span v-else>Aucun étudiant assigné</span>
                </template>
            </Column>
            <Column header="Chargé de signature">
                <template #body="{ data }">
                    <ul>
                        <li v-for="place in filteredSignatureAssignments(data)" :key="place._key">
                            <span>
                                {{ getUserNomPrenom(place.idEtudiant) }}<br>
                                <span style="font-size:0.95em;color:#888;">
                                    {{ getNomDomainePlace(place.idPlace) }} - 
                                    {{ getInstitutionNameById(getPlaceIdInstitutionById(place.idPlace)) }}<br>
                                    <span v-if="place.praticienFormateur">
                                        PF: {{ place.praticienFormateur.Prenom }} {{ place.praticienFormateur.Nom }}
                                    </span>
                                    <span v-if="place.lieuSignature">
                                        <br>Lieu signature: {{ place.lieuSignature }}
                                    </span>
                                </span>
                            </span>
                        </li>
                    </ul>
                    <span v-if="filteredSignatureAssignments(data).length === 0">Aucune affectation</span>
                </template>
            </Column>
        </DataTable>
        <div v-else>
            Aucun Répondant HES trouvé.<br>
            <details>
                <summary>Debug : Affichage brut des enseignants et étudiants</summary>
                <pre>{{ teachersRaw }}</pre>
                <pre>{{ studentsRaw }}</pre>
            </details>
        </div>
    </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { ref as firebaseRef, onValue } from "firebase/database";

import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { db } from 'root/firebase';

export default {
    name: 'ManagementRepondant',
    components: {
        Navbar,
        DataTable,
        Column
    },
    setup() {
        // Fonction utilitaire pour obtenir Nom Prénom d'un utilisateur
        function getUserNomPrenom(id) {
            const user = users.value?.[id];
            return user && user.Nom && user.Prenom ? user.Nom + ' ' + user.Prenom : 'Utilisateur inconnu';
        }

        // Fonction pour chercher une place à partir de son ID
        // Référence réactive pour les places
        const places = ref({});
        // Fetch des places depuis Firebase
        const fetchPlaces = () => {
            const placesRef = firebaseRef(db, 'Places');
            onValue(placesRef, snapshot => {
                places.value = snapshot.val() || {};
                // Ajout du log pour diagnostiquer la structure des données
                console.log('places.value:', places.value);
                if (places.value && typeof places.value === 'object') {
                    const keys = Object.keys(places.value);
                    if (keys.length > 0) {
                        console.log('Exemple de clé:', keys[0], 'Exemple de valeur:', places.value[keys[0]]);
                    } else {
                        console.log('places.value est vide');
                    }
                } else {
                    console.log('places.value n\'est pas un objet');
                }
            });
        };
        // ATTENTION : idPlace doit être l'IDPlace (string), ex : "-O3k_m7cRctNx0MEzaU-"
        function getPlaceById(idPlace) {
    // Accès direct à la clé
    return places.value[idPlace] || null;
}
        // Fonction pour obtenir le nom et domaine/idInstitution d'une place
        function getNomDomainePlace(idPlace) {
            const place = getPlaceById(idPlace);
            if (!place) return 'Place inconnue';
            let domaine = place.idInstitution || place.Domaine || '';
            return `${place.NomPlace || 'Nom inconnu'}${domaine ? ' / ' + domaine : ''}`;
        }
        // Fonction pour obtenir l'idInstitution d'une place
        function getPlaceIdInstitutionById(idPlace) {
            const place = getPlaceById(idPlace);
            if (!place) return 'Institution inconnue';
            return place.IDPlace ||
                place.InstitutionId
                || 'Institution inconnue';
        }

        // Référence réactive pour les institutions
        const institutions = ref({});
        // Fetch des institutions depuis Firebase
        const fetchInstitutions = () => {
            const institutionsRef = firebaseRef(db, 'Institutions');
            onValue(institutionsRef, snapshot => {
                institutions.value = snapshot.val() || {};
            });
        };
        // Fonction pour obtenir le nom de l'institution à partir de son id
        function getInstitutionNameById(idInstitution) {
            const inst = institutions.value[idInstitution];
            return inst && inst.Name ? inst.Name : 'Institution inconnue';
        }

        const teachers = ref({});
        const teachersRaw = ref({});
        const students = ref({});
        const signatureAssignments = ref({});
        const placesChargeSignature = ref({});
        const studentsRaw = ref({});
        const users = ref({});
        const usersRaw = ref({});
        const praticienFormateurs = ref({});

        const repondantsList = computed(() => {
            return Object.entries(teachers.value).map(([key, t]) => ({ key, ...t })).filter(t => {
                return t.RepondantHES === true || t.RepondantHES === 'oui' || t.RepondantHES === 'Oui' || t.RepondantHES !== '';
            });
        });
        const enseignantsAvecEtudiants = computed(() => {
            return repondantsList.value.map(enseignant => {
                const etudiants = Object.entries(students.value)
                    .filter(([id, e]) => {
                        return (
                            e.repondHESID === enseignant.key ||
                            e.RepondantHES === enseignant.Name ||
                            (e.RepondantHES && enseignant.Name && e.RepondantHES.toLowerCase() === enseignant.Name.toLowerCase()) ||
                            (e.RepondantHES && enseignant.Forname && e.RepondantHES.toLowerCase() === enseignant.Forname.toLowerCase())
                        );
                    })
                    .map(([id, e]) => {
                        const user = users.value[id] || {};
                        return {
                            key: id,
                            Class: e.Class,
                            Nom: user.Nom || '',
                            Prenom: user.Prenom || ''
                        };
                    });
                return { ...enseignant, students: etudiants };
            });
        });
        const fetchTeachers = () => {
            const teachersRef = firebaseRef(db, 'Enseignants');
            onValue(teachersRef, snapshot => {
                teachers.value = snapshot.val() || {};
                teachersRaw.value = snapshot.val() || {};
            });
        };
        const fetchStudents = () => {
            const studentsRef = firebaseRef(db, 'Students');
            onValue(studentsRef, snapshot => {
                students.value = snapshot.val() || {};
                studentsRaw.value = snapshot.val() || {};
            });
        };
        const fetchUsers = () => {
            const usersRef = firebaseRef(db, 'Users');
            onValue(usersRef, snapshot => {
                users.value = snapshot.val() || {};
                usersRaw.value = snapshot.val() || {};
            });
        };
        const fetchSignatureAssignments = () => {
            const sigAssignRef = firebaseRef(db, 'signatureAssignments');
            onValue(sigAssignRef, snapshot => {
                signatureAssignments.value = snapshot.val() || {};
                const byRepondant = {};
                Object.entries(signatureAssignments.value).forEach(([key, val]) => {
                    if (val.enChargeDeLaSignature && val.repondantHESKey) {
                        if (!byRepondant[val.repondantHESKey]) byRepondant[val.repondantHESKey] = [];
                        byRepondant[val.repondantHESKey].push({ ...val, _key: key });
                    }
                });
                placesChargeSignature.value = byRepondant;
            });
        };

        const fetchPraticienFormateurs = () => {
            const practRef = firebaseRef(db, 'PraticienFormateurs');
            onValue(practRef, snapshot => {
                praticienFormateurs.value = snapshot.val() || {};
            });
        };

        onMounted(() => {
            fetchTeachers();
            fetchStudents();
            fetchUsers();
            fetchSignatureAssignments();
            fetchPlaces();
            fetchInstitutions();
            fetchPraticienFormateurs();
        });
        const totalEtudiantsAssignes = computed(() => {
            return enseignantsAvecEtudiants.value.reduce((acc, ens) => acc + (ens.students ? ens.students.length : 0), 0);
        });
        function filteredSignatureAssignments(enseignant) {
            return Object.values(signatureAssignments.value)
                .filter(place => place.teacherKey === enseignant.key)
                .map(place => {
                    let praticien = null;
                    if (place.praticienFormateurKey && praticienFormateurs.value[place.praticienFormateurKey]) {
                        praticien = praticienFormateurs.value[place.praticienFormateurKey];
                    }
                    return {
                        ...place,
                        praticienFormateur: praticien,
                        lieuSignature: place.lieuSignature || '',
                    };
                });
        }

        return {
            repondantsList,
            enseignantsAvecEtudiants,
            teachersRaw,
            studentsRaw,
            usersRaw,
            totalEtudiantsAssignes,
            placesChargeSignature,
            filteredSignatureAssignments,
            getUserNomPrenom,
            getNomDomainePlace,
            getPlaceIdInstitutionById,
            getInstitutionNameById
        };
    }
};


</script>

<style scoped>
h1 {
    margin-bottom: 2rem;
}
</style>
