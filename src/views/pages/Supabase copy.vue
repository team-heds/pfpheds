<template>
        <TheNavbar />

    <div class="p-4">
      <h1 class="text-2xl mb-3">Supabase Realtime Demo</h1>
      <p class="text-600 text-sm mb-3">Backend: {{ backendUrl }}</p>
      
      <!-- Auth section -->
      <div class="mb-4 border-1 surface-border border-round p-3" style="max-width: 520px;">
        <div class="mb-2 text-800 font-medium">Authentification</div>
        <div v-if="user" class="text-700 mb-2">
          Connecté en tant que <strong>{{ user.email }}</strong>
        </div>
        <div class="grid" style="row-gap: .5rem;">
          <div class="col-12">
            <InputText v-model="email" placeholder="email" class="w-full" type="email" />
          </div>
          <div class="col-12">
            <InputText v-model="password" placeholder="mot de passe" class="w-full" type="password" />
          </div>
          <div class="col-12 flex gap-2 justify-content-end">
            <Button size="small" :loading="authLoading" label="S'inscrire" @click="handleSignUp" />
            <Button size="small" :loading="authLoading" label="Se connecter" @click="handleSignIn" />
            <Button size="small" severity="secondary" outlined :loading="authLoading" label="Se déconnecter" @click="handleSignOut" />
          </div>
        </div>
      </div>
  
      <!-- Profile section -->
      <div v-if="isAuthenticated" class="mb-4 border-1 surface-border border-round p-3" style="max-width: 520px;">
        <div class="mb-2 text-800 font-medium">Profil Utilisateur</div>
        <div v-if="profileLoading" class="text-700">Chargement du profil...</div>
        <div v-else-if="profile" class="grid formgrid" style="row-gap: .5rem;">
          <div class="col-12 field">
            <label for="username">Username</label>
            <InputText id="username" v-model="profile.username" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="prenom">Prénom</label>
            <InputText id="prenom" v-model="profile.prenom" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="nom">Nom</label>
            <InputText id="nom" v-model="profile.nom" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="photo_url">Photo URL</label>
            <InputText id="photo_url" v-model="profile.photo_url" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="ville">Ville</label>
            <InputText id="ville" v-model="profile.ville" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="roles">Roles (JSON)</label>
            <InputText id="roles" v-model="profile.roles" class="w-full" />
          </div>
          <div class="col-12 field">
            <label for="communities">Communities (JSON)</label>
            <InputText id="communities" v-model="profile.communities" class="w-full" />
          </div>
          <div class="col-12 flex justify-content-end">
            <Button size="small" :loading="savingProfile" label="Enregistrer profil" @click="handleUpsertProfile" />
          </div>
        </div>
         <div v-else class="text-600">Aucun profil trouvé. Enregistrez pour en créer un.</div>
      </div>
  
      <!-- Events section (inchangée) -->
      
      <!-- Institutions Section 
      <div class="mb-4 border-1 surface-border border-round p-3">
        <div class="mb-2 text-800 font-medium">Institutions</div>
        <div v-if="institutionsLoading">Chargement des institutions...</div>
        <div v-else-if="institutionsError" class="text-red-500">{{ institutionsError }}</div>
        <DataTable v-else :value="institutions" stripedRows responsiveLayout="scroll" size="small">
                    <Column header="Image">
            <template #body="slotProps">
              <img v-if="slotProps.data.ImageURL && slotProps.data.ImageURL.length > 0" :src="slotProps.data.ImageURL[0]" :alt="`Image de ${slotProps.data.Name}`" class="w-9rem shadow-2 border-round" />
            </template>
          </Column>
          <Column field="Name" header="Nom" :sortable="true"></Column>
          <Column field="Canton" header="Canton" :sortable="true"></Column>
          <Column field="Locality" header="Localité" :sortable="true"></Column>
          <Column field="NPA" header="NPA" :sortable="true"></Column>
          <Column field="Address" header="Adresse"></Column>
          <Column field="Category" header="Catégorie" :sortable="true"></Column>
          <Column field="NomChef" header="Nom du Chef"></Column>
          <Column field="PhoneChef" header="Téléphone Chef"></Column>
          <Column field="MailChef" header="Email Chef"></Column>
          <Column field="Language" header="Langue"></Column>
          <Column field="AccordCadreDate" header="Date Accord Cadre"></Column>
          <Column field="ConventionDate" header="Date Convention"></Column>
          <Column field="Description" header="Description"></Column>
          <Column field="Note" header="Note"></Column>
          <Column field="CyberleanURL" header="URL Cyberlearn"></Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" @click="editInstitution(slotProps.data)"></Button>
              <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="deleteInstitution(slotProps.data.InstitutionId)"></Button>
            </template>
          </Column>
        </DataTable>
      </div>
