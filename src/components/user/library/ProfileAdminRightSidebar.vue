<template>
  <aside class="profile-admin-right-sidebar" aria-labelledby="student-navigation-title">
    <header class="sidebar-header">
      <span class="sidebar-eyebrow">Administration</span>
      <h2 id="student-navigation-title">Navigation étudiants</h2>
      <p>Retrouvez un profil directement ou parcourez une cohorte.</p>
    </header>

    <section class="sidebar-section" aria-labelledby="direct-search-title">
      <h3 id="direct-search-title">Accès direct</h3>
      <div class="field">
        <label for="search-user">Nom ou prénom</label>
        <InputText
          id="search-user"
          v-model="searchTerm"
          placeholder="Rechercher un étudiant"
          autocomplete="off"
          class="w-full"
        />
      </div>
      <div class="field">
        <label for="user-select">Étudiant</label>
        <Dropdown
          id="user-select"
          v-model="selectedUserId"
          :options="filteredUsers"
          optionLabel="prenomNom"
          optionValue="uid"
          placeholder="Sélectionner un étudiant"
          class="w-full"
        />
      </div>
      <Button
        label="Ouvrir le profil"
        icon="pi pi-arrow-right"
        iconPos="right"
        class="w-full"
        :disabled="!selectedUserId"
        @click="handleUserChange"
      />
    </section>

    <section class="sidebar-section" aria-labelledby="cohort-search-title">
      <div class="section-heading-row">
        <h3 id="cohort-search-title">Par cohorte</h3>
        <span v-if="selectedRoleBA" class="result-count">{{ filteredUsersByRole.length }}</span>
      </div>
      <div class="field">
        <label for="ba-role-select">Cohorte</label>
        <Dropdown
          id="ba-role-select"
          v-model="selectedRoleBA"
          :options="rolesBA"
          optionLabel="label"
          optionValue="value"
          placeholder="Sélectionner une cohorte"
          class="w-full"
        />
      </div>

      <div class="field">
        <label for="role-search">Filtrer les résultats</label>
        <InputText
          id="role-search"
          v-model="roleSearchTerm"
          placeholder="Nom ou prénom"
          autocomplete="off"
          class="w-full"
        />
      </div>

      <div v-if="selectedRoleBA" class="user-list" aria-live="polite">
        <Button
          v-for="user in paginatedUsersByRole"
          :key="user.uid"
          :label="`${user.prenom} ${user.nom}`"
          severity="secondary"
          text
          class="user-item w-full"
          @click="handleBAUserChange(user.uid)"
        />
        <p v-if="filteredUsersByRole.length === 0" class="empty-message">
          Aucun étudiant ne correspond à cette recherche.
        </p>
      </div>

      <div v-if="totalPages > 1" class="pagination" aria-label="Pagination des étudiants">
        <Button icon="pi pi-arrow-left" aria-label="Page précédente" text @click="prevPage" :disabled="currentPage <= 0" />
        <span>Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
        <Button icon="pi pi-arrow-right" aria-label="Page suivante" text @click="nextPage" :disabled="currentPage >= totalPages - 1" />
      </div>
    </section>

    <footer class="ba-navigation-modern" aria-label="Navigation rapide BA22">
      <Button class="ba-btn" @click="prevBA22" icon="pi pi-arrow-left" label="Précédent" severity="secondary" outlined />
      <Button class="ba-btn" @click="nextBA22" icon="pi pi-arrow-right" iconPos="right" label="Suivant" />
    </footer>
  </aside>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

