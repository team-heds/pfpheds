<template>
  <Navbar />
  <div class="admin-layout">
    <div class="sidebar-left">
      <LeftSidebar />
    </div>
    
    <main class="main-content">
      <div class="page-header">
        <h1 class="title">Administration Alp'in Physio</h1>
        <p class="subtitle">Gestion des membres et événements de l'association</p>
      </div>

      <div v-if="!isAdmin" class="alert alert-warning">
        <i class="pi pi-exclamation-triangle"></i>
        <p>Vous devez être administrateur de l'association pour accéder à cette page.</p>
      </div>

      <TabView v-else>
        <!-- Onglet Membres -->
        <TabPanel header="Membres">
          <div class="mb-3">
            <Button 
              label="Ajouter un membre" 
              icon="pi pi-user-plus" 
              @click="showAddMemberDialog = true" 
              class="p-button-primary"
            />
          </div>

          <DataTable 
            :value="members" 
            :loading="loading"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column field="prenom" header="Prénom"></Column>
            <Column field="nom" header="Nom"></Column>
            <Column field="email" header="Email"></Column>
            <Column field="poste" header="Poste"></Column>
            <Column field="role" header="Rôle">
              <template #body="slotProps">
                <Tag 
                  :value="slotProps.data.role === 'admin' ? 'Admin' : 'Membre'" 
                  :severity="slotProps.data.role === 'admin' ? 'danger' : 'info'"
                />
              </template>
            </Column>
            <Column field="joined_at" header="Membre depuis">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.joined_at) }}
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-sm p-button-text"
                  @click="editMember(slotProps.data)"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-sm p-button-text p-button-danger"
                  @click="confirmDelete(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- Onglet Événements -->
        <TabPanel header="Événements Alp'in Physio">
          <div class="mb-3">
            <Button 
              label="Créer un événement" 
              icon="pi pi-calendar-plus" 
              @click="createEvent" 
              class="p-button-primary"
            />
          </div>

          <DataTable 
            :value="associationEvents" 
            stripedRows
            responsiveLayout="scroll"
          >
            <Column field="title" header="Titre"></Column>
            <Column field="start_date" header="Date de début">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.start_date) }}
              </template>
            </Column>
            <Column field="lieu" header="Lieu"></Column>
            <Column header="Participants">
              <template #body="slotProps">
                <Tag :value="(slotProps.data.registered || []).length" severity="success" />
              </template>
            </Column>
            <Column header="Actions">
              <template #body="slotProps">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-sm p-button-text"
                  @click="viewEvent(slotProps.data)"
                />
                <Button 
                  icon="pi pi-pencil" 
                  class="p-button-sm p-button-text"
                  @click="editEvent(slotProps.data)"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-sm p-button-text p-button-danger"
                  @click="confirmDeleteEvent(slotProps.data)"
                />
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <!-- Onglet Statistiques -->
        <TabPanel header="Statistiques">
          <div class="stats-grid">
            <div class="stat-card">
              <i class="pi pi-users"></i>
              <div class="stat-content">
                <h3>{{ members.length }}</h3>
                <p>Membres actifs</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="pi pi-calendar"></i>
              <div class="stat-content">
                <h3>{{ associationEvents.length }}</h3>
                <p>Événements</p>
              </div>
            </div>
            <div class="stat-card">
              <i class="pi pi-user-plus"></i>
              <div class="stat-content">
                <h3>{{ totalParticipants }}</h3>
                <p>Total participants</p>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>

      <!-- Dialog ajout/édition membre -->
      <Dialog 
        v-model:visible="showAddMemberDialog" 
        modal 
        header="Ajouter un membre"
        :style="{ width: '500px' }"
      >
        <div class="form-group">
          <label>Prénom</label>
          <InputText v-model="memberForm.prenom" class="w-full" />
        </div>
        <div class="form-group">
          <label>Nom</label>
          <InputText v-model="memberForm.nom" class="w-full" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <InputText v-model="memberForm.email" type="email" class="w-full" />
        </div>
        <div class="form-group">
          <label>User ID (UID)</label>
          <InputText v-model="memberForm.user_id" class="w-full" placeholder="UID Supabase" />
        </div>
        <div class="form-group">
          <label>Poste</label>
          <InputText v-model="memberForm.poste" class="w-full" placeholder="Ex: Président, Secrétaire..." />
        </div>
        <div class="form-group">
          <label>Rôle</label>
          <Dropdown 
            v-model="memberForm.role" 
            :options="roleOptions" 
            optionLabel="label" 
            optionValue="value"
            class="w-full"
          />
        </div>
        <template #footer>
          <Button label="Annuler" @click="showAddMemberDialog = false" class="p-button-text" />
          <Button label="Enregistrer" @click="saveMember" class="p-button-primary" />
        </template>
      </Dialog>
    </main>

    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import { useAlpinPhysioStore } from '@/stores/alpinPhysioStore';