-->
      
      <!-- Edit Institution Dialog
      <Dialog v-model:visible="isEditDialogVisible" header="Modifier l'institution" :modal="true" style="width: 50vw;">
        <div v-if="editingInstitution" class="p-fluid grid formgrid">
          <div class="field col-12 md:col-6">
            <label for="name">Nom</label>
            <InputText id="name" v-model="editingInstitution.Name" />
          </div>
          <div class="field col-12 md:col-6">
            <label for="category">Catégorie</label>
            <InputText id="category" v-model="editingInstitution.Category" />
          </div>
          <div class="field col-12">
            <label for="address">Adresse</label>
            <InputText id="address" v-model="editingInstitution.Address" />
          </div>
          <div class="field col-12 md:col-4">
            <label for="locality">Localité</label>
            <InputText id="locality" v-model="editingInstitution.Locality" />
          </div>
          <div class="field col-12 md:col-4">
            <label for="npa">NPA</label>
            <InputText id="npa" v-model="editingInstitution.NPA" />
          </div>
          <div class="field col-12 md:col-4">
            <label for="canton">Canton</label>
            <InputText id="canton" v-model="editingInstitution.Canton" />
          </div>
          <div class="field col-12 md:col-6">
            <label for="nomchef">Nom du Chef</label>
            <InputText id="nomchef" v-model="editingInstitution.NomChef" />
          </div>
          <div class="field col-12 md:col-6">
            <label for="mailchef">Email Chef</label>
            <InputText id="mailchef" type="email" v-model="editingInstitution.MailChef" />
          </div>
          <div class="field col-12 md:col-6">
            <label for="phonechef">Téléphone Chef</label>
            <InputText id="phonechef" v-model="editingInstitution.PhoneChef" />
          </div>
           <div class="field col-12 md:col-6">
            <label for="language">Langue</label>
            <InputText id="language" v-model="editingInstitution.Language" />
          </div>
          <div class="field col-12">
            <label for="description">Description</label>
            <Textarea id="description" v-model="editingInstitution.Description" rows="3" />
          </div>
          <div class="field col-12">
            <label for="note">Note</label>
            <Textarea id="note" v-model="editingInstitution.Note" rows="3" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" @click="isEditDialogVisible = false" class="p-button-text"/>
          <Button label="Enregistrer" icon="pi pi-check" @click="saveInstitution" :loading="savingInstitution"/>
        </template>
      </Dialog>
 -->
      <!-- Events section (inchangée) -->
      <div class="grid mb-3" style="row-gap: .5rem; max-width: 520px;">
        <!-- ... votre code pour ajouter/éditer des événements ... -->
      </div>
      <div v-if="loading" class="text-700">Chargement...</div>
      <ul v-else class="list-none p-0 m-0" style="max-height: 380px; overflow: auto;">
        <!-- ... votre code pour lister les événements ... -->
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import { supabase } from '@/supabase.js'
  import { useToast } from 'primevue/usetoast'
  import { storeToRefs } from 'pinia'
  import { useUserStore } from '@/stores/userStore'
  import { useInstitutionsStore } from '@/stores/institutionsStore'
  import TheNavbar from '@/components/TheNavbar.vue';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import InputText from 'primevue/inputtext';
  import Dialog from 'primevue/dialog';
  import Textarea from 'primevue/textarea';

  const toast = useToast()
  const userStore = useUserStore()
  const institutionsStore = useInstitutionsStore()
  
  // State from Pinia store
  const { user, profile, profileLoading, authLoading, isAuthenticated } = storeToRefs(userStore)
  //const { institutions, loading: institutionsLoading, error: institutionsError } = storeToRefs(institutionsStore)
  
  // Local state for auth form
  const email = ref('')
  const password = ref('')
  
  // Local state for profile form
  const savingProfile = ref(false)

  // Local state for institutions
  const editingInstitution = ref(null)
  const isEditDialogVisible = ref(false)
  const savingInstitution = ref(false)
  
  // Backend URL
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
  
  // Auth handlers
  const handleSignUp = async () => {
    try {
      await userStore.signUp(email.value, password.value)
      toast.add({ severity: 'success', summary: "Inscription envoyée", detail: "Vérifie tes emails pour confirmer", life: 3000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur inscription', detail: e.message, life: 4000 })
    }
  }
  
  const handleSignIn = async () => {
    try {
      await userStore.signIn(email.value, password.value)
      toast.add({ severity: 'success', summary: 'Connecté', detail: user.value?.email || '', life: 2500 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur connexion', detail: e.message, life: 4000 })
    }
  }
  
  const handleSignOut = async () => {
    try {
      await userStore.signOut()
      toast.add({ severity: 'success', summary: 'Déconnecté', life: 2000 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur déconnexion', detail: e.message, life: 4000 })
    }
  }
  
  // Profile handler
  
  // Institution handlers
  const editInstitution = (institution) => {
    editingInstitution.value = { ...institution }; // Create a copy for editing
    isEditDialogVisible.value = true;
  };

  const saveInstitution = async () => {
    if (!editingInstitution.value) return;
    savingInstitution.value = true;
    try {
      await institutionsStore.updateInstitution(editingInstitution.value.InstitutionId, editingInstitution.value);
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Institution mise à jour', life: 3000 });
      isEditDialogVisible.value = false;
      editingInstitution.value = null;
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
    } finally {
      savingInstitution.value = false;
    }
  };

  const deleteInstitution = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette institution ?')) {
      try {
        await institutionsStore.deleteInstitution(id);
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Institution supprimée', life: 3000 });
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: e.message, life: 4000 });
      }
    }
  };

  // Profile handler
  const handleUpsertProfile = async () => {
    try {
      savingProfile.value = true
      // On envoie uniquement les champs modifiables
      const fieldsToUpdate = {
        username: profile.value.username,
        prenom: profile.value.prenom,
        nom: profile.value.nom,
        photo_url: profile.value.photo_url,
        ville: profile.value.ville,
        roles: profile.value.roles,
        communities: profile.value.communities,
      }
      await userStore.upsertProfile(fieldsToUpdate)
      toast.add({ severity: 'success', summary: 'Profil enregistré', life: 2500 })
    } catch (e) {
      toast.add({ severity: 'error', summary: 'Erreur profil', detail: e.message, life: 4000 })
    } finally {
      savingProfile.value = false
    }
  }
  
  
  // --- LOGIQUE POUR LES "EVENTS" (inchangée) ---
  const events = ref([])
  const loading = ref(true)
  let eventsChannel = null
  
  const loadInitial = async () => {
    loading.value = true
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50)
    if (error) {
      toast.add({ severity: 'error', summary: 'Erreur (load)', detail: error.message, life: 4000 })
    } else {
      events.value = data || []
    }
    loading.value = false
  }
  
  const subscribeRealtime = () => {
    eventsChannel = supabase
      .channel('events-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if (payload.eventType === 'INSERT') events.value = [payload.new, ...events.value]
        else if (payload.eventType === 'UPDATE') events.value = events.value.map(r => (r.id === payload.new.id ? payload.new : r))
        else if (payload.eventType === 'DELETE') events.value = events.value.filter(r => r.id !== payload.old.id)
      })
      .subscribe()
  }
  
    onMounted(async () => {
    institutionsStore.fetchInstitutions()
    await loadInitial()
    subscribeRealtime()
    // L'initialisation de l'auth se fait maintenant dans main.js via userStore.init()
  })
  
  onBeforeUnmount(() => {
    if (eventsChannel) supabase.removeChannel(eventsChannel)
    // Le dispose du store peut se faire dans App.vue si nécessaire
    // userStore.dispose() 
  })
  
  </script>