import { ref, computed, onMounted, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { getAllStudents } from '@/service/studentDirectoryService';

const router = useRouter();

// Variables de recherche et de pagination
const searchTerm = ref('');
const selectedUserId = ref(null);
const selectedRoleBA = ref(null);
const roleSearchTerm = ref('');
const currentPage = ref(0);
const itemsPerPage = 15;

// Annuaire étudiant filtré et autorisé côté serveur
const usersList = ref([]);

// Liste des rôles BA disponibles
const rolesBA = ref([
  { label: 'BA22', value: 'BA22' },
  { label: 'BA23', value: 'BA23' },
  { label: 'BA24', value: 'BA24' }
]);

// Récupération des utilisateurs étudiants depuis l'annuaire serveur
const fetchUsers = async () => {
  try {
    const students = await getAllStudents();
    usersList.value = students
      .map((user) => ({
        uid: user.user_id,
        prenom: user.forname || user.Prenom || 'Inconnu',
        nom: user.family_name || user.Nom || 'Inconnu',
        prenomNom: `${user.forname || user.Prenom || 'Inconnu'} ${user.family_name || user.Nom || 'Inconnu'}`,
        class: user.Classe || user.classe || '',
        // Pour compatibilité avec l'ancien système de rôles
        Roles: {
          BA22: user.class === 'BA22',
          BA23: user.class === 'BA23',
          BA24: user.class === 'BA24'
        }
      }))
      .sort((a, b) => a.nom.localeCompare(b.nom));
  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
  }
};

onMounted(fetchUsers);

// Trie des utilisateurs par nom
const sortedUsers = computed(() => {
  return usersList.value.slice().sort((a, b) => a.nom.localeCompare(b.nom));
});

// Filtrage pour le dropdown de recherche
const filteredUsers = computed(() => {
  if (!searchTerm.value) return sortedUsers.value;
  return sortedUsers.value.filter(user =>
    `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Filtrage par rôle BA pour la recherche dans le dropdown
const filteredUsersByRole = computed(() => {
  if (!selectedRoleBA.value) return [];
  let filtered = sortedUsers.value.filter(user => {
    const role = user.Roles?.[selectedRoleBA.value];
    return role === true || (typeof role === 'string' && role.toLowerCase() === 'true');
  });
  if (roleSearchTerm.value) {
    const search = roleSearchTerm.value.toLowerCase();
    filtered = filtered.filter(user =>
      `${user.prenom} ${user.nom}`.toLowerCase().includes(search)
    );
  }
  return filtered;
});

const totalPages = computed(() => Math.ceil(filteredUsersByRole.value.length / itemsPerPage));
const paginatedUsersByRole = computed(() => {
  const start = currentPage.value * itemsPerPage;
  return filteredUsersByRole.value.slice(start, start + itemsPerPage);
});

watch([selectedRoleBA, roleSearchTerm], () => {
  currentPage.value = 0;
});

const nextPage = () => {
  if (currentPage.value < totalPages.value - 1) currentPage.value++;
};
const prevPage = () => {
  if (currentPage.value > 0) currentPage.value--;
};

const handleUserChange = () => {
  if (selectedUserId.value)
    router.push({ name: 'ProfileAdmin', params: { id: selectedUserId.value } });
};

const handleBAUserChange = (uid) => {
  if (uid)
    router.push({ name: 'ProfileAdmin', params: { id: uid } });
};

// ------------------- Navigation BA22 -------------------
// Création d'une liste d'ID pour les utilisateurs BA22
// en filtrant la liste triée sur Users via Roles.BA22 (booléen ou "true").
const ba22UserIDs = computed(() => {
  return sortedUsers.value
    .filter(user => {
      const role = user.Roles?.BA22;
      return role === true || (typeof role === 'string' && role.toLowerCase() === 'true');
    })
    .map(user => user.uid);
});

// Pour vérifier la liste dans la console
watch(ba22UserIDs, (newIDs) => {
  console.log("Liste des IDs BA22 :", newIDs);
}, { immediate: true });

// Gestion de l'indice courant avec persistance via sessionStorage
const STORAGE_KEY = 'currentBA22Index';
const initialIndex = parseInt(sessionStorage.getItem(STORAGE_KEY)) || 0;
const currentBA22Index = ref(initialIndex);

// Watcher pour sauvegarder l'indice dans sessionStorage à chaque mise à jour
watch(currentBA22Index, (newIndex) => {
  sessionStorage.setItem(STORAGE_KEY, newIndex);
});

// Fonctions de navigation entre utilisateurs BA22
const nextBA22 = () => {
  if (ba22UserIDs.value.length === 0) return;
  currentBA22Index.value = (currentBA22Index.value + 1) % ba22UserIDs.value.length;
  const nextId = ba22UserIDs.value[currentBA22Index.value];
  console.log("Étudiant BA22 suivant, ID :", nextId);
  router.push({ name: 'ProfileAdmin', params: { id: nextId } });
};

const prevBA22 = () => {
  if (ba22UserIDs.value.length === 0) return;
  currentBA22Index.value = (currentBA22Index.value - 1 + ba22UserIDs.value.length) % ba22UserIDs.value.length;
  const prevId = ba22UserIDs.value[currentBA22Index.value];
  console.log("Étudiant BA22 précédent, ID :", prevId);
  router.push({ name: 'ProfileAdmin', params: { id: prevId } });
};
</script>

<style scoped>
.field {
  display: grid;
  gap: 0.45rem;
  margin: 0;
}
.field label {
  color: var(--text-color-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
}
.profile-admin-right-sidebar {
  padding: 1.25rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.07);
}
.sidebar-header h2,
.sidebar-section h3,
.sidebar-header p {
  margin: 0;
}
.sidebar-header {
  display: grid;
  gap: 0.35rem;
}
.sidebar-header h2 {
  color: var(--text-color);
  font-size: 1.2rem;
  line-height: 1.2;
}
.sidebar-header p {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}
.sidebar-eyebrow {
  color: var(--primary-color);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sidebar-section {
  display: grid;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: 0.875rem;
  background: var(--surface-ground);
}
.sidebar-section h3 {
  color: var(--text-color);
  font-size: 0.95rem;
}
.section-heading-row,
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.result-count {
  min-width: 1.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  color: var(--primary-color-text);
  background: var(--primary-color);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.user-list {
  display: grid;
  gap: 0.25rem;
  max-height: 16rem;
  overflow-y: auto;
}
.user-item {
  justify-content: flex-start;
  min-height: 2.5rem;
  padding-inline: 0.75rem;
  text-align: start;
}
.user-item :deep(.p-button-label) {
  flex: initial;
  text-align: start;
}
.empty-message {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}
.pagination {
  color: var(--text-color-secondary);
  font-size: 0.8125rem;
}
.ba-navigation-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.25rem;
}
.ba-btn {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  border-radius: 0.75rem;
  transition-property: color, background-color, border-color, transform;
}
</style>