import { useEventStore } from '@/stores/eventStore';
import Navbar from '@/components/common/utils/Navbar.vue';
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import { useConfirm } from 'primevue/useconfirm';

const router = useRouter();
const confirm = useConfirm();
const alpinPhysioStore = useAlpinPhysioStore();
const eventStore = useEventStore();

// État
const currentUser = ref(null);
const userId = computed(() => currentUser.value?.id || null);
const showAddMemberDialog = ref(false);
const editingMember = ref(null);

const memberForm = ref({
  user_id: '',
  nom: '',
  prenom: '',
  email: '',
  poste: '',
  role: 'member'
});

const roleOptions = [
  { label: 'Membre', value: 'member' },
  { label: 'Administrateur', value: 'admin' }
];

// Computed
const members = computed(() => alpinPhysioStore.members);
const loading = computed(() => alpinPhysioStore.loading);
const isAdmin = computed(() => alpinPhysioStore.isAdmin(userId.value));

const associationEvents = computed(() => 
  eventStore.events.filter(e => e.type === 'alpinphysio')
);

const totalParticipants = computed(() => {
  return associationEvents.value.reduce((total, event) => {
    return total + (event.registered?.length || 0);
  }, 0);
});

// Lifecycle
onMounted(async () => {
  // Obtenir l'utilisateur courant
  const { data: { session } } = await supabase.auth.getSession();
  currentUser.value = session?.user || null;

  // Charger les données
  await alpinPhysioStore.fetchMembers();
  await eventStore.fetchEvents();

  // Vérifier les permissions
  if (!isAdmin.value) {
    console.warn('Utilisateur non admin, accès restreint');
  }
});

// Méthodes
function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function editMember(member) {
  editingMember.value = member;
  memberForm.value = {
    user_id: member.user_id,
    nom: member.nom,
    prenom: member.prenom,
    email: member.email,
    poste: member.poste,
    role: member.role
  };
  showAddMemberDialog.value = true;
}

async function saveMember() {
  try {
    if (editingMember.value) {
      await alpinPhysioStore.updateMember(editingMember.value.id, memberForm.value);
    } else {
      await alpinPhysioStore.addMember(memberForm.value);
    }
    showAddMemberDialog.value = false;
    resetForm();
  } catch (err) {
    alert('Erreur lors de l\'enregistrement: ' + err.message);
  }
}

function resetForm() {
  memberForm.value = {
    user_id: '',
    nom: '',
    prenom: '',
    email: '',
    poste: '',
    role: 'member'
  };
  editingMember.value = null;
}

function confirmDelete(member) {
  confirm.require({
    message: `Voulez-vous vraiment supprimer ${member.prenom} ${member.nom} ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await alpinPhysioStore.deleteMember(member.id);
      } catch (err) {
        alert('Erreur lors de la suppression: ' + err.message);
      }
    }
  });
}

function createEvent() {
  router.push('/events');
}

function viewEvent(event) {
  router.push('/events');
}

function editEvent(event) {
  router.push('/events');
}

function confirmDeleteEvent(event) {
  confirm.require({
    message: `Voulez-vous vraiment supprimer l'événement "${event.title}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await eventStore.deleteEvent(event.id);
      } catch (err) {
        alert('Erreur lors de la suppression: ' + err.message);
      }
    }
  });
}
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.main-content {
  min-width: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-color-secondary);
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.alert-warning {
  background: var(--yellow-50);
  color: var(--yellow-900);
  border: 1px solid var(--yellow-200);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card i {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.stat-content p {
  margin: 0;
  color: var(--text-color-secondary);
}

@media (max-width: 1024px) {
  .admin-layout {
    grid-template-columns: 1fr;
  }
  
  .sidebar-left,
  .sidebar-right {
    display: none;
  }
}
</style>
