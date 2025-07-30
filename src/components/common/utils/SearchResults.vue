<template>
  <div class="search-results-container">
    <h2>Résultats de recherche pour "{{ route.query.q }}"</h2>

    <TabView>
      <TabPanel header="Utilisateurs" v-if="filteredUsers.length">
        <DataTable :value="filteredUsers" class="p-datatable-striped">
          <Column field="name" header="Nom" />
          <Column header="Action">
            <template #body="slotProps">
              <Button
                icon="pi pi-user"
                label="Voir Profil"
                class="p-button-outlined"
                @click="navigateTo(slotProps.data.link)"
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <TabPanel header="Institutions" v-if="filteredInstitutions.length">
        <DataTable :value="filteredInstitutions" class="p-datatable-striped">
          <Column field="name" header="Nom" />
          <Column header="Action">
            <template #body="slotProps">
              <Button
                icon="pi pi-building"
                label="Voir Institution"
                class="p-button-outlined"
                @click="navigateTo(slotProps.data.link)"
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <TabPanel header="Posts" v-if="filteredPosts.length">
        <DataTable :value="filteredPosts" class="p-datatable-striped">
          <Column field="name" header="Titre" />
          <Column header="Action">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                label="Voir Post"
                class="p-button-outlined"
                @click="navigateTo(slotProps.data.link)"
              />
            </template>
          </Column>
        </DataTable>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '../../../../firebase';
import { ref as firebaseRef, get } from 'firebase/database';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();
const searchResults = ref([]);

const fetchSearchResults = async () => {
  const query = route.query.q.toLowerCase();
  searchResults.value = [];

  const usersRef = firebaseRef(db, 'Users');
  const institutionsRef = firebaseRef(db, 'institutions');
  const postsRef = firebaseRef(db, 'Posts');

  const [usersSnap, institutionsSnap, postsSnap] = await Promise.all([
    get(usersRef),
    get(institutionsRef),
    get(postsRef),
  ]);

  if (usersSnap.exists()) {
    searchResults.value.push(...Object.entries(usersSnap.val())
      .filter(([_, user]) => `${user.Prenom} ${user.Nom}`.toLowerCase().includes(query))
      .map(([id, user]) => ({ id, name: `${user.Prenom} ${user.Nom}`, link: `/profile/${id}` })));
  }

  if (institutionsSnap.exists()) {
    searchResults.value.push(...Object.entries(institutionsSnap.val())
      .filter(([_, inst]) => inst.Name.toLowerCase().includes(query))
      .map(([id, inst]) => ({ id, name: inst.Name, link: `/institution/${id}` })));
  }

  if (postsSnap.exists()) {
    searchResults.value.push(...Object.entries(postsSnap.val())
      .filter(([_, post]) => post.Title.toLowerCase().includes(query))
      .map(([id, post]) => ({ id, name: post.Title, link: `/post/${id}` })));
  }
};

onMounted(fetchSearchResults);

const filteredUsers = computed(() => searchResults.value.filter(item => item.link.startsWith('/profile')));
const filteredInstitutions = computed(() => searchResults.value.filter(item => item.link.startsWith('/institution')));
const filteredPosts = computed(() => searchResults.value.filter(item => item.link.startsWith('/post')));

const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.search-results-container {
  max-width: 900px;
  margin: auto;
  padding: 2rem;
}

.p-datatable {
  margin-top: 1rem;
}
</style>